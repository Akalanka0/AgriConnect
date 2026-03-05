import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Meeting = sequelize.define('Meeting', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    meeting_title: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    meeting_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    meeting_time: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    meeting_duration: {
        type: DataTypes.STRING(20),
        defaultValue: '30'
    },
    meeting_notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    instructor_note: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'declined', 'reschedule', 'cancelled'),
        defaultValue: 'pending'
    },
    requested_by: {
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
    suggested_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    suggested_time: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    zoom_link: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    cancel_reason: {
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
