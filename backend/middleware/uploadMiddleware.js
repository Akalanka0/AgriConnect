import multer from 'multer';
import cloudinary, { uploadImage, uploadPDF, getFileType } from '../utils/cloudinary.js';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images and PDFs are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

const uploadToCloudinary = async (file) => {
    if (!file) {
        return null;
    }

    // Check if file has buffer property
    if (!file.buffer) {
        console.error('File object missing buffer property:', file);
        throw new Error('Invalid file object: missing buffer property');
    }

    try {
        const b64 = Buffer.from(file.buffer).toString("base64");
        let dataURI = "data:" + file.mimetype + ";base64," + b64;
        
        const fileType = getFileType(file.mimetype);
        let result;

        if (fileType === 'image') {
            result = await uploadImage(dataURI);
        } else if (fileType === 'pdf') {
            result = await uploadPDF(dataURI);
        } else {
            throw new Error('Unsupported file type');
        }

        // Return complete result with metadata
        return {
            secure_url: result.secure_url,
            public_id: result.public_id,
            resource_type: fileType,
            original_name: file.originalname || 'attachment',
            size: file.size,
            mimetype: file.mimetype,
            path: result.secure_url // Use secure_url as path
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error('Failed to upload file to Cloudinary: ' + error.message);
    }
};

// Middleware to handle Cloudinary upload
const uploadToCloudinaryMiddleware = async (req, res, next) => {
    try {
        if (req.file) {
            const uploadResult = await uploadToCloudinary(req.file);
            req.uploadResult = uploadResult;
            // Attach the upload result to req.file for backward compatibility
            req.file = { ...req.file, ...uploadResult };
        }
        next();
    } catch (error) {
        console.error('Cloudinary middleware error:', error);
        return res.status(500).json({
            success: false,
            error: { message: 'File upload failed' }
        });
    }
};

export { upload, uploadToCloudinary, uploadToCloudinaryMiddleware };
