const mongoose = require('mongoose');
require('dotenv').config();
const Problem = require('./models/Problem');
const TestCase = require('./models/TestCase');

async function updateAddTwoNumbersProblem() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/online_judge');
    console.log('🔗 Connected to database');
    
    const problemId = '68a8e613b292cda449cefd3b'; // Add Two Numbers
    
    console.log('📝 Updating Add Two Numbers problem...');
    
    // Update the problem details to match the specification
    const updatedProblem = await Problem.findByIdAndUpdate(problemId, {
      title: 'Add Two Numbers',
      difficulty: 'Easy',
      timeLimit: 1000,
      memoryLimit: 128,
      tags: ['Math', 'Basics'],
      description: `Given two integers, return their sum.

**Example:**
\`\`\`
Input: a = 5, b = 3
Output: 8
\`\`\``,
      inputFormat: 'Two integers a and b separated by a space.',
      outputFormat: 'A single integer representing the sum of a and b.',
      constraints: ['−10^9 ≤ a, b ≤ 10^9'],
      examples: [
        {
          input: 'a = 5, b = 3',
          output: '8',
          explanation: '5 + 3 = 8'
        },
        {
          input: 'a = -1, b = 1', 
          output: '0',
          explanation: '-1 + 1 = 0'
        }
      ]
    }, { new: true });
    
    console.log('✅ Problem details updated successfully!');
    
    // Delete existing test cases
    console.log('🗑️ Removing old test cases...');
    await TestCase.deleteMany({ problemId });
    
    // Create new test cases that match the examples and provide comprehensive coverage
    console.log('📝 Creating new test cases...');
    
    const newTestCases = [
      {
        problemId: problemId,
        input: '5 3',
        expectedOutput: '8',
        isPublic: true,
        description: 'Example 1: Basic positive addition',
        points: 10
      },
      {
        problemId: problemId,
        input: '-1 1',
        expectedOutput: '0',
        isPublic: true,
        description: 'Example 2: Negative and positive addition',
        points: 10
      },
      {
        problemId: problemId,
        input: '0 0',
        expectedOutput: '0',
        isPublic: false,
        description: 'Edge case: Both numbers are zero',
        points: 20
      },
      {
        problemId: problemId,
        input: '-100 -200',
        expectedOutput: '-300',
        isPublic: false,
        description: 'Both negative numbers',
        points: 20
      },
      {
        problemId: problemId,
        input: '1000000000 -1000000000',
        expectedOutput: '0',
        isPublic: false,
        description: 'Large numbers at constraint limits',
        points: 20
      },
      {
        problemId: problemId,
        input: '999999999 1',
        expectedOutput: '1000000000',
        isPublic: false,
        description: 'Large positive result',
        points: 20
      }
    ];
    
    await TestCase.insertMany(newTestCases);
    console.log(`✅ Created ${newTestCases.length} new test cases`);
    
    // Verify the updated problem
    console.log('\n📋 VERIFICATION - Updated Problem:');
    const verifyProblem = await Problem.findById(problemId);
    console.log(`Title: ${verifyProblem.title}`);
    console.log(`Difficulty: ${verifyProblem.difficulty}`);
    console.log(`Time Limit: ${verifyProblem.timeLimit}ms`);
    console.log(`Memory Limit: ${verifyProblem.memoryLimit}MB`);
    console.log(`Tags: ${verifyProblem.tags.join(', ')}`);
    console.log('\nDescription:');
    console.log(verifyProblem.description);
    console.log('\nInput Format:');
    console.log(verifyProblem.inputFormat);
    console.log('\nOutput Format:');
    console.log(verifyProblem.outputFormat);
    console.log('\nConstraints:');
    console.log(verifyProblem.constraints.join(', '));
    
    // Verify test cases
    console.log('\n📊 VERIFICATION - Test Cases:');
    const verifyTestCases = await TestCase.find({ problemId }).sort({ isPublic: -1, createdAt: 1 });
    
    let publicCount = 0;
    let privateCount = 0;
    
    verifyTestCases.forEach((tc, index) => {
      const visibility = tc.isPublic ? 'PUBLIC' : 'PRIVATE';
      console.log(`\nTest Case ${index + 1} (${visibility}):`);
      console.log(`  Input: ${tc.input}`);
      console.log(`  Expected Output: ${tc.expectedOutput}`);
      console.log(`  Points: ${tc.points}`);
      console.log(`  Description: ${tc.description}`);
      
      if (tc.isPublic) publicCount++;
      else privateCount++;
    });
    
    console.log(`\n📈 FINAL SUMMARY:`);
    console.log(`  Public test cases: ${publicCount}`);
    console.log(`  Private test cases: ${privateCount}`);
    console.log(`  Total: ${verifyTestCases.length}`);
    console.log(`  Total points: ${verifyTestCases.reduce((sum, tc) => sum + tc.points, 0)}`);
    
    await mongoose.disconnect();
    console.log('\n🎉 Add Two Numbers problem updated successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) console.error(error.stack);
  }
}

updateAddTwoNumbersProblem();
