import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    full_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Full name is required'
            },
            len: {
                args: [2, 255],
                msg: 'Full name must be between 2 and 255 characters'
            }
        }
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: {
            name: 'email',
            msg: 'Email already exists'
        },
        validate: {
            isEmail: {
                msg: 'Please provide a valid email address'
            },
            notEmpty: {
                msg: 'Email is required'
            }
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Password is required'
            },
            len: {
                args: [8, 255],
                msg: 'Password must be at least 8 characters long'
            }
        }
    },
    role: {
        type: DataTypes.ENUM('admin', 'farmer', 'instructor'),
        allowNull: false,
        validate: {
            isIn: {
                args: [['admin', 'farmer', 'instructor']],
                msg: 'Role must be admin, farmer, or instructor'
            }
        }
    },
    nic: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: {
            name: 'nic',
            msg: 'NIC already exists'
        },
        validate: {
            notEmpty: {
                msg: 'NIC is required'
            },
            // Sri Lankan NIC format: 9 digits + 1 letter (old) or 12 digits (new)
            is: {
                args: /^[0-9]{9}[vVxX]|[0-9]{12}$/,
                msg: 'Invalid NIC format. Use 9 digits + V/X or 12 digits'
            }
        }
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Phone number is required'
            },
            // Sri Lankan phone format: 07XXXXXXXX or +947XXXXXXXX
            is: {
                args: /^(\+94|0)?[0-9]{9}$/,
                msg: 'Invalid phone number format'
            }
        }
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'suspended'),
        defaultValue: 'active',
        allowNull: false
    }
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['email']
        },
        {
            unique: true,
            fields: ['nic']
        },
        {
            fields: ['role']
        },
        {
            fields: ['status']
        }
    ]
});

export default User;
