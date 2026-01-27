import sequelize from '../config/db.js';
import User from './User.js';
import FarmerDetail from './FarmerDetail.js';
import InstructorDetail from './InstructorDetail.js';
import GeneratedId from './GeneratedId.js';
import Message from './Message.js';

// Define associations (after all models are imported)
FarmerDetail.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

User.hasOne(FarmerDetail, {
    foreignKey: 'user_id',
    as: 'farmerDetail'
});

InstructorDetail.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

User.hasOne(InstructorDetail, {
    foreignKey: 'user_id',
    as: 'instructorDetail'
});

// Message Associations
User.hasMany(Message, { foreignKey: 'sender_id', as: 'sentMessages' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

User.hasMany(Message, { foreignKey: 'recipient_id', as: 'receivedMessages' });
Message.belongsTo(User, { foreignKey: 'recipient_id', as: 'recipient' });

// Export models
export {
    sequelize,
    User,
    FarmerDetail,
    InstructorDetail,
    GeneratedId,
    Message
};

// Export default
export default {
    sequelize,
    User,
    FarmerDetail,
    InstructorDetail,
    GeneratedId,
    Message
};
