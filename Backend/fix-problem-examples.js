// Fix the Add Two Numbers problem examples to have correct input format
require('dotenv').config();
const mongoose = require('mongoose');
const Problem = require('./models/Problem');

async function fixProblemExamples() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const problemId = '68a8e613b292cda449cefd3b';
    
    console.log('🔍 Updating Add Two Numbers problem examples...');
    
    const updateResult = await Problem.findByIdAndUpdate(problemId, {
      examples: [
        {
          input: '5 3',
          output: '8',
          explanation: '5 + 3 = 8'
        },
        {
          input: '-1 1',
          output: '0',
          explanation: '-1 + 1 = 0'
        }
      ]
    }, { new: true });
    
    if (updateResult) {
      console.log('✅ Successfully updated problem examples!');
      console.log('📋 New examples:');
      updateResult.examples.forEach((example, index) => {
        console.log(`Example ${index + 1}:`);
        console.log(`  Input: '${example.input}'`);
        console.log(`  Output: '${example.output}'`);
        console.log(`  Explanation: '${example.explanation}'`);
        console.log();
      });
    } else {
      console.log('❌ Problem not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
    process.exit(0);
  }
}

fixProblemExamples();
