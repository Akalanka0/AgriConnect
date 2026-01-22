import { User, FarmerDetail } from '../models/index.js';

const checkUser = async () => {
    try {
        const email = 'akalankasenanayake88@gmail.com';
        const user = await User.findOne({
            where: { email },
            include: [{ model: FarmerDetail, as: 'farmerDetail' }]
        });

        if (user) {
            console.log('User found:', JSON.stringify(user.toJSON(), null, 2));
        } else {
            console.log('User not found');
        }
    } catch (error) {
        console.error('Error checking user:', error);
    } finally {
        process.exit();
    }
};

checkUser();
