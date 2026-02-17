import { Message, User } from '../../models/index.js';
import { Op } from 'sequelize';
import { MessageService } from '../../services/messageService.js';
import cloudinary from '../../utils/cloudinary.js';
import { Readable } from 'stream';

const bufferToStream = (buffer) => {
    const readable = new Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);
    return readable;
};

export const sendMessage = async (req, res) => {
    try {
        const { subject, content, recipient_type, recipient_ids } = req.body;
        const io = req.app.get('io'); // Get Socket.IO instance
        
        // Log for debugging
        console.log('Send Message Request:', { 
            subject, 
            recipient_type, 
            hasFile: !!req.file 
        });

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

            // Create messages for each recipient using MessageService
            const createdMessages = [];
            for (const recipientId of parsedRecipientIds) {
                const messageData = {
                    sender_id: senderId,
                    recipient_id: recipientId,
                    recipient_type: 'select',
                    subject,
                    content,
                    message_type: 'text'
                };

                const message = await MessageService.sendMessage(messageData, req.file);
                createdMessages.push(message);
            }

            // Broadcast via WebSocket for each recipient
            if (io) {
                const senderUser = await User.findByPk(senderId, {
                    attributes: ['id', 'full_name', 'role']
                });
                
                createdMessages.forEach(message => {
                    const messageData = {
                        id: message.id,
                        subject,
                        content,
                        recipient_type: 'select',
                        recipient_id: message.recipient_id,
                        sender_id: senderId,
                        sender: senderUser ? `${senderUser.full_name}` : 'Unknown User',
                        senderId: senderUser ? senderUser.id : null,
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
            // Broadcast message using MessageService
            const messageData = {
                sender_id: senderId,
                recipient_type: recipient_type,
                subject,
                content,
                message_type: 'text'
            };

            const message = await MessageService.sendMessage(messageData, req.file);

            // Broadcast via WebSocket
            if (io) {
                const senderUser = await User.findByPk(senderId, {
                    attributes: ['id', 'full_name', 'role']
                });
                
                const messageData = {
                    id: message.id,
                    subject,
                    content,
                    recipient_type,
                    sender_id: senderId,
                    sender: senderUser ? `${senderUser.full_name}` : 'Unknown User',
                    senderId: senderUser ? senderUser.id : null,
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
                message: 'Failed to send message', 
                details: error.message 
            } 
        });
    }
};
