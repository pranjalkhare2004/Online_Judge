// Quick debug test
const userController = require('./controllers/userController');

console.log('userController exports:');
console.log(Object.keys(userController));
console.log('getProfile type:', typeof userController.getProfile);
console.log('updateProfile type:', typeof userController.updateProfile);
