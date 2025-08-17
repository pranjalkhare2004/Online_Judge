require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function createTestUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Remove existing test user if exists
    await User.deleteOne({ Email: 'logintest@example.com' });
    console.log('Removed existing test user');
    
    // Create new test user
    const testUser = new User({
      FullName: 'Login Test User',
      Email: 'logintest@example.com',
      Password: 'LoginTest123!',  // This will be hashed by pre-save middleware
      DOB: new Date('1995-01-01'),
      role: 'user',
      isActive: true
    });
    
    await testUser.save();
    console.log('✅ Test user created with email: logintest@example.com');
    console.log('Password: LoginTest123!');
    
    // Verify the user was created correctly
    const savedUser = await User.findOne({ Email: 'logintest@example.com' });
    console.log('User verification:', {
      id: savedUser._id,
      email: savedUser.Email,
      name: savedUser.FullName,
      hasPassword: !!savedUser.Password
    });
    
    // Test password comparison
    const isMatch = await savedUser.comparePassword('LoginTest123!');
    console.log('Password comparison test:', isMatch);
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await mongoose.connection.close();
  }
}

createTestUser();
