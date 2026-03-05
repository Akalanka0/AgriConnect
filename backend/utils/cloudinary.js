import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper functions for different file types
export const uploadImage = async (file, folder = 'agri-connect/images') => {
    try {
        const result = await cloudinary.uploader.upload(file, {
            folder,
            resource_type: 'image',
            format: 'webp',
            quality: 'auto:good',
            fetch_format: 'auto'
        });
        return result;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};

export const uploadPDF = async (file, folder = 'agri-connect/documents') => {
    try {
        const result = await cloudinary.uploader.upload(file, {
            folder,
            resource_type: 'raw',
            format: 'pdf',
            pages: true
        });
        return result;
    } catch (error) {
        console.error('Error uploading PDF:', error);
        throw error;
    }
};

export const deleteFile = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
};

export const getFileType = (mimetype) => {
    if (mimetype.startsWith('image/')) {
        return 'image';
    } else if (mimetype === 'application/pdf') {
        return 'pdf';
    }
    return 'raw';
};

export default cloudinary;
