import { User, FarmerDetail, InstructorDetail, SystemSetting, Region } from '../models/index.js';
import GeneratedId from '../models/GeneratedId.js';
import bcrypt from 'bcryptjs';

const seedDemoAccounts = async () => {
  try {
    // --- SYSTEM SETTINGS ---
    await SystemSetting.findOrCreate({
      where:    { setting_key: 'maintenance_mode' },
      defaults: { setting_value: 'false', description: 'Set to true to enable maintenance mode.' }
    });
    console.log('✅ System settings ensured');

    // Read zone defaults from regions table
    const regionRows = await Region.findAll({ order: [['zone', 'ASC']], raw: true });
    const zones = [...new Set(regionRows.map(r => r.zone))];
    const zone = zones[0] || 'Anuradhapura town';
    const subDivisions = regionRows.filter(r => r.zone === zone && r.division !== r.zone).map(r => r.division);
    const assignedDivisions = subDivisions.length > 0 ? subDivisions.slice(0, 2) : [zone];
    const instructorDivision = assignedDivisions[0];

    // --- ADMIN ---
    let adminUser = await User.findOne({ where: { email: 'admin@agriconnect.lk' } });
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      adminUser = await User.create({
        full_name: 'AgriConnect Admin',
        email: 'admin@agriconnect.lk',
        password: hashedPassword,
        role: 'admin',
        nic: '000000000V',
        phone: '0000000000',
        status: 'active',
        email_verified: true
      });
      console.log('Admin user created successfully!');
    } else {
      await adminUser.update({
        status: 'active',
        email_verified: true
      });
      console.log('Admin user already exists (updated status).');
    }

    // --- INSTRUCTOR ---
    let instructorUser = await User.findOne({ where: { email: 'instructor@example.com' } });
    if (!instructorUser) {
      const hashedPassword = await bcrypt.hash('instructor123', 10);
      instructorUser = await User.create({
        full_name: 'Demo Instructor',
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
    const instructorId = 'INST-2026-0001';
    const [instructorDetail, instrCreated] = await InstructorDetail.findOrCreate({
      where:    { instructor_id: instructorId },
      defaults: {
        user_id:            instructorUser.id,
        district:           'Anuradhapura',
        zone,
        assigned_divisions: assignedDivisions,
        specialization:     'Crop Management',
        experience:         5,
        qualifications:     'B.Sc. Agriculture (Demo)',
        average_rating:     0.0
      }
    });
    if (!instrCreated && instructorDetail.user_id === null) {
      await instructorDetail.update({ user_id: instructorUser.id });
    }
    await GeneratedId.update({ status: 'used' }, { where: { code: instructorId } });
    console.log(instrCreated
      ? `✅ Instructor detail created (${instructorId})`
      : `👍 Instructor detail exists: ${instructorDetail.instructor_id}`);

    // --- FARMER ---
    let farmerUser = await User.findOne({ where: { email: 'farmer@example.com' } });
    if (!farmerUser) {
      const hashedPassword = await bcrypt.hash('farmer123', 10);
      farmerUser = await User.create({
        full_name: 'Demo Farmer',
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
    const farmerId = 'FARM-2026-0001';
    const locations = [{ zone, division: instructorDivision }];

    const [, farmerCreated] = await FarmerDetail.findOrCreate({
      where:    { farmer_id: farmerId },
      defaults: {
        user_id:  farmerUser.id,
        district: 'Anuradhapura',
        locations
      }
    });
    if (!farmerCreated) {
      // Update user_id only if the row exists but is unlinked
      await FarmerDetail.update(
        { user_id: farmerUser.id },
        { where: { farmer_id: farmerId, user_id: null } }
      );
    }
    await GeneratedId.update({ status: 'used' }, { where: { code: farmerId } });
    console.log(farmerCreated
      ? `✅ Farmer detail created (${farmerId})`
      : `👍 Farmer detail exists: ${farmerId}`);

  } catch (error) {
    console.error('❌ Error seeding demo accounts:', error);
  }
};

export default seedDemoAccounts;
