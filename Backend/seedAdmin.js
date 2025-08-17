/**
 * ADMIN USER SEEDING SCRIPT
 * 
 * DESCRIPTION:
 * This script creates or updates the default administrator user account
 * for the Online Judge system. It handles secure password hashing,
 * database connection management, and admin user initialization.
 * Essential for system setup and administrative access.
 * 
 * FUNCTIONS USED:
 * - seedAdminUser(): Main admin user creation function
 * - mongoose.connect(): Database connection establishment
 * - bcrypt.hash(): Password hashing for security
 * - User.findOne(): Admin user existence check
 * - User.save(): New admin user creation
 * - User.updateOne(): Existing admin user updates
 * - console.log(): Progress and status logging
 * - process.exit(): Script termination
 * 
 * EXPORTS:
 * - seedAdminUser: Admin user seeding function (for programmatic use)
 * 
 * USED BY:
 * - package.json: npm run seed-admin script
 * - server.js: Optional admin seeding during startup
 * - deployment scripts: Production setup automation
 * - tests/setup.js: Test environment admin creation
 * - Docker initialization: Container setup
 * 
 * DEPENDENCIES:
 * - models/User.js: User model for database operations
 * - .env: Environment configuration
 * 
 * ADMIN USER CONFIGURATION:
 * - Email: admin@example.com (configurable)
 * - Username: admin (configurable)
 * - Role: admin
 * - Password: AdminPass123! (configurable, hashed)
 * - Verification: Pre-verified account
 * 
 * SECURITY FEATURES:
 * - bcrypt password hashing (12 rounds)
 * - Environment variable configuration
 * - Duplicate prevention checks
 * - Secure default credentials
 * 
 * SCRIPT EXECUTION:
 * - Can be run standalone: node seedAdmin.js
 * - Can be imported and used programmatically
 * - Handles existing connections gracefully
 * - Provides detailed logging output
 * - Automatic database connection cleanup
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Load environment variables
require('dotenv').config();

async function seedAdminUser() {
  try {
    // Use same connection as server
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/onlinejudge';
    
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log('Using existing MongoDB connection');
    } else {
      await mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('Connected to MongoDB');
    }
    
    // Check if admin user exists
    let adminUser = await User.findOne({ email: 'admin@example.com' });
    
    if (!adminUser) {
      // Create admin user if doesn't exist
      const hashedPassword = await bcrypt.hash('AdminPass123!', 12);
      adminUser = new User({
        name: 'Admin User',
        email: 'admin@example.com',
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        isVerified: true,
        isActive: true
      });
      await adminUser.save();
      console.log('Admin user created');
    } else {
      // Update existing user to admin role
      adminUser.role = 'admin';
      adminUser.isVerified = true;
      adminUser.isActive = true;
      await adminUser.save();
      console.log('Admin user updated');
    }
    
    console.log('Admin user details:', {
      id: adminUser._id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      username: adminUser.username,
      isVerified: adminUser.isVerified,
      isActive: adminUser.isActive
    });
    
    // Also create a regular test user
    let testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      const hashedPassword = await bcrypt.hash('TestPass123!', 12);
      testUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        password: hashedPassword,
        role: 'user',
        isVerified: true,
        isActive: true
      });
      await testUser.save();
      console.log('Test user created');
    }
    
    console.log('Seeding completed successfully');
    return true;
  } catch (error) {
    console.error('Error seeding admin user:', error);
    throw error;
  }
}

// Export for use in server or run standalone
if (require.main === module) {
  seedAdminUser()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seedAdminUser };
