const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function resetUserDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Connected to MongoDB');

    // Delete all users
    const deleteResult = await User.deleteMany({});
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} users from database`);

    // Create Admin User
    console.log('👑 Creating admin user...');
    const adminUser = new User({
      FullName: 'System Administrator',
      Email: 'admin@onlinejudge.com',
      Password: 'AdminPass123!',  // Will be hashed by pre-save middleware
      DOB: new Date('1985-01-01'),
      role: 'admin',
      isActive: true,
      isVerified: true,
      rating: 2000
    });
    
    await adminUser.save();
    console.log('✅ Admin user created:');
    console.log('   Email: admin@onlinejudge.com');
    console.log('   Password: AdminPass123!');
    console.log('   Role: admin');
    
    // Create Test User
    console.log('👤 Creating test user...');
    const testUser = new User({
      FullName: 'Test User Account',
      Email: 'testuser@example.com',
      Password: 'TestPassword123!',  // Will be hashed by pre-save middleware
      DOB: new Date('1995-05-15'),
      username: 'testuser',
      role: 'user',
      isActive: true,
      isVerified: true,
      rating: 1200
    });
    
    await testUser.save();
    console.log('✅ Test user created:');
    console.log('   Email: testuser@example.com');
    console.log('   Password: TestPassword123!');
    console.log('   Username: testuser');
    console.log('   Role: user');
    
    // Verify users were created correctly
    console.log('\n📊 Database verification:');
    const totalUsers = await User.countDocuments();
    console.log(`Total users in database: ${totalUsers}`);
    
    const users = await User.find({}, { FullName: 1, Email: 1, role: 1 });
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.FullName} (${user.Email}) - ${user.role}`);
    });

    console.log('\n🎉 Database reset completed successfully!');
    console.log('\nYou can now login with:');
    console.log('🔑 Admin: admin@onlinejudge.com / AdminPass123!');
    console.log('🔑 Test User: testuser@example.com / TestPassword123!');
    
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
}

resetUserDatabase();
