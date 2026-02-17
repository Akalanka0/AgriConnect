import { Crop } from '../../models/index.js';
import { Op } from 'sequelize';
import cloudinary from '../../utils/cloudinary.js'; // Import cloudinary for image deletion

export const createCrop = async (req, res) => {
    try {
        const { name, description } = req.body;
        let imageUrl = null;
        let imagePublicId = null;

        if (req.file) {
            imageUrl = req.file.path;
            imagePublicId = req.file.public_id;
        }

        const crop = await Crop.create({
            name,
            description,
            image_url: imageUrl,
            image_public_id: imagePublicId
        });

        return res.status(201).json({
            success: true,
            message: 'Crop created successfully',
            data: crop
        });
    } catch (error) {
        console.error('Error creating crop:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                success: false,
                error: {
                    message: 'Crop with this name already exists.',
                    details: error.message
                }
            });
        }
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to create crop',
                details: error.message
            }
        });
    }
};

export const getCrops = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = search
            ? {
                  name: {
                      [Op.like]: `%${search}%`
                  }
              }
            : {};

        const { count, rows: crops } = await Crop.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            data: {
                crops,
                total_items: count,
                current_page: parseInt(page),
                total_pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching crops:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch crops',
                details: error.message
            }
        });
    }
};

export const getCropById = async (req, res) => {
    try {
        const { id } = req.params;
        const crop = await Crop.findByPk(id);

        if (!crop) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Crop not found'
                }
            });
        }

        return res.status(200).json({
            success: true,
            data: crop
        });
    } catch (error) {
        console.error('Error fetching crop by ID:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch crop',
                details: error.message
            }
        });
    }
};

export const updateCrop = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        let imageUrl = req.body.image_url; // Keep existing if not updated
        let imagePublicId = req.body.image_public_id; // Keep existing if not updated

        const crop = await Crop.findByPk(id);

        if (!crop) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Crop not found'
                }
            });
        }

        // If a new file is uploaded, update image_url and image_public_id
        if (req.file) {
            // If there was an old image, delete it from Cloudinary
            if (crop.image_public_id) {
                await cloudinary.uploader.destroy(crop.image_public_id);
            }
            imageUrl = req.file.path;
            imagePublicId = req.file.public_id;
        } else if (req.body.clear_image === 'true' && crop.image_public_id) {
            // Option to clear image without uploading a new one
            await cloudinary.uploader.destroy(crop.image_public_id);
            imageUrl = null;
            imagePublicId = null;
        }

        await crop.update({
            name,
            description,
            image_url: imageUrl,
            image_public_id: imagePublicId
        });

        return res.status(200).json({
            success: true,
            message: 'Crop updated successfully',
            data: crop
        });
    } catch (error) {
        console.error('Error updating crop:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                success: false,
                error: {
                    message: 'Crop with this name already exists.',
                    details: error.message
                }
            });
        }
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to update crop',
                details: error.message
            }
        });
    }
};

export const deleteCrop = async (req, res) => {
    try {
        const { id } = req.params;
        const crop = await Crop.findByPk(id);

        if (!crop) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Crop not found'
                }
            });
        }

        // Delete image from Cloudinary if it exists
        if (crop.image_public_id) {
            await cloudinary.uploader.destroy(crop.image_public_id);
        }

        await crop.destroy();

        return res.status(200).json({
            success: true,
            message: 'Crop deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting crop:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to delete crop',
                details: error.message
            }
        });
    }
};
