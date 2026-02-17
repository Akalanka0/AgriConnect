import { Pest } from '../../models/index.js';
import { Op } from 'sequelize';

export const createPest = async (req, res) => {
    try {
        const { name, description } = req.body;
        let imageUrl = null;
        let imagePublicId = null;

        if (req.file) {
            imageUrl = req.file.path;
            imagePublicId = req.file.public_id;
        }

        const pest = await Pest.create({
            name,
            description,
            image_url: imageUrl,
            image_public_id: imagePublicId
        });

        return res.status(201).json({
            success: true,
            message: 'Pest created successfully',
            data: pest
        });
    } catch (error) {
        console.error('Error creating pest:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                success: false,
                error: {
                    message: 'Pest with this name already exists.',
                    details: error.message
                }
            });
        }
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to create pest',
                details: error.message
            }
        });
    }
};

export const getPests = async (req, res) => {
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

        const { count, rows: pests } = await Pest.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            data: {
                pests,
                total_items: count,
                current_page: parseInt(page),
                total_pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching pests:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch pests',
                details: error.message
            }
        });
    }
};

export const getPestById = async (req, res) => {
    try {
        const { id } = req.params;
        const pest = await Pest.findByPk(id);

        if (!pest) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Pest not found'
                }
            });
        }

        return res.status(200).json({
            success: true,
            data: pest
        });
    } catch (error) {
        console.error('Error fetching pest by ID:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch pest',
                details: error.message
            }
        });
    }
};

export const updatePest = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        let imageUrl = req.body.image_url; // Keep existing if not updated
        let imagePublicId = req.body.image_public_id; // Keep existing if not updated

        const pest = await Pest.findByPk(id);

        if (!pest) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Pest not found'
                }
            });
        }

        // If a new file is uploaded, update image_url and image_public_id
        if (req.file) {
            // If there was an old image, delete it from Cloudinary
            if (pest.image_public_id) {
                await cloudinary.uploader.destroy(pest.image_public_id);
            }
            imageUrl = req.file.path;
            imagePublicId = req.file.public_id;
        } else if (req.body.clear_image === 'true' && pest.image_public_id) {
            // Option to clear image without uploading a new one
            await cloudinary.uploader.destroy(pest.image_public_id);
            imageUrl = null;
            imagePublicId = null;
        }

        await pest.update({
            name,
            description,
            image_url: imageUrl,
            image_public_id: imagePublicId
        });

        return res.status(200).json({
            success: true,
            message: 'Pest updated successfully',
            data: pest
        });
    } catch (error) {
        console.error('Error updating pest:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                success: false,
                error: {
                    message: 'Pest with this name already exists.',
                    details: error.message
                }
            });
        }
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to update pest',
                details: error.message
            }
        });
    }
};

export const deletePest = async (req, res) => {
    try {
        const { id } = req.params;
        const pest = await Pest.findByPk(id);

        if (!pest) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Pest not found'
                }
            });
        }

        // Delete image from Cloudinary if it exists
        if (pest.image_public_id) {
            await cloudinary.uploader.destroy(pest.image_public_id);
        }

        await pest.destroy();

        return res.status(200).json({
            success: true,
            message: 'Pest deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting pest:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to delete pest',
                details: error.message
            }
        });
    }
};
