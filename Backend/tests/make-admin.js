const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function makeUserAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the test user and make them admin
    const user = await User.findOne({ email: 'authtest@example.com' });
    
    if (user) {
      user.role = 'admin';
      await user.save();
      console.log('✅ User promoted to admin:', {
        name: user.name,
        email: user.email,
        role: user.role
      });
    } else {
      console.log('❌ User not found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

makeUserAdmin();
