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
    // Specific user ID when recipient_type is 'select'
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
    message_type: {
        type: DataTypes.ENUM('text', 'file'),
        defaultValue: 'text',
        allowNull: false
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    read_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'messages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['recipient_id', 'recipient_type', 'is_read']
        },
        {
            fields: ['sender_id']
        }
    ]
});

export default Message;
