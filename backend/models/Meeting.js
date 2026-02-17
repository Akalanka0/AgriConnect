import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Meeting = sequelize.define('Meeting', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    meetingTitle: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    meetingDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    meetingTime: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    meetingDuration: {
        type: DataTypes.STRING(20),
        defaultValue: '30'
    },
    meetingNotes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    instructorNote: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'declined', 'reschedule', 'cancelled'),
        defaultValue: 'pending'
    },
    requestedBy: {
        type: DataTypes.ENUM('farmer', 'instructor'),
        allowNull: false
    },
    farmer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    instructor_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    division: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    suggestedDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    suggestedTime: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    zoomLink: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    cancelReason: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'meetings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default Meeting;
