import { User, FarmerDetail, InstructorDetail, Region } from '../../models/index.js';
import GeneratedId from '../../models/GeneratedId.js';
import bcrypt from 'bcryptjs';

// ─── Demo accounts only ───────────────────────────────────────────────────────
// This file creates a demo Instructor and a demo Farmer for development/testing.
// It does NOT create the admin user — that is handled by admin.seeder.js.
//
// TO REMOVE FOR CLIENT DELIVERY: delete the entire seeders/demo/ folder and
// remove the "seed:demo" script from package.json.
// ─────────────────────────────────────────────────────────────────────────────

const seedDemoAccounts = async () => {
    try {
        // Read zone defaults from regions table
        // We will explicitly use specific regions so that we can demonstrate
        // the filtering by division correctly.
        const zone = 'Eppawala';
        const assignedDivisions = ['Eppawala1', 'Eppawala2'];

        // --- DEMO INSTRUCTOR ---
        let instructorUser = await User.findOne({ where: { email: 'instructor@example.com' } });
        if (!instructorUser) {
            const hashedPassword = await bcrypt.hash('instructor123', 10);
            instructorUser = await User.create({
                full_name:      'Demo Instructor',
                email:          'instructor@example.com',
                password:       hashedPassword,
                role:           'instructor',
                nic:            '000000001V',
                phone:          '0000000001',
                status:         'active',
                email_verified: true
            });
            console.log('✅ Demo instructor user created');
        } else {
            await instructorUser.update({ status: 'active', email_verified: true });
            console.log('👍 Demo instructor already exists (status updated)');
        }

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

        // --- DEMO FARMER 1 (Assigned to the Demo Instructor) ---
        let farmerUser1 = await User.findOne({ where: { email: 'farmer@example.com' } });
        if (!farmerUser1) {
            const hashedPassword = await bcrypt.hash('farmer123', 10);
            farmerUser1 = await User.create({
                full_name:      'Demo Farmer',
                email:          'farmer@example.com',
                password:       hashedPassword,
                role:           'farmer',
                nic:            '000000002V',
                phone:          '0000000002',
                status:         'active',
                email_verified: true
            });
            console.log('✅ Demo farmer 1 user created');
        } else {
            await farmerUser1.update({ status: 'active', email_verified: true });
            console.log('👍 Demo farmer 1 already exists (status updated)');
        }

        const farmerId1 = 'FARM-2026-0001';
        const locations1 = [{ zone: 'Eppawala', division: 'Eppawala1' }];
        const [, farmerCreated1] = await FarmerDetail.findOrCreate({
            where:    { farmer_id: farmerId1 },
            defaults: { user_id: farmerUser1.id, district: 'Anuradhapura', locations: locations1 }
        });
        if (!farmerCreated1) {
            await FarmerDetail.update(
                { user_id: farmerUser1.id, locations: locations1 },
                { where: { farmer_id: farmerId1 } }
            );
        }
        await GeneratedId.update({ status: 'used' }, { where: { code: farmerId1 } });
        console.log(farmerCreated1
            ? `✅ Farmer detail 1 created (${farmerId1})`
            : `👍 Farmer detail 1 exists: ${farmerId1}`);

        // --- DEMO FARMER 2 (NOT Assigned to the Demo Instructor) ---
        let farmerUser2 = await User.findOne({ where: { email: 'farmer2@example.com' } });
        if (!farmerUser2) {
            const hashedPassword = await bcrypt.hash('farmer123', 10);
            farmerUser2 = await User.create({
                full_name:      'Unassigned Farmer',
                email:          'farmer2@example.com',
                password:       hashedPassword,
                role:           'farmer',
                nic:            '000000003V',
                phone:          '0000000003',
                status:         'active',
                email_verified: true
            });
            console.log('✅ Demo farmer 2 user created');
        } else {
            await farmerUser2.update({ status: 'active', email_verified: true });
            console.log('👍 Demo farmer 2 already exists (status updated)');
        }

        const farmerId2 = 'FARM-2026-0002'; // Demo generation uses -000X typically, if it fails, we fall back gracefully.
        const locations2 = [{ zone: 'Thalawa', instructorDivision: 'Thalawa' }];
        const [, farmerCreated2] = await FarmerDetail.findOrCreate({
            where:    { farmer_id: farmerId2 },
            defaults: { user_id: farmerUser2.id, district: 'Anuradhapura', locations: locations2 }
        });
        if (!farmerCreated2) {
            await FarmerDetail.update(
                { user_id: farmerUser2.id, locations: locations2 },
                { where: { farmer_id: farmerId2 } }
            );
        }
        await GeneratedId.update({ status: 'used' }, { where: { code: farmerId2 } });
        console.log(farmerCreated2
            ? `✅ Farmer detail 2 created (${farmerId2})`
            : `👍 Farmer detail 2 exists: ${farmerId2}`);

    } catch (error) {
        console.error('❌ Error seeding demo accounts:', error);
    }
};

export default seedDemoAccounts;
