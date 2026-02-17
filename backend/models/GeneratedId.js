import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const GeneratedId = sequelize.define('GeneratedId', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    type: {
        type: DataTypes.ENUM('farmer', 'instructor'),
        allowNull: false
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('active', 'used'),
        defaultValue: 'active',
        allowNull: false
    }
}, {
    tableName: 'generated_ids',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default GeneratedId;
