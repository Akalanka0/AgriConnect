import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const InstructorDetail = sequelize.define('InstructorDetail', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: {
            name: 'user_id',
            msg: 'This user already has instructor details'
        },
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    instructor_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: {
            name: 'instructor_id',
            msg: 'Instructor ID already exists'
        },
        validate: {
            notEmpty: {
                msg: 'Instructor ID is required'
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
    zone: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    assigned_divisions: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
    },
    specialization: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    experience: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    qualifications: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    average_rating: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0.0
    }
}, {
    tableName: 'instructor_details',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        { unique: true, fields: ['user_id'] },
        { unique: true, fields: ['instructor_id'] },
        { fields: ['zone'] }
    ]
});

export default InstructorDetail;
