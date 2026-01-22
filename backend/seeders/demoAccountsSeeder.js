import { User, FarmerDetail } from '../models/index.js';
import bcrypt from 'bcryptjs';

const seedDemoAccounts = async () => {
  try {
    // Check if instructor user already exists
    const instructorUser = await User.findOne({ where: { email: 'instructor@example.com' } });
    if (!instructorUser) {
      const hashedPassword = await bcrypt.hash('instructor123', 10);
      await User.create({
        full_name: 'Instructor User',
        email: 'instructor@example.com',
        password: hashedPassword,
        role: 'instructor',
        nic: '000000000V',
        phone: '0000000000',
        status: 'active',
        email_verified: true
      });
      console.log('Instructor user created successfully!');
    } else {
      await instructorUser.update({
        status: 'active',
        email_verified: true
      });
      console.log('Instructor user already exists');
    }

    // Check if farmer user already exists
    const farmerUser = await User.findOne({ where: { email: 'farmer@example.com' } });
    if (!farmerUser) {
      const hashedPassword = await bcrypt.hash('farmer123', 10);
      const createdFarmer = await User.create({
        full_name: 'Farmer User',
        email: 'farmer@example.com',
        password: hashedPassword,
        role: 'farmer',
        nic: '000000000V',
        phone: '0000000000',
        status: 'active',
        email_verified: true
      });
      
      // Assign farmer to an available farmer detail
      const availableFarmerDetail = await FarmerDetail.findOne({ 
        where: { user_id: null } 
      });
      if (availableFarmerDetail) {
        await availableFarmerDetail.update({ user_id: createdFarmer.id });
        console.log('Farmer user created and assigned to farmer ID:', availableFarmerDetail.farmer_id);
      } else {
        console.log('Farmer user created but no available farmer details found');
      }
    } else {
        await farmerUser.update({
          status: 'active',
          email_verified: true
        });
        
        // Ensure farmer has a farmer detail assignment
        const farmerDetail = await FarmerDetail.findOne({ 
          where: { user_id: farmerUser.id } 
        });
        if (!farmerDetail) {
          const availableDetail = await FarmerDetail.findOne({ 
            where: { user_id: null } 
          });
          if (availableDetail) {
            await availableDetail.update({ user_id: farmerUser.id });
            console.log('Assigned existing farmer to farmer ID:', availableDetail.farmer_id);
          }
        }
        
        console.log('Farmer user already exists');
    }

  } catch (error) {
    console.error('Error seeding demo accounts:', error);
  }
};

export default seedDemoAccounts;
