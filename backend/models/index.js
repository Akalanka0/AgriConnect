import sequelize from '../config/db.js';
import User from './User.js';
import FarmerDetail from './FarmerDetail.js';
import InstructorDetail from './InstructorDetail.js';

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

// Export models
export {
    sequelize,
    User,
    FarmerDetail,
    InstructorDetail
};

// Export default
export default {
    sequelize,
    User,
    FarmerDetail,
    InstructorDetail
};
