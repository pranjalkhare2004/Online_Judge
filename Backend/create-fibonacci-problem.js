/**
 * Script to create Fibonacci problem
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Problem = require('./models/Problem');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const createFibonacciProblem = async () => {
  await connectDB();

  const fibonacciProblem = {
    title: "Fibonacci Number",
    slug: "fibonacci-number",
    difficulty: "Easy",
    description: `The Fibonacci numbers, commonly denoted F(n), form a sequence, called the Fibonacci sequence, such that each number is the sum of the two preceding ones, starting from 0 and 1.

Given n, calculate F(n).

**Example 1:**
- Input: n = 2
- Output: 1
- Explanation: F(2) = F(1) + F(0) = 1 + 0 = 1

**Example 2:**
- Input: n = 3
- Output: 2
- Explanation: F(3) = F(2) + F(1) = 1 + 1 = 2

**Example 3:**
- Input: n = 4
- Output: 3
- Explanation: F(4) = F(3) + F(2) = 2 + 1 = 3

**Constraints:**
- 0 <= n <= 30`,
    examples: [
      {
        input: "2",
        output: "1",
        explanation: "F(2) = F(1) + F(0) = 1 + 0 = 1"
      },
      {
        input: "3",
        output: "2",
        explanation: "F(3) = F(2) + F(1) = 1 + 1 = 2"
      },
      {
        input: "4",
        output: "3",
        explanation: "F(4) = F(3) + F(2) = 2 + 1 = 3"
      }
    ],
    testCases: [
      { input: "0", expectedOutput: "0" },
      { input: "1", expectedOutput: "1" },
      { input: "2", expectedOutput: "1" },
      { input: "3", expectedOutput: "2" },
      { input: "10", expectedOutput: "55" }
    ],
    timeLimit: 2000,
    memoryLimit: 256,
    tags: ["recursion", "dynamic programming", "math"],
    points: 100,
    totalSubmissions: 0,
    acceptedSubmissions: 0,
    acceptanceRate: 0,
    isFeatured: true,
    isActive: true
  };

  try {
    // Check if problem already exists
    const existing = await Problem.findOne({ slug: "fibonacci-number" });
    if (existing) {
      console.log('ℹ️  Fibonacci problem already exists');
      console.log('ID:', existing._id);
      process.exit(0);
    }

    const problem = new Problem(fibonacciProblem);
    const saved = await problem.save();
    console.log('✅ Fibonacci problem created successfully!');
    console.log('Problem ID:', saved._id);
    console.log('Title:', saved.title);
    console.log('Slug:', saved.slug);
    console.log('Test Cases:', saved.testCases.length);
  } catch (error) {
    console.error('❌ Error creating problem:', error);
  }

  mongoose.connection.close();
};

createFibonacciProblem();
