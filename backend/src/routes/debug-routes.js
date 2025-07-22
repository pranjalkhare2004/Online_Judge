// Test file to debug the exact issue with routes
console.log('Starting route debugging...');

try {
  const userController = require('../controllers/userController');
  const { authenticate } = require('../middleware/auth');
  
  console.log('userController imported successfully');
  console.log('getProfile exists:', typeof userController.getProfile);
  console.log('updateProfile exists:', typeof userController.updateProfile);
  console.log('getAllUsers exists:', typeof userController.getAllUsers);
  
  // Test if authenticate middleware exists
  console.log('authenticate middleware type:', typeof authenticate);
  
} catch (error) {
  console.error('Error during import:', error.message);
  console.error('Stack:', error.stack);
}
