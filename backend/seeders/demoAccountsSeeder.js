import { User, FarmerDetail, InstructorDetail } from '../models/index.js';
import bcrypt from 'bcryptjs';

const seedDemoAccounts = async () => {
  try {
    // --- INSTRUCTOR ---
    let instructorUser = await User.findOne({ where: { email: 'instructor@example.com' } });
    if (!instructorUser) {
      const hashedPassword = await bcrypt.hash('instructor123', 10);
      instructorUser = await User.create({
        full_name: 'Instructor User',
        email: 'instructor@example.com',
        password: hashedPassword,
        role: 'instructor',
        nic: '000000001V',
        phone: '0000000001',
        status: 'active',
        email_verified: true
      });
      console.log('Instructor user created successfully!');
    } else {
      await instructorUser.update({
        status: 'active',
        email_verified: true
      });
      console.log('Instructor user already exists (updated status).');
    }

    // Ensure Instructor Detail
    let instructorDetail = await InstructorDetail.findOne({ where: { user_id: instructorUser.id } });
    if (!instructorDetail) {
        const demoId = 'INST-2026-0001';
        let detail = await InstructorDetail.findOne({ where: { instructor_id: demoId } });
        
        if (detail && detail.user_id === null) {
            await detail.update({ user_id: instructorUser.id });
            console.log(`Assigned available ${demoId} to instructor.`);
        } else if (detail && detail.user_id !== null) {
            console.log(`${demoId} is taken. Creating new detail.`);
            await InstructorDetail.create({
                user_id: instructorUser.id,
                instructor_id: 'INST-DEMO-AUTO',
                district: 'Anuradhapura',
                business_area: 'Demo Zone',
                assigned_divisions: ['Demo Div']
            });
        } else {
            console.log(`${demoId} not found. Creating it.`);
            await InstructorDetail.create({
                user_id: instructorUser.id,
                instructor_id: demoId,
                district: 'Anuradhapura',
                business_area: 'Demo Zone',
                assigned_divisions: ['Demo Div']
            });
        }
    } else {
        console.log(`Instructor already has detail: ${instructorDetail.instructor_id}`);
    }


    // --- FARMER ---
    let farmerUser = await User.findOne({ where: { email: 'farmer@example.com' } });
    if (!farmerUser) {
      const hashedPassword = await bcrypt.hash('farmer123', 10);
      farmerUser = await User.create({
        full_name: 'Farmer User',
        email: 'farmer@example.com',
        password: hashedPassword,
        role: 'farmer',
        nic: '000000002V',
        phone: '0000000002',
        status: 'active',
        email_verified: true
      });
      console.log('Farmer user created successfully!');
    } else {
        await farmerUser.update({
          status: 'active',
          email_verified: true
        });
        console.log('Farmer user already exists (updated status).');
    }

    // Ensure Farmer Detail
    let farmerDetail = await FarmerDetail.findOne({ where: { user_id: farmerUser.id } });
    if (!farmerDetail) {
        // Try to find an available one or create one
        let detail = await FarmerDetail.findOne({ where: { user_id: null } });
        if (detail) {
            await detail.update({ user_id: farmerUser.id });
            console.log(`Assigned available farmer ID ${detail.farmer_id} to farmer.`);
        } else {
             // Create one if none available
             const demoId = 'FARM-DEMO-AUTO';
             await FarmerDetail.create({
                 user_id: farmerUser.id,
                 farmer_id: demoId,
                 district: 'Anuradhapura',
                 business_area: 'Demo Area',
                 instructor_division: 'Demo Div'
             });
             console.log(`Created new farmer detail ${demoId} for farmer.`);
        }
    } else {
        console.log(`Farmer already has detail: ${farmerDetail.farmer_id}`);
    }

  } catch (error) {
    console.error('Error seeding demo accounts:', error);
  }
};

export default seedDemoAccounts;
