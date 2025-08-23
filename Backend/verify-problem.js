const mongoose = require('mongoose');
require('dotenv').config();
const Problem = require('./models/Problem');
const TestCase = require('./models/TestCase');

async function verifyAddTwoNumbersProblem() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/online_judge');
    console.log('🔗 Connected to database');
    
    const problemId = '68a8e613b292cda449cefd3b'; // Add Two Numbers
    
    // Get the complete problem details
    console.log('📋 Retrieving problem details...');
    const problem = await Problem.findById(problemId);
    
    if (!problem) {
      console.log('❌ Problem not found!');
      return;
    }
    
    console.log('\n📄 PROBLEM DETAILS:');
    console.log(`Title: ${problem.title}`);
    console.log(`Difficulty: ${problem.difficulty}`);
    console.log(`Time Limit: ${problem.timeLimit}ms`);
    console.log(`Memory Limit: ${problem.memoryLimit}MB`);
    console.log(`Tags: ${problem.tags ? problem.tags.join(', ') : 'None'}`);
    console.log('\nDescription:');
    console.log(problem.description);
    console.log('\nInput Format:');
    console.log(problem.inputFormat || 'Not specified');
    console.log('\nOutput Format:');
    console.log(problem.outputFormat || 'Not specified');
    console.log('\nConstraints:');
    console.log(problem.constraints || 'Not specified');
    console.log('\nExamples:');
    console.log(problem.examples || 'Not specified');
    
    // Get all test cases
    console.log('\n📊 TEST CASES:');
    const allTestCases = await TestCase.find({ problemId }).sort({ createdAt: 1 });
    console.log(`Total test cases: ${allTestCases.length}`);
    
    let publicCount = 0;
    let privateCount = 0;
    
    allTestCases.forEach((tc, index) => {
      const visibility = tc.isPublic ? 'PUBLIC' : 'PRIVATE';
      console.log(`\nTest Case ${index + 1} (${visibility}):`);
      console.log(`  Input: ${tc.input}`);
      console.log(`  Expected Output: ${tc.expectedOutput}`);
      console.log(`  Points: ${tc.points}`);
      console.log(`  Description: ${tc.description || 'None'}`);
      
      if (tc.isPublic) publicCount++;
      else privateCount++;
    });
    
    console.log(`\n📈 SUMMARY:`);
    console.log(`  Public test cases: ${publicCount}`);
    console.log(`  Private test cases: ${privateCount}`);
    console.log(`  Total: ${allTestCases.length}`);
    
    await mongoose.disconnect();
    console.log('\n✅ Problem verification completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyAddTwoNumbersProblem();
