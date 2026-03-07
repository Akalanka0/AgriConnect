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
        type: DataTypes.ENUM('admin', 'Super Admin', 'farmer', 'instructor'),
        allowNull: false,
        validate: {
            isIn: {
                args: [['admin', 'Super Admin', 'farmer', 'instructor']],
                msg: 'Role must be admin, Super Admin, farmer, or instructor'
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
        type: DataTypes.ENUM('active', 'blocked', 'suspended'),
        defaultValue: 'active',
        allowNull: false
    },
    profile_picture: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null
    },
    email_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    verification_token: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    verification_token_expires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    original_email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Original email for demo accounts (stores actual email before timestamp modification)'
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

// Add virtual fields for generated IDs
User.prototype.getFarmerId = async function() {
    if (this.role !== 'farmer') return null;
    const { FarmerDetail } = await import('./index.js');
    const farmerDetail = await FarmerDetail.findOne({
        where: { user_id: this.id },
        attributes: ['farmer_id']
    });
    return farmerDetail ? farmerDetail.farmer_id : null;
};

User.prototype.getInstructorId = async function() {
    if (this.role !== 'instructor') return null;
    const { InstructorDetail } = await import('./index.js');
    const instructorDetail = await InstructorDetail.findOne({
        where: { user_id: this.id },
        attributes: ['instructor_id']
    });
    return instructorDetail ? instructorDetail.instructor_id : null;
};

export default User;
