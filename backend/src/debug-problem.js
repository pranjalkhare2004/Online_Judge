// Debug problemController exports
try {
  const problemController = require('../controllers/problemController');
  console.log('problemController exports:');
  console.log(Object.keys(problemController));
} catch (error) {
  console.error('Error importing problemController:', error.message);
}
