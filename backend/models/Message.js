import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Message = sequelize.define('Message', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    subject: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Subject is required'
            }
        }
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Message content is required'
            }
        }
    },
    recipient_type: {
        type: DataTypes.ENUM('all', 'farmers', 'instructors', 'select', 'admin'),
        allowNull: false
    },
    // If recipient_type is 'select', we store the user ID here
    // Note: For multiple users in 'select', we might need a separate mapping table, 
    // but for now let's assume 'select' means single user or we handle multiple by creating multiple records
    // or storing as JSON array. 
    // The user input 'select' implies selecting specific users.
    // The previous frontend code handled 'select' but the backend logic for multiple recipients needs care.
    // For simplicity given the requirement "Structured data", let's assume we create one record per message broadcast.
    // If multiple users are selected, the controller will handle creating multiple records or we use a junction table.
    // Let's stick to simple: One message record per "Send Action".
    // If 'select' is used with multiple users, we might create multiple rows.
    recipient_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    sender_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    attachment_url: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    attachment_public_id: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    attachment_name: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'messages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default Message;
