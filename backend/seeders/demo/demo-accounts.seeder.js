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
        const regionRows = await Region.findAll({ order: [['zone', 'ASC']], raw: true });
        const zones = [...new Set(regionRows.map(r => r.zone))];
        const zone = zones[0] || 'Anuradhapura town';
        const subDivisions = regionRows.filter(r => r.zone === zone && r.division !== r.zone).map(r => r.division);
        const assignedDivisions = subDivisions.length > 0 ? subDivisions.slice(0, 2) : [zone];
        const instructorDivision = assignedDivisions[0];

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

        // --- DEMO FARMER ---
        let farmerUser = await User.findOne({ where: { email: 'farmer@example.com' } });
        if (!farmerUser) {
            const hashedPassword = await bcrypt.hash('farmer123', 10);
            farmerUser = await User.create({
                full_name:      'Demo Farmer',
                email:          'farmer@example.com',
                password:       hashedPassword,
                role:           'farmer',
                nic:            '000000002V',
                phone:          '0000000002',
                status:         'active',
                email_verified: true
            });
            console.log('✅ Demo farmer user created');
        } else {
            await farmerUser.update({ status: 'active', email_verified: true });
            console.log('👍 Demo farmer already exists (status updated)');
        }

        const farmerId = 'FARM-2026-0001';
        const locations = [{ zone, division: instructorDivision }];
        const [, farmerCreated] = await FarmerDetail.findOrCreate({
            where:    { farmer_id: farmerId },
            defaults: { user_id: farmerUser.id, district: 'Anuradhapura', locations }
        });
        if (!farmerCreated) {
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
