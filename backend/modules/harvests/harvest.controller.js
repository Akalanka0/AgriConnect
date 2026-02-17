import { Harvest } from '../../models/index.js';
import { Op } from 'sequelize';
import cloudinary from '../../utils/cloudinary.js'; // Import cloudinary for image deletion

export const createHarvest = async (req, res) => {
    try {
        const { name, description } = req.body;
        let imageUrl = null;
        let imagePublicId = null;

        if (req.file) {
            imageUrl = req.file.path;
            imagePublicId = req.file.public_id;
        }

        const harvest = await Harvest.create({
            name,
            description,
            image_url: imageUrl,
            image_public_id: imagePublicId
        });

        return res.status(201).json({
            success: true,
            message: 'Harvest created successfully',
            data: harvest
        });
    } catch (error) {
        console.error('Error creating harvest:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                success: false,
                error: {
                    message: 'Harvest with this name already exists.',
                    details: error.message
                }
            });
        }
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to create harvest',
                details: error.message
            }
        });
    }
};

export const getHarvests = async (req, res) => {
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

        const { count, rows: harvests } = await Harvest.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            data: {
                harvests,
                total_items: count,
                current_page: parseInt(page),
                total_pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching harvests:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch harvests',
                details: error.message
            }
        });
    }
};

export const getHarvestById = async (req, res) => {
    try {
        const { id } = req.params;
        const harvest = await Harvest.findByPk(id);

        if (!harvest) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Harvest not found'
                }
            });
        }

        return res.status(200).json({
            success: true,
            data: harvest
        });
    } catch (error) {
        console.error('Error fetching harvest by ID:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch harvest',
                details: error.message
            }
        });
    }
};

export const updateHarvest = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        let imageUrl = req.body.image_url; // Keep existing if not updated
        let imagePublicId = req.body.image_public_id; // Keep existing if not updated

        const harvest = await Harvest.findByPk(id);

        if (!harvest) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Harvest not found'
                }
            });
        }

        // If a new file is uploaded, update image_url and image_public_id
        if (req.file) {
            // If there was an old image, delete it from Cloudinary
            if (harvest.image_public_id) {
                await cloudinary.uploader.destroy(harvest.image_public_id);
            }
            imageUrl = req.file.path;
            imagePublicId = req.file.public_id;
        } else if (req.body.clear_image === 'true' && harvest.image_public_id) {
            // Option to clear image without uploading a new one
            await cloudinary.uploader.destroy(harvest.image_public_id);
            imageUrl = null;
            imagePublicId = null;
        }

        await harvest.update({
            name,
            description,
            image_url: imageUrl,
            image_public_id: imagePublicId
        });

        return res.status(200).json({
            success: true,
            message: 'Harvest updated successfully',
            data: harvest
        });
    } catch (error) {
        console.error('Error updating harvest:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                success: false,
                error: {
                    message: 'Harvest with this name already exists.',
                    details: error.message
                }
            });
        }
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to update harvest',
                details: error.message
            }
        });
    }
};

export const deleteHarvest = async (req, res) => {
    try {
        const { id } = req.params;
        const harvest = await Harvest.findByPk(id);

        if (!harvest) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Harvest not found'
                }
            });
        }

        // Delete image from Cloudinary if it exists
        if (harvest.image_public_id) {
            await cloudinary.uploader.destroy(harvest.image_public_id);
        }

        await harvest.destroy();

        return res.status(200).json({
            success: true,
            message: 'Harvest deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting harvest:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to delete harvest',
                details: error.message
            }
        });
    }
};
