import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const FarmerDetail = sequelize.define('FarmerDetail', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
    },
    farmer_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: {
            name: 'farmer_id',
            msg: 'Farmer ID already exists'
        },
        validate: {
            notEmpty: {
                msg: 'Farmer ID is required'
            }
        }
    }
}, {
    tableName: 'farmer_details',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['farmer_id']
        }
    ]
});

export default FarmerDetail;
