const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://arjunsingh:VcaVyC4Dt4ULB76@cluster0.okcz8.mongodb.net/online_judge_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ Email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.Email);
      return existingAdmin;
    }

    // Create admin user with all required fields
    const adminData = {
      Email: 'admin@example.com',
      Password: 'AdminPass123!',
      FullName: 'System Administrator', 
      DOB: new Date('1990-01-01'), // Admin DOB
      role: 'admin',
      isActive: true,
      isVerified: true
    };

    console.log('Creating admin user with data:', {
      Email: adminData.Email,
      FullName: adminData.FullName,
      role: adminData.role,
      DOB: adminData.DOB
    });

    const adminUser = new User(adminData);
    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log('   Email:', adminUser.Email);
    console.log('   UserId:', adminUser.UserId);
    console.log('   Role:', adminUser.role);

    return adminUser;

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
  }
};

// Run if called directly
if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('✅ Admin user setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = createAdminUser;
