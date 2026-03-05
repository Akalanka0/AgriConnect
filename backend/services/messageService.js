import { Message } from '../models/index.js';
import { uploadToCloudinary } from '../middleware/uploadMiddleware.js';
import sequelize from '../config/db.js';
import { Op } from 'sequelize';

/**
 * Shared message service for cross-module communication
 * This reduces cross-module dependencies by centralizing message functionality
 */
export class MessageService {
    /**
     * Send a message between users
     */
    static async sendMessage(messageData, fileAttachment = null) {
        const transaction = await sequelize.transaction();
        
        try {
            let attachmentUrl = null;
            
            // Handle file upload if provided
            if (fileAttachment) {
                const uploadResult = await uploadToCloudinary(fileAttachment);
                attachmentUrl = uploadResult.secure_url;
                
                // Store additional Cloudinary metadata
                messageData.attachment_url = attachmentUrl;
                messageData.attachment_public_id = uploadResult.public_id;
                messageData.attachment_name = fileAttachment.originalname || 'attachment';
            }

            const message = await Message.create({
                sender_id: messageData.sender_id,
                recipient_id: messageData.recipient_id,
                recipient_type: messageData.recipient_type,
                subject: messageData.subject,
                content: messageData.content,
                attachment_url: messageData.attachment_url || attachmentUrl,
                attachment_public_id: messageData.attachment_public_id || null,
                attachment_name: messageData.attachment_name || null,
                message_type: messageData.message_type || 'text'
            }, { transaction });

            await transaction.commit();

            return message;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Get messages for a user
     */
    static async getUserMessages(userId, userRole, filters = {}) {
        const whereClause = {
            [Op.or]: [
                { recipient_id: userId },
                { sender_id: userId },
                { 
                    recipient_type: userRole,
                    recipient_id: null 
                },
                { 
                    recipient_type: 'all'
                }
            ]
        };

        // Apply additional filters
        if (filters.is_read !== undefined) {
            whereClause.is_read = filters.is_read;
        }

        if (filters.message_type) {
            whereClause.message_type = filters.message_type;
        }

        return await Message.findAll({
            where: whereClause,
            include: [
                {
                    association: 'sender',
                    attributes: ['id', 'full_name', 'email', 'role']
                }
            ],
            order: [['created_at', 'DESC']],
            limit: filters.limit || 50
        });
    }

    /**
     * Mark message as read
     */
    static async markMessageAsRead(messageId, userId) {
        const message = await Message.findOne({
            where: { 
                id: messageId,
                [Op.or]: [
                    { recipient_id: userId },
                    { recipient_type: 'all' },
                    { recipient_type: userId }
                ]
            }
        });

        if (!message) {
            throw new Error('Message not found or access denied');
        }

        message.is_read = true;
        message.read_at = new Date();
        await message.save();

        return message;
    }

    /**
     * Delete a message
     */
    static async deleteMessage(messageId, userId) {
        const message = await Message.findOne({
            where: { 
                id: messageId,
                recipient_id: userId
            }
        });

        if (!message) {
            throw new Error('Message not found or access denied');
        }

        await message.destroy();
        return true;
    }

    /**
     * Get unread message count
     */
    static async getUnreadCount(userId) {
        return await Message.count({
            where: {
                [Op.or]: [
                    { recipient_id: userId },
                    { recipient_type: 'all' },
                    { recipient_type: userId }
                ],
                is_read: false
            }
        });
    }
}

export default MessageService;
