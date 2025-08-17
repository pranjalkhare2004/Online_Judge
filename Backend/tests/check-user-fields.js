require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find any existing user to see the field structure
    const users = await User.find({}).limit(3);
    console.log('Existing users count:', users.length);
    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`, JSON.stringify(user.toObject(), null, 2));
    });
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
