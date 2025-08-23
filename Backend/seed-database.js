const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing users and admins
    console.log('🗑️ Removing all existing users and admins...');
    const deleteResult = await User.deleteMany({});
    console.log(`❌ Deleted ${deleteResult.deletedCount} existing users`);

    // Admin users data
    const adminUsers = [
      {
        FullName: 'System Administrator',
        Email: 'admin@onlinejudge.com',
        username: 'admin',
        Password: 'admin123',
        DOB: new Date('1990-01-01'),
        role: 'admin',
        isVerified: true,
        rating: 2000
      },
      {
        FullName: 'Contest Manager',
        Email: 'contest@onlinejudge.com',
        username: 'contestadmin',
        Password: 'contest123',
        DOB: new Date('1988-05-15'),
        role: 'admin',
        isVerified: true,
        rating: 1900
      }
    ];

    // Regular users data
    const regularUsers = [
      {
        FullName: 'Alice Johnson',
        Email: 'alice@example.com',
        username: 'alice_codes',
        Password: 'password123',
        DOB: new Date('1995-03-10'),
        role: 'user',
        isVerified: true,
        rating: 1450
      },
      {
        FullName: 'Bob Smith',
        Email: 'bob@example.com',
        username: 'bob_dev',
        Password: 'password123',
        DOB: new Date('1992-07-22'),
        role: 'user',
        isVerified: true,
        rating: 1320
      },
      {
        FullName: 'Carol Williams',
        Email: 'carol@example.com',
        username: 'carol_cpp',
        Password: 'password123',
        DOB: new Date('1994-11-08'),
        role: 'user',
        isVerified: true,
        rating: 1280
      },
      {
        FullName: 'David Brown',
        Email: 'david@example.com',
        username: 'david_algo',
        Password: 'password123',
        DOB: new Date('1996-02-14'),
        role: 'user',
        isVerified: true,
        rating: 1150
      },
      {
        FullName: 'Emma Davis',
        Email: 'emma@example.com',
        username: 'emma_python',
        Password: 'password123',
        DOB: new Date('1993-09-30'),
        role: 'user',
        isVerified: true,
        rating: 1380
      },
      {
        FullName: 'Frank Miller',
        Email: 'frank@example.com',
        username: 'frank_js',
        Password: 'password123',
        DOB: new Date('1991-12-05'),
        role: 'user',
        isVerified: true,
        rating: 1200
      },
      {
        FullName: 'Grace Wilson',
        Email: 'grace@example.com',
        username: 'grace_data',
        Password: 'password123',
        DOB: new Date('1997-04-18'),
        role: 'user',
        isVerified: true,
        rating: 1420
      },
      {
        FullName: 'Henry Taylor',
        Email: 'henry@example.com',
        username: 'henry_competitive',
        Password: 'password123',
        DOB: new Date('1989-08-25'),
        role: 'user',
        isVerified: true,
        rating: 1350
      },
      {
        FullName: 'Isabella Anderson',
        Email: 'isabella@example.com',
        username: 'bella_codes',
        Password: 'password123',
        DOB: new Date('1998-06-12'),
        role: 'user',
        isVerified: true,
        rating: 1180
      },
      {
        FullName: 'Jack Thompson',
        Email: 'jack@example.com',
        username: 'jack_solver',
        Password: 'password123',
        DOB: new Date('1990-10-03'),
        role: 'user',
        isVerified: true,
        rating: 1290
      }
    ];

    // Hash passwords and create admin users
    console.log('👨‍💼 Creating admin users...');
    for (let i = 0; i < adminUsers.length; i++) {
      const adminData = adminUsers[i];
      
      const admin = new User({
        ...adminData,
        submissions: [],
        solvedProblems: [],
        currentStreak: 0,
        longestStreak: 0,
        createdAt: new Date()
      });
      
      await admin.save();
      console.log(`✅ Created admin: ${adminData.username} (${adminData.Email})`);
    }

    // Hash passwords and create regular users
    console.log('👤 Creating regular users...');
    for (let i = 0; i < regularUsers.length; i++) {
      const userData = regularUsers[i];
      
      const user = new User({
        ...userData,
        submissions: [],
        solvedProblems: [],
        currentStreak: 0,
        longestStreak: 0,
        createdAt: new Date()
      });
      
      await user.save();
      console.log(`✅ Created user: ${userData.username} (${userData.Email})`);
    }

    // Display summary
    console.log('\n🎉 Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - ${adminUsers.length} admin users created`);
    console.log(`   - ${regularUsers.length} regular users created`);
    console.log(`   - Total users: ${adminUsers.length + regularUsers.length}`);
    
    console.log('\n👨‍💼 Admin Accounts:');
    adminUsers.forEach(admin => {
      console.log(`   ${admin.username} | ${admin.Email} | Password: admin123/contest123`);
    });
    
    console.log('\n👤 User Accounts (all with password: password123):');
    regularUsers.forEach(user => {
      console.log(`   ${user.username} | ${user.Email} | Rating: ${user.rating}`);
    });

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

// Run the seeding script
seedDatabase();
