/**
 * ADD INDIVIDUAL PROBLEM SCRIPT
 * 
 * This script demonstrates how to manually add a single problem
 * to the database with test cases
 */

const mongoose = require('mongoose');
const Problem = require('./models/Problem');
const TestCase = require('./models/TestCase');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Add a single problem
const addProblem = async () => {
  try {
    await connectDB();

    // Find admin user (or create a default one)
    let adminUser = await User.findOne({ Email: 'admin@onlinejudge.com' });
    if (!adminUser) {
      adminUser = new User({
        FullName: 'Administrator',
        Email: 'admin@onlinejudge.com',
        Password: 'AdminPassword123',
        DOB: new Date('1990-01-01'),
        role: 'admin',
        isActive: true
      });
      await adminUser.save();
    }

    // Define the new problem
    const newProblem = {
      title: "Reverse Integer",
      difficulty: "Medium",
      description: `Given a signed 32-bit integer x, return x with its digits reversed. If reversing x causes the value to go outside the signed 32-bit integer range [-2^31, 2^31 - 1], then return 0.

Assume the environment does not allow you to store 64-bit integers (signed or unsigned).`,
      constraints: [
        "-2^31 <= x <= 2^31 - 1"
      ],
      examples: [
        {
          input: "x = 123",
          output: "321",
          explanation: "Simply reverse the digits."
        },
        {
          input: "x = -123",
          output: "-321",
          explanation: "Reverse the digits but keep the negative sign."
        },
        {
          input: "x = 120",
          output: "21",
          explanation: "Remove trailing zeros after reversing."
        }
      ],
      tags: ["Math"],
      timeLimit: 1000,
      memoryLimit: 256,
      testCases: [
        { input: "123", expectedOutput: "321", isPublic: true, description: "Positive number" },
        { input: "-123", expectedOutput: "-321", isPublic: true, description: "Negative number" },
        { input: "120", expectedOutput: "21", isPublic: false, description: "Trailing zeros" },
        { input: "0", expectedOutput: "0", isPublic: false, description: "Zero" },
        { input: "1534236469", expectedOutput: "0", isPublic: false, description: "Overflow case" }
      ]
    };

    // Check if problem already exists
    const existingProblem = await Problem.findOne({ 
      title: newProblem.title 
    });

    if (existingProblem) {
      console.log(`❌ Problem "${newProblem.title}" already exists`);
      return;
    }

    // Create the problem
    const problem = new Problem({
      title: newProblem.title,
      slug: newProblem.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, ''),
      difficulty: newProblem.difficulty,
      description: newProblem.description,
      constraints: newProblem.constraints,
      examples: newProblem.examples,
      tags: newProblem.tags,
      timeLimit: newProblem.timeLimit,
      memoryLimit: newProblem.memoryLimit,
      createdBy: adminUser._id,
      totalSubmissions: Math.floor(Math.random() * 500) + 100,
      acceptedSubmissions: Math.floor(Math.random() * 300) + 50,
      isFeatured: Math.random() > 0.7,
      isActive: true
    });

    const savedProblem = await problem.save();
    console.log(`✓ Created problem: ${savedProblem.title}`);

    // Create test cases
    for (const testCase of newProblem.testCases) {
      const testCaseDoc = new TestCase({
        problemId: savedProblem._id,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        isPublic: testCase.isPublic,
        description: testCase.description
      });
      await testCaseDoc.save();
    }
    console.log(`  ✓ Created ${newProblem.testCases.length} test cases`);

    console.log('\n✅ Problem added successfully!');
    console.log(`📊 Problem Stats:`);
    console.log(`   - ID: ${savedProblem._id}`);
    console.log(`   - Slug: ${savedProblem.slug}`);
    console.log(`   - Difficulty: ${savedProblem.difficulty}`);
    console.log(`   - Tags: ${savedProblem.tags.join(', ')}`);
    console.log(`   - Test Cases: ${newProblem.testCases.length}`);

  } catch (error) {
    console.error('Error adding problem:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the script
addProblem();
