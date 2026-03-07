import { User } from '../models/index.js';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const seedAdmin = async () => {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('Admin seeder generated hash for "admin123":', hashedPassword);

    // Check if admin user already exists by email
    let adminUser = await User.findOne({ where: { email: 'admin@agriconnect.lk' } });

    if (adminUser) {
      console.log(`Found user with email admin@agriconnect.lk: ID ${adminUser.id}`);
      // Update existing admin user password
      await adminUser.update({
        password: hashedPassword,
        status: 'active',
        email_verified: true,
        role: 'admin' // Ensure role is admin
      });
      console.log('Admin user updated successfully!');
    } else {
      // Check if any admin exists to repurpose
      adminUser = await User.findOne({ where: { role: 'admin' } });
      
      if (adminUser) {
         console.log(`Found existing admin user to repurpose: ID ${adminUser.id}, Email: ${adminUser.email}`);
         await adminUser.update({
            email: 'admin@agriconnect.lk',
            password: hashedPassword,
            status: 'active',
            email_verified: true
         });
         console.log('Existing admin repurposed to admin@agriconnect.lk');
      } else {
          // Create admin user if not found
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
      }
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
};

// Check if this file is being run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedAdmin().then(() => {
    console.log('Standalone admin seeding completed.');
    process.exit(0);
  });
}

export default seedAdmin;
