import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Harvest = sequelize.define('Harvest', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: {
                msg: 'Harvest name is required'
            },
            len: {
                args: [2, 255],
                msg: 'Harvest name must be between 2 and 255 characters'
            }
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    image_url: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    image_public_id: {
        type: DataTypes.STRING(255),
        allowNull: true
    }
}, {
    tableName: 'harvests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default Harvest;
