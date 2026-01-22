import { User } from '../models/index.js';
import bcrypt from 'bcryptjs';

const seedAdmin = async () => {
  try {
    // Check if admin user already exists
    const adminUser = await User.findOne({ where: { role: 'admin' } });
    if (adminUser) {
      await adminUser.update({
        status: 'active',
        email_verified: true
      });
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      full_name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      nic: '000000000V',
      phone: '0000000000',
      status: 'active',
      email_verified: true
    });

    console.log('Admin user created successfully!');
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
};

export default seedAdmin;
