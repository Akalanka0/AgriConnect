import sequelize from '../config/db.js';
import User from './User.js';
import FarmerDetail from './FarmerDetail.js';
import InstructorDetail from './InstructorDetail.js';
import GeneratedId from './GeneratedId.js';
import Message from './Message.js';
import SystemSetting from './SystemSetting.js';
import Pest from './Pest.js';
import Crop from './Crop.js';
import Harvest from './Harvest.js';
import Activity from './Activity.js';
import PestReport from './PestReport.js';
import HarvestRecord from './HarvestRecord.js';
import CropPlan from './CropPlan.js';
import Meeting from './Meeting.js';
import InstructorRating from './InstructorRating.js';

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

// Farmer Activity Associations
User.hasMany(Activity, { foreignKey: 'user_id', as: 'activities' });
Activity.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Pest Report Associations
User.hasMany(PestReport, { foreignKey: 'user_id', as: 'pestReports' });
PestReport.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(PestReport, { foreignKey: 'instructor_id', as: 'assignedPestReports' });
PestReport.belongsTo(User, { foreignKey: 'instructor_id', as: 'instructor' });

// Harvest Record Associations
User.hasMany(HarvestRecord, { foreignKey: 'user_id', as: 'harvestRecords' });
HarvestRecord.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Crop Plan Associations
User.hasMany(CropPlan, { foreignKey: 'user_id', as: 'cropPlans' });
CropPlan.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(CropPlan, { foreignKey: 'instructor_id', as: 'assignedPlans' });
CropPlan.belongsTo(User, { foreignKey: 'instructor_id', as: 'instructor' });

// Meeting Associations
User.hasMany(Meeting, { foreignKey: 'farmer_id', as: 'farmerMeetings' });
Meeting.belongsTo(User, { foreignKey: 'farmer_id', as: 'farmer' });

User.hasMany(Meeting, { foreignKey: 'instructor_id', as: 'instructorMeetings' });
Meeting.belongsTo(User, { foreignKey: 'instructor_id', as: 'instructor' });

// Instructor Rating Associations
InstructorDetail.hasMany(InstructorRating, { foreignKey: 'instructor_id', sourceKey: 'instructor_id', as: 'ratings' });
InstructorRating.belongsTo(InstructorDetail, { foreignKey: 'instructor_id', targetKey: 'instructor_id', as: 'instructor' });

FarmerDetail.hasMany(InstructorRating, { foreignKey: 'farmer_id', sourceKey: 'farmer_id', as: 'givenRatings' });
InstructorRating.belongsTo(FarmerDetail, { foreignKey: 'farmer_id', targetKey: 'farmer_id', as: 'farmer' });

// Export models
export {
    sequelize,
    User,
    FarmerDetail,
    InstructorDetail,
    GeneratedId,
    Message,
    SystemSetting,
    Pest,
    Crop,
    Harvest,
    Activity,
    PestReport,
    HarvestRecord,
    CropPlan,
    Meeting,
    InstructorRating
};

