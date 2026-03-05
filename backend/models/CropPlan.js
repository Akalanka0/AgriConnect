import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const CropPlan = sequelize.define('CropPlan', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    crop_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    field_location: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    plant_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    harvest_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    instructor_feedback: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'correction'),
        defaultValue: 'pending',
        allowNull: false
    },
    instructor_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'SET NULL'
    },
    instructor_division: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    farmer_attachments: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    farmer_attachment_names: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    instructor_attachments: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    instructor_attachment_names: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    reviewed_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'crop_plans',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default CropPlan;
