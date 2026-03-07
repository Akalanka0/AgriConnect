import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Region = sequelize.define('Region', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    district: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    zone: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    division: {
        type: DataTypes.STRING(100),
        allowNull: false
    }
}, {
    tableName: 'regions',
    timestamps: false
});

export default Region;
