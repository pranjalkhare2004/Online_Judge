const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const config = require('../config/config');

const createAdminUser = async () => {
  try {
    // Connect to database
    await mongoose.connect(config.database.uri, config.database.options);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@algouniversity.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = new User({
      firstname: 'System',
      lastname: 'Administrator',
      email: 'admin@algouniversity.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      isEmailVerified: true
    });

    await adminUser.save();
    
    console.log('🎉 Admin user created successfully!');
    console.log('Email: admin@algouniversity.com');
    console.log('Password: admin123');
    console.log('⚠️  Please change the password after first login');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 MongoDB is not running. Please:');
      console.log('1. Start MongoDB locally, or');
      console.log('2. Update MONGODB_URL in .env to use MongoDB Atlas');
    }
  } finally {
    await mongoose.disconnect();
    console.log('📝 Database connection closed');
  }
};

// Create a few demo users as well
const createDemoUsers = async () => {
  try {
    await mongoose.connect(config.database.uri, config.database.options);
    
    const demoUsers = [
      {
        firstname: 'John',
        lastname: 'Student',
        email: 'student@example.com',
        password: await bcrypt.hash('student123', 12),
        role: 'user'
      },
      {
        firstname: 'Jane',
        lastname: 'Coder',
        email: 'jane@example.com', 
        password: await bcrypt.hash('password123', 12),
        role: 'user'
      }
    ];

    for (const userData of demoUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        console.log(`✅ Demo user created: ${userData.email}`);
      }
    }

  } catch (error) {
    console.error('Error creating demo users:', error.message);
  } finally {
    await mongoose.disconnect();
  }
};

// Run the setup
const runSetup = async () => {
  console.log('🚀 Setting up Online Judge Platform...\n');
  
  await createAdminUser();
  console.log('');
  await createDemoUsers();
  
  console.log('\n✨ Setup complete! You can now:');
  console.log('1. Start the backend server: npm start');
  console.log('2. Login as admin: admin@algouniversity.com / admin123');
  console.log('3. Login as student: student@example.com / student123');
};

runSetup();
