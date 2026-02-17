import { User, FarmerDetail, InstructorDetail, Meeting } from '../models/index.js';
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

    // --- ROHAN SILVA (MOCK INSTRUCTOR) ---
    let rohanUser = await User.findOne({ where: { email: 'rohan.silva@agri.gov' } });
    if (!rohanUser) {
      const hashedPassword = await bcrypt.hash('instructor123', 10);
      rohanUser = await User.create({
        full_name: 'Rohan Silva',
        email: 'rohan.silva@agri.gov',
        password: hashedPassword,
        role: 'instructor',
        nic: '198501010010',
        phone: '071-1234567',
        status: 'active',
        email_verified: true
      });
      console.log('Rohan Silva created successfully!');
    } else {
      await rohanUser.update({
        full_name: 'Rohan Silva',
        email: 'rohan.silva@agri.gov',
        phone: '071-1234567',
        status: 'active',
        email_verified: true
      });
      console.log('Rohan Silva already exists (updated status).');
    }

    // Ensure Rohan Detail
    let rohanDetail = await InstructorDetail.findOne({ where: { user_id: rohanUser.id } });
    if (!rohanDetail) {
        await InstructorDetail.create({
            user_id: rohanUser.id,
            instructor_id: 'INST-2026-0001',
            district: 'Anuradhapura',
            zone: 'Rajanganaya',
            assigned_divisions: ['Yaya 4'],
            specialization: 'Sustainable Agriculture, Crop Management',
            experience: 8,
            qualifications: 'B.Sc. in Agriculture, Certified Crop Advisor',
            average_rating: 4.2
        });
        console.log('Rohan Silva details created.');
    } else {
        await rohanDetail.update({
            instructor_id: 'INST-2026-0001',
            zone: 'Rajanganaya',
            assigned_divisions: ['Yaya 4'],
            specialization: 'Sustainable Agriculture, Crop Management',
            experience: 8,
            qualifications: 'B.Sc. in Agriculture, Certified Crop Advisor',
            average_rating: 4.2
        });
        console.log('Rohan Silva details updated.');
    }

    // Ensure Instructor Detail
    let instructorDetail = await InstructorDetail.findOne({ where: { user_id: instructorUser.id } });
    if (!instructorDetail) {
        const demoId = 'INST-2026-0001';
        let detail = await InstructorDetail.findOne({ where: { instructor_id: demoId } });
        
        if (detail && detail.user_id === null) {
            await detail.update({
                user_id: instructorUser.id,
                zone: 'Nuwaragam Palatha',
                assigned_divisions: ['Nuwaragam Palatha Central'],
                average_rating: 4.8
            });
            console.log(`Assigned available ${demoId} to instructor.`);
        } else if (detail && detail.user_id !== null) {
            console.log(`${demoId} is taken. Creating new detail.`);
            await InstructorDetail.create({
                user_id: instructorUser.id,
                instructor_id: 'INST-DEMO-AUTO',
                district: 'Anuradhapura',
                zone: 'Nuwaragam Palatha',
                assigned_divisions: ['Nuwaragam Palatha Central'],
                average_rating: 4.8
            });
        } else {
            console.log(`${demoId} not found. Creating it.`);
            await InstructorDetail.create({
                user_id: instructorUser.id,
                instructor_id: demoId,
                district: 'Anuradhapura',
                zone: 'Nuwaragam Palatha',
                assigned_divisions: ['Nuwaragam Palatha Central'],
                average_rating: 4.8
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
                 zone: 'Demo Area',
                 instructor_division: 'Demo Div'
             });
             console.log(`Created new farmer detail ${demoId} for farmer.`);
        }
    } else {
        console.log(`Farmer already has detail: ${farmerDetail.farmer_id}`);
    }

    // --- SEED MEETINGS FOR ROHAN SILVA ---
    console.log('📅 Seeding specific meetings for Rohan Silva...');
    const rohanMeetings = [
      {
        meetingTitle: 'Crop Disease Consultation',
        meetingDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
        meetingTime: '10:00 AM',
        meetingNotes: 'I am seeing some yellow spots on my paddy leaves. Need urgent advice.',
        status: 'pending',
        division: 'Kebithigollewa',
        requestedBy: 'farmer'
      },
      {
        meetingTitle: 'Organic Fertilizer Advice',
        meetingDate: new Date().toISOString().split('T')[0],
        meetingTime: '02:30 PM',
        meetingNotes: 'Want to switch to organic fertilizers for my vegetable garden.',
        status: 'accepted',
        zoomLink: 'https://zoom.us/j/123456789',
        division: 'Padaviya',
        requestedBy: 'farmer'
      },
      {
        meetingTitle: 'Soil Testing Results',
        meetingDate: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0],
        meetingTime: '09:00 AM',
        meetingNotes: 'Discussing the soil test results from last week.',
        status: 'accepted',
        zoomLink: 'https://zoom.us/j/987654321',
        division: 'Rambewa',
        requestedBy: 'instructor'
      },
      {
        meetingTitle: 'Pest Control Strategy',
        meetingDate: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString().split('T')[0],
        meetingTime: '11:00 AM',
        meetingNotes: 'Planning the pest control for the next month.',
        status: 'pending',
        division: 'Galenbindunuwewa',
        requestedBy: 'farmer'
      },
      {
        meetingTitle: 'New Paddy Variety Discussion',
        meetingDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0],
        meetingTime: '09:30 AM',
        meetingNotes: 'Want to know about the new short-term paddy varieties available.',
        status: 'pending',
        division: 'Kahatagasdigiliya',
        requestedBy: 'farmer'
      },
      {
        meetingTitle: 'Irrigation Timing Advice',
        meetingDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
        meetingTime: '03:00 PM',
        meetingNotes: 'Need advice on water management for the dry season.',
        status: 'pending',
        division: 'Horowpothana',
        requestedBy: 'farmer'
      }
    ];

    for (const mData of rohanMeetings) {
      const existingMeeting = await Meeting.findOne({
        where: {
          instructor_id: rohanUser.id,
          meetingTitle: mData.meetingTitle,
          meetingDate: mData.meetingDate
        }
      });

      if (!existingMeeting) {
        await Meeting.create({
          ...mData,
          instructor_id: rohanUser.id,
          farmer_id: farmerUser.id, // Assign to the demo farmer for simplicity
          meetingDuration: '30'
        });
      }
    }
    console.log('Rohan Silva meetings seeded.');

  } catch (error) {
    console.error('Error seeding demo accounts:', error);
  }
};

export default seedDemoAccounts;
