import { Message } from '../models/index.js';
import cloudinary from '../utils/cloudinary.js';
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
        const { subject, content, recipientType, recipientIds } = req.body;
        
        // Log for debugging
        console.log('Send Message Request:', { 
            subject, 
            recipientType, 
            hasFile: !!req.file 
        });

        // Parse recipientIds if provided (FormData sends as string)
        let parsedRecipientIds = [];
        if (recipientIds) {
            try {
                parsedRecipientIds = typeof recipientIds === 'string' ? JSON.parse(recipientIds) : recipientIds;
            } catch (e) {
                // If simple value
                parsedRecipientIds = [recipientIds];
            }
        }

        // Handle File Upload to Cloudinary
        let attachmentUrl = null;
        let attachmentPublicId = null;
        let attachmentName = null;

        if (req.file) {
            const uploadPromise = new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'agriconnect_messages',
                        resource_type: 'auto'
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                bufferToStream(req.file.buffer).pipe(uploadStream);
            });

            try {
                const result = await uploadPromise;
                attachmentUrl = result.secure_url;
                attachmentPublicId = result.public_id;
                attachmentName = req.file.originalname;
            } catch (uploadError) {
                console.error('Cloudinary upload failed:', uploadError);
                return res.status(500).json({
                    success: false,
                    error: {
                        message: 'Failed to upload attachment',
                        details: uploadError.message
                    }
                });
            }
        }

        // Sender ID (assume from auth middleware, fallback to admin seed id if missing for now, though auth is required)
        // In this app, admin user usually has ID 1 or similar. 
        // req.user should be populated by authMiddleware
        const senderId = req.user ? req.user.id : null;

        if (!senderId) {
             return res.status(401).json({ success: false, error: { message: 'Unauthorized: Sender not identified' } });
        }

        // Create Message Records
        if (recipientType === 'select') {
            if (!parsedRecipientIds || parsedRecipientIds.length === 0) {
                 return res.status(400).json({ success: false, error: { message: 'No recipients selected' } });
            }

            // Create a message for each selected recipient
            // Note: Efficient bulk create could be used, but loop is fine for reasonable numbers
            const messagesData = parsedRecipientIds.map(recipientId => ({
                subject,
                content,
                recipient_type: 'select',
                recipient_id: recipientId,
                sender_id: senderId,
                attachment_url: attachmentUrl,
                attachment_public_id: attachmentPublicId,
                attachment_name: attachmentName
            }));

            await Message.bulkCreate(messagesData);
            
            return res.status(200).json({ 
                success: true, 
                message: `Message sent to ${parsedRecipientIds.length} recipients` 
            });

        } else {
            // Broadcast (all, farmers, instructors)
            const message = await Message.create({
                subject,
                content,
                recipient_type: recipientType,
                recipient_id: null,
                sender_id: senderId,
                attachment_url: attachmentUrl,
                attachment_public_id: attachmentPublicId,
                attachment_name: attachmentName
            });

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
