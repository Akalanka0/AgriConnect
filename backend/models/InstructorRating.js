import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const InstructorRating = sequelize.define('InstructorRating', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    instructor_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'instructor_details',
            key: 'instructor_id'
        }
    },
    farmer_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'farmer_details',
            key: 'farmer_id'
        }
    },
    farmer_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 5
        }
    },
    comments: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'instructor_ratings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['instructor_id']
        },
        {
            fields: ['farmer_id']
        }
    ]
});

export default InstructorRating;
