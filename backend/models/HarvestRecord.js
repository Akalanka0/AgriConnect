import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const HarvestRecord = sequelize.define('HarvestRecord', {
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
    crop: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    location: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    quantity: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    quality: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    instructor_division: {
        type: DataTypes.STRING(255),
        allowNull: true
    }
}, {
    tableName: 'harvest_records',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default HarvestRecord;
