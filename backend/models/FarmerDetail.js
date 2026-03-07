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
        unique: {
            name: 'uq_farmer_user_id',
            msg: 'This user already has farmer details'
        },
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
    },
    district: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'Anuradhapura',
        validate: {
            isIn: {
                args: [['Anuradhapura']],
                msg: 'District must be Anuradhapura'
            }
        }
    },
    locations: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
    }
}, {
    tableName: 'farmer_details',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        { unique: true, fields: ['farmer_id'] }
    ]
});

export default FarmerDetail;
