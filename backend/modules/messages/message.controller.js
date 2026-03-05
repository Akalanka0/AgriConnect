import { Message, User, FarmerDetail, InstructorDetail } from '../../models/index.js';
import { Op } from 'sequelize';
import { MessageService } from '../../services/messageService.js';
import { upload, uploadToCloudinaryMiddleware } from '../../middleware/uploadMiddleware.js';

// Middleware for handling file uploads in messages
export const uploadMessageAttachment = (req, res, next) => {
    upload.single('attachment')(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                error: { message: 'File upload failed' }
            });
        }
        uploadToCloudinaryMiddleware(req, res, next);
    });
};

export const sendMessage = async (req, res) => {
    try {
        const { subject, content, recipient_type, recipient_ids } = req.body;
        const io = req.app.get('io'); // Get Socket.IO instance

        // Sender ID from auth middleware
        const senderId = req.user ? req.user.id : null;

        if (!senderId) {
             return res.status(401).json({ success: false, error: { message: 'Unauthorized: Sender not identified' } });
        }

        // Handle different recipient types using MessageService
        if (recipient_type === 'select') {
            // Parse recipient_ids if provided (FormData sends as string)
            let parsedRecipientIds = [];
            if (recipient_ids) {
                try {
                    parsedRecipientIds = typeof recipient_ids === 'string' ? JSON.parse(recipient_ids) : recipient_ids;
                } catch (e) {
                    // If simple value
                    parsedRecipientIds = [recipient_ids];
                }
            }

            if (!parsedRecipientIds || parsedRecipientIds.length === 0) {
                 return res.status(400).json({ success: false, error: { message: 'No recipients selected' } });
            }

            // Extract attachment data once — file was already uploaded to Cloudinary by uploadMessageAttachment middleware
            const attachment_url = req.file ? req.file.path : null;
            const attachment_name = req.file ? req.file.originalname : null;
            const attachment_public_id = req.file ? (req.file.public_id || null) : null;

            // Create a message record per recipient (no re-upload)
            const createdMessages = [];
            for (const recipientId of parsedRecipientIds) {
                const message = await Message.create({
                    sender_id: senderId,
                    recipient_id: recipientId,
                    recipient_type: 'select',
                    subject,
                    content,
                    attachment_url,
                    attachment_name,
                    attachment_public_id,
                    message_type: req.file ? 'file' : 'text'
                });
                createdMessages.push(message);
            }

            // Broadcast via WebSocket for each recipient
            if (io) {
                const senderUser = await User.findByPk(senderId, {
                    attributes: ['id', 'full_name', 'role'],
                    include: [
                        {
                            model: FarmerDetail,
                            as: 'farmerDetail',
                            required: false,
                            attributes: ['farmer_id']
                        },
                        {
                            model: InstructorDetail,
                            as: 'instructorDetail',
                            required: false,
                            attributes: ['instructor_id']
                        }
                    ]
                });
                
                createdMessages.forEach(message => {
                    // Get the generated ID based on role
                    let generatedId = null;
                    if (senderUser.role === 'farmer' && senderUser.farmerDetail) {
                        generatedId = senderUser.farmerDetail.farmer_id;
                    } else if (senderUser.role === 'instructor' && senderUser.instructorDetail) {
                        generatedId = senderUser.instructorDetail.instructor_id;
                    }
                    
                    const messageData = {
                        id: message.id,
                        subject,
                        content,
                        recipient_type: 'select',
                        recipient_id: message.recipient_id,
                        sender_id: senderId,
                        sender: senderUser ? senderUser.full_name : 'Unknown User',
                        senderId: senderUser ? senderUser.id : null,
                        senderDisplayId: generatedId,
                        attachment_url: message.attachment_url,
                        attachment_name: message.attachment_name,
                        type: 'received',
                        date: new Date().toISOString().split('T')[0],
                        is_read: false
                    };
                    
                    // Send to specific user
                    io.to(`user_${message.recipient_id}`).emit('newMessage', messageData);
                });
            }
            
            return res.status(200).json({ 
                success: true, 
                message: `Message sent to ${parsedRecipientIds.length} recipients` 
            });

        } else {
            // Broadcast message — attachment was already uploaded by uploadMessageAttachment middleware
            const messageData = {
                sender_id: senderId,
                recipient_type: recipient_type,
                subject,
                content,
                message_type: req.file ? 'file' : 'text',
                attachment_url: req.file ? req.file.path : null,
                attachment_name: req.file ? req.file.originalname : null,
                attachment_public_id: req.file ? (req.file.public_id || null) : null
            };

            // Pass null for fileAttachment — data is already in messageData, no re-upload needed
            const message = await MessageService.sendMessage(messageData, null);

            // Broadcast via WebSocket
            if (io) {
                const senderUser = await User.findByPk(senderId, {
                    attributes: ['id', 'full_name', 'role'],
                    include: [
                        {
                            model: FarmerDetail,
                            as: 'farmerDetail',
                            required: false,
                            attributes: ['farmer_id']
                        },
                        {
                            model: InstructorDetail,
                            as: 'instructorDetail', 
                            required: false,
                            attributes: ['instructor_id']
                        }
                    ]
                });
                
                // Get the generated ID based on role
                let generatedId = null;
                if (senderUser.role === 'farmer' && senderUser.farmerDetail) {
                    generatedId = senderUser.farmerDetail.farmer_id;
                } else if (senderUser.role === 'instructor' && senderUser.instructorDetail) {
                    generatedId = senderUser.instructorDetail.instructor_id;
                }
                
                const messageData = {
                    id: message.id,
                    subject,
                    content,
                    recipient_type,
                    sender_id: senderId,
                    sender: senderUser ? senderUser.full_name : 'Unknown User',
                    senderId: senderUser ? senderUser.id : null,
                    senderDisplayId: generatedId,
                    attachment_url: message.attachment_url,
                    attachment_name: message.attachment_name,
                    type: 'received',
                    date: new Date().toISOString().split('T')[0],
                    is_read: false
                };
                
                if (recipient_type === 'all') {
                    io.emit('newMessage', messageData);
                } else if (recipient_type === 'admin') {
                    io.to('admin').emit('newMessage', messageData);
                } else if (recipient_type === 'farmers') {
                    io.to('farmer').emit('newMessage', messageData);
                } else if (recipient_type === 'instructors') {
                    io.to('instructor').emit('newMessage', messageData);
                }
            }

            return res.status(200).json({ 
                success: true, 
                message: 'Message sent successfully', 
                data: message 
            });
        }

    } catch (error) {
        console.error('Send message error:', error);
        return res.status(500).json({ 
            success: false, 
            error: { 
                message: 'Failed to send message'
            } 
        });
    }
};
