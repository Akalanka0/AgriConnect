console.log('uploadMiddleware.js loaded successfully');
import multer from 'multer';
import cloudinary from '../utils/cloudinary.js';
import streamifier from 'streamifier';

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

const uploadToCloudinary = (req, res, next) => {
    if (!req.file) {
        return next();
    }

    const b64 = Buffer.from(req.file.buffer).toString("base64");
    let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

    const isPdf = req.file.mimetype === 'application/pdf';

    cloudinary.uploader.upload(dataURI, {
        folder: 'agriconnect',
        resource_type: isPdf ? 'image' : 'auto', // Forcing PDF to 'image' allows preview/thumbnails in Cloudinary
        flags: isPdf ? 'attachment:false' : undefined // Suggests browser preview rather than download
    })
    .then((result) => {
        req.file.path = result.secure_url;
        req.file.public_id = result.public_id;
        next();
    })
    .catch((error) => {
        console.error('Cloudinary upload error:', error);
        const uploadError = new Error('Failed to upload file to Cloudinary.');
        uploadError.cloudinaryDetails = error;
        next(uploadError);
    });
};

export { upload, uploadToCloudinary };
