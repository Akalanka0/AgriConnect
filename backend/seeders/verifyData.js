import { User, InstructorDetail, FarmerDetail } from '../models/index.js';
import sequelize from '../config/db.js';

const verifyData = async () => {
    try {
        const userCount = await User.count();
        const instructorCount = await User.count({ where: { role: 'instructor' } });
        const farmerCount = await User.count({ where: { role: 'farmer' } });
        const adminCount = await User.count({ where: { role: 'admin' } });

        console.log('--- Database Verification ---');
        console.log(`Total Users: ${userCount}`);
        console.log(`Instructors: ${instructorCount} (Expected: 6)`);
        console.log(`Farmers: ${farmerCount} (Expected: 28 + 1 Tester + maybe Demo accounts)`);
        console.log(`Admins: ${adminCount} (Expected: 1 Super + 3 Admins + maybe Demo accounts)`);

        const sampleInstructor = await User.findOne({ 
            where: { role: 'instructor' },
            include: [{ model: InstructorDetail, as: 'instructorDetail' }]
        });
        
        console.log('\nSample Instructor:');
        if (sampleInstructor) {
            console.log(`- Name: ${sampleInstructor.full_name}`);
            console.log(`- Division: ${JSON.stringify(sampleInstructor.instructorDetail?.assigned_divisions)}`);
        } else {
            console.log('❌ No instructor found');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    }
};

verifyData();
