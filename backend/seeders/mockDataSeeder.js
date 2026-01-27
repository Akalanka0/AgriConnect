import { User, FarmerDetail, InstructorDetail, GeneratedId } from '../models/index.js';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';
import { Op } from 'sequelize';

const generateRandomString = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

const seedMockData = async () => {
    try {
        console.log('Starting mock data seeding...');

        const hashedPassword = await bcrypt.hash('password123', 10);
        const district = 'Anuradhapura';
        const year = new Date().getFullYear();

        // --- Hierarchy Definition ---
        const hierarchy = [
            {
                businessArea: 'Nuwaragam Palatha Zone',
                instructors: [
                    {
                        name: 'Chamara Perera',
                        divisions: [
                            { name: 'Nuwaragam Palatha Central', villages: ['Pothanegama', 'Saliyapura'] },
                            { name: 'Nuwaragam Palatha East', villages: ['Nachchaduwa', 'Hidogama'] },
                            { name: 'Mihintale', villages: ['Mihintale Town', 'Doradeka'] }
                        ]
                    },
                    {
                        name: 'Nimali Jayasinghe',
                        divisions: [
                            { name: 'Mahavilachchiya', villages: ['Mahavilachchiya', 'Pemaduwa'] },
                            { name: 'Tantirimale', villages: ['Tantirimale', 'Oyamaduwa'] },
                            { name: 'Nochchiyagama', villages: ['Nochchiyagama Town', 'Pahala Maragahawewa'] }
                        ]
                    }
                ]
            },
            {
                businessArea: 'Kekirawa Zone',
                instructors: [
                    {
                        name: 'Ruwan Silva',
                        divisions: [
                            { name: 'Kekirawa', villages: ['Kekirawa Town', 'Madatugama'] },
                            { name: 'Ipalogama', villages: ['Ipalogama', 'Kagama'] },
                            { name: 'Palagala', villages: ['Palagala', 'Negampaha'] }
                        ]
                    },
                    {
                        name: 'Kumari Dissanayake',
                        divisions: [
                            { name: 'Thirappane', villages: ['Thirappane', 'Muriyakadawala'] },
                            { name: 'Maradankadawala', villages: ['Maradankadawala', 'Galkulama'] },
                            { name: 'Galnewa', villages: ['Galnewa', 'Bulnewa'] }
                        ]
                    }
                ]
            },
            {
                businessArea: 'Huruluwewa Zone',
                instructors: [
                    {
                        name: 'Pradeep Bandara',
                        divisions: [
                            { name: 'Galenbindunuwewa', villages: ['Galenbindunuwewa', 'Huruluwewa'] },
                            { name: 'Kahatagasdigiliya', villages: ['Kahatagasdigiliya Town', 'Rathmalgahawewa'] },
                            { name: 'Horowpothana', villages: ['Horowpothana Town', 'Kapugollewa'] }
                        ]
                    },
                    {
                        name: 'Tharindu Rajapaksa',
                        divisions: [
                            { name: 'Kebithigollewa', villages: ['Kebithigollewa', 'Yakalla'] },
                            { name: 'Padaviya', villages: ['Padaviya', 'Parakramapura'] },
                            { name: 'Rambewa', villages: ['Rambewa', 'Kallanchiya'] }
                        ]
                    }
                ]
            }
        ];

        const adminNames = [
            'Kamal Seneviratne', 'Dilhani Ekanayake', 'Suresh Ratnayake'
        ];

        const farmerNames = [
            'Saman Kumara', 'Kaveesha Perera', 'Ravi Shankar', 'Fathima Riffka', 
            'Sunil Shantha', 'Nadeesha Lakmali', 'Roshan Wijesinghe', 'Manjula Peiris', 
            'Chathura Madushan', 'Sanduni Weerasinghe', 'Dinesh Priyankara', 'Lasantha Wickramasinghe', 
            'Nishantha Herath', 'Mahesh Gunaratne', 'Udaya Gamage', 'Sujith Rohana', 
            'Chandana Liyanage', 'Amila Sampath', 'Nuwan Pradeep', 'Gayan Asanka', 
            'Thilini Sewwandi', 'Ishara Maduwanthi', 'Priyadarshani De Silva', 'Kasun Kalhara', 
            'Lahiru Thirimanne', 'Dimuth Karunaratne', 'Wanindu Hasaranga', 'Dasun Shanaka'
        ];

        // --- Clear existing mock data to prevent duplicates ---
        await User.destroy({ where: { email: { [Op.like]: '%@mock.com' } } });
        await GeneratedId.destroy({ where: { code: { [Op.like]: '%-MOCK-%' } } });
        console.log('Cleared previous mock users and generated IDs.');

        // --- 1. Create Super Admin ---
        const superAdminEmail = 'superadmin@mock.com';
        let superAdmin = await User.findOne({ where: { email: superAdminEmail } });
        if (!superAdmin) {
            superAdmin = await User.create({
                full_name: 'Super Admin',
                email: superAdminEmail,
                password: hashedPassword,
                role: 'admin',
                nic: '198001010010',
                phone: '0710000001',
                status: 'active',
                email_verified: true
            });
            console.log('Super Admin created.');
        }

        // --- 2. Create 3 Admins ---
        for (let i = 0; i < adminNames.length; i++) {
            const adminEmail = `admin${i+1}@mock.com`;
            let admin = await User.findOne({ where: { email: adminEmail } });
            if (!admin) {
                admin = await User.create({
                    full_name: adminNames[i],
                    email: adminEmail,
                    password: hashedPassword,
                    role: 'admin',
                    nic: `1990010100${10 + i + 1}`,
                    phone: `07100000${10 + i + 1}`,
                    status: 'active',
                    email_verified: true
                });
                console.log(`Admin ${adminNames[i]} created.`);
            }
        }

        // --- 3. Create Instructors and Farmers (Hierarchical) ---
        let farmerIndex = 0;

        for (const area of hierarchy) {
            for (const instData of area.instructors) {
                // Create Instructor
                const instructorEmail = `instructor.${instData.name.replace(' ', '.').toLowerCase()}@mock.com`;
                let instructor = await User.findOne({ where: { email: instructorEmail } });

                if (!instructor) {
                    instructor = await User.create({
                        full_name: instData.name,
                        email: instructorEmail,
                        password: hashedPassword,
                        role: 'instructor',
                        nic: `1985${Math.floor(10000000 + Math.random() * 90000000)}`,
                        phone: `077${Math.floor(1000000 + Math.random() * 9000000)}`,
                        status: 'active',
                        email_verified: true
                    });

                    const instIdCode = `INST-MOCK-${year}-${generateRandomString(4)}`;
                    const assignedDivisionNames = instData.divisions.map(d => d.name);
                    
                    await InstructorDetail.create({
                        user_id: instructor.id,
                        instructor_id: instIdCode,
                        district: district,
                        business_area: area.businessArea,
                        assigned_divisions: assignedDivisionNames // Storing as JSON/Array
                    });
                    
                    await GeneratedId.create({
                        code: instIdCode,
                        type: 'instructor',
                        year: year,
                        status: 'used'
                    });
                    console.log(`Instructor ${instData.name} created (Area: ${area.businessArea}).`);
                }

                // Distribute Farmers among this instructor's divisions
                // We have 28 farmers total. Let's assign roughly 4-5 farmers per instructor.
                // Or simply iterate through the main farmer list and assign them sequentially.
                
                const farmersPerInstructor = Math.ceil(farmerNames.length / 6); // Approx 5
                // Actually, let's just pick from the global list until we run out
                
                for (let k = 0; k < farmersPerInstructor; k++) {
                    if (farmerIndex >= farmerNames.length) break;

                    const fName = farmerNames[farmerIndex];
                    const farmerEmail = `farmer${farmerIndex+1}@mock.com`;
                    
                    let farmer = await User.findOne({ where: { email: farmerEmail } });
                    if (!farmer) {
                        farmer = await User.create({
                            full_name: fName,
                            email: farmerEmail,
                            password: hashedPassword,
                            role: 'farmer',
                            nic: `1990${Math.floor(10000000 + Math.random() * 90000000)}`,
                            phone: `078${Math.floor(1000000 + Math.random() * 9000000)}`,
                            status: 'active',
                            email_verified: true
                        });

                        // Assign to a random division of this instructor
                        const randomDivIndex = Math.floor(Math.random() * instData.divisions.length);
                        const assignedDivision = instData.divisions[randomDivIndex];
                        const randomVillage = assignedDivision.villages[Math.floor(Math.random() * assignedDivision.villages.length)];

                        const farmIdCode = `FARM-MOCK-${year}-${generateRandomString(4)}`;
                        await FarmerDetail.create({
                            user_id: farmer.id,
                            farmer_id: farmIdCode,
                            district: district,
                            business_area: randomVillage, // Using Village as 'location'
                            instructor_division: assignedDivision.name
                        });

                        await GeneratedId.create({
                            code: farmIdCode,
                            type: 'farmer',
                            year: year,
                            status: 'used'
                        });
                        console.log(`Farmer ${fName} created (Div: ${assignedDivision.name}, Village: ${randomVillage}).`);
                    }
                    farmerIndex++;
                }
            }
        }

        console.log('Mock data seeding completed successfully!');
    } catch (error) {
        console.error('Error seeding mock data:', error);
        process.exit(1);
    }
};

export default seedMockData;
