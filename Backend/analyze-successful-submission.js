/**
 * ANALYZE SUCCESSFUL SUBMISSION
 * 
 * Purpose: Examine the one successful submission to understand what works
 */

const mongoose = require('mongoose');
require('dotenv').config();
const { connectDB } = require('./config/db');
const Submission = require('./models/Submission');
const User = require('./models/User');
const Problem = require('./models/Problem');

async function analyzeSuccessfulSubmission() {
  console.log('🔍 ANALYZING SUCCESSFUL SUBMISSION');
  console.log('==================================');
  
  try {
    await connectDB();
    console.log('✅ Database connected');
    
    // Find the successful submission
    const successfulSubmission = await Submission.findOne({ 
      status: 'ACCEPTED' 
    }).sort({ submittedAt: -1 });
    
    if (successfulSubmission) {
      console.log('\n🎉 FOUND SUCCESSFUL SUBMISSION:');
      console.log(`ID: ${successfulSubmission._id}`);
      console.log(`Status: ${successfulSubmission.status}`);
      console.log(`Language: ${successfulSubmission.language}`);
      console.log(`Submitted: ${successfulSubmission.submittedAt}`);
      console.log(`Updated: ${successfulSubmission.updatedAt}`);
      console.log(`Execution Time: ${successfulSubmission.executionTime}ms`);
      console.log(`Memory Used: ${successfulSubmission.memoryUsed}MB`);
      
      // Get user details
      const user = await User.findById(successfulSubmission.userId);
      console.log(`User: ${user?.username || 'Unknown'}`);
      
      // Get problem details
      const problem = await Problem.findById(successfulSubmission.problemId);
      console.log(`Problem: ${problem?.title || 'Unknown'}`);
      console.log(`Problem Slug: ${problem?.slug || 'Unknown'}`);
      
      console.log('\n📝 SUCCESSFUL CODE:');
      console.log('================');
      console.log(successfulSubmission.code);
      console.log('================');
      
      if (successfulSubmission.output) {
        console.log('\n📤 OUTPUT:');
        console.log('==========');
        console.log(successfulSubmission.output);
        console.log('==========');
      }
      
      if (successfulSubmission.testResults && successfulSubmission.testResults.length > 0) {
        console.log('\n🧪 TEST RESULTS:');
        console.log('===============');
        successfulSubmission.testResults.forEach((test, index) => {
          console.log(`Test ${index + 1}:`);
          console.log(`  Input: ${test.input || 'N/A'}`);
          console.log(`  Expected: ${test.expectedOutput || 'N/A'}`);
          console.log(`  Actual: ${test.actualOutput || 'N/A'}`);
          console.log(`  Passed: ${test.passed}`);
        });
      }
      
      // Let's also look at the problem's test cases
      if (problem && problem.testCases) {
        console.log('\n🔬 PROBLEM TEST CASES:');
        console.log('=====================');
        problem.testCases.forEach((testCase, index) => {
          console.log(`Test Case ${index + 1}:`);
          console.log(`  Input: ${testCase.input || 'N/A'}`);
          console.log(`  Expected Output: ${testCase.expectedOutput || 'N/A'}`);
        });
      }
      
    } else {
      console.log('❌ No successful submissions found');
      
      // Let's check the most recent submissions to understand patterns
      console.log('\n📊 RECENT SUBMISSION ANALYSIS:');
      const recentSubmissions = await Submission.find({})
        .sort({ submittedAt: -1 })
        .limit(5);
      
      for (let sub of recentSubmissions) {
        console.log(`\n📋 Submission ${sub._id}:`);
        console.log(`   Status: ${sub.status}`);
        console.log(`   Execution Time: ${sub.executionTime}ms`);
        console.log(`   Code Length: ${sub.code?.length || 0} chars`);
        
        if (sub.code && sub.code.length < 500) {
          console.log(`   Code Preview: ${sub.code.substring(0, 200)}...`);
        }
      }
    }
    
    // Check problem structure for Two Sum
    const twoSumProblem = await Problem.findOne({
      $or: [
        { slug: { $regex: 'two-sum', $options: 'i' } },
        { title: { $regex: 'two sum', $options: 'i' } }
      ]
    });
    
    if (twoSumProblem) {
      console.log('\n🎯 TWO SUM PROBLEM ANALYSIS:');
      console.log('============================');
      console.log(`Title: ${twoSumProblem.title}`);
      console.log(`Slug: ${twoSumProblem.slug}`);
      console.log(`Difficulty: ${twoSumProblem.difficulty}`);
      
      if (twoSumProblem.testCases && twoSumProblem.testCases.length > 0) {
        console.log(`Test Cases Count: ${twoSumProblem.testCases.length}`);
        
        twoSumProblem.testCases.slice(0, 3).forEach((testCase, index) => {
          console.log(`\nTest Case ${index + 1}:`);
          console.log(`  Input: "${testCase.input}"`);
          console.log(`  Expected: "${testCase.expectedOutput}"`);
        });
      }
      
      console.log('\n💡 ANALYSIS INSIGHTS:');
      console.log('- Check if your solution output exactly matches expected format');
      console.log('- Ensure no extra whitespace or formatting in output');
      console.log('- Verify input parsing is correct for the problem format');
    }
    
  } catch (error) {
    console.error('❌ Analysis error:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n✅ Database connection closed');
    }
  }
}

// Run the analysis
if (require.main === module) {
  analyzeSuccessfulSubmission();
}

module.exports = { analyzeSuccessfulSubmission };
