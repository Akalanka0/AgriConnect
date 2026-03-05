import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const PestReport = sequelize.define('PestReport', {
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
    type: {
        type: DataTypes.ENUM('pest', 'disease', 'other'),
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    crop: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    severity: {
        type: DataTypes.ENUM('low', 'medium', 'high'),
        allowNull: false
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    resolution: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    instructor_division: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    instructor_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('pending', 'in_progress', 'resolved'),
        defaultValue: 'pending',
        allowNull: false
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
    }
}, {
    tableName: 'pest_reports',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default PestReport;
