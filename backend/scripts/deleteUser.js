import { User, FarmerDetail } from '../models/index.js';

const deleteUser = async () => {
    try {
        const email = 'akalankasenanayake88@gmail.com';
        const user = await User.findOne({
            where: { email },
            include: [{ model: FarmerDetail, as: 'farmerDetail' }]
        });

        if (user) {
            // If linked to a farmer detail, unlink it first (set user_id to null)
            if (user.farmerDetail) {
                await user.farmerDetail.update({ user_id: null });
                console.log(`Unlinked user from FarmerDetail ${user.farmerDetail.farmer_id}`);
            }

            // Delete the user
            await user.destroy();
            console.log(`Deleted user ${email}`);
        } else {
            console.log('User not found, nothing to delete');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
    } finally {
        process.exit();
    }
};

deleteUser();
