const mongoose = require('mongoose');
const Problem = require('../models/Problem');
const config = require('../config/config');

const sampleProblems = [
  {
    title: "Two Sum",
    slug: "two-sum",
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

**Example 1:**
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

**Example 2:**
Input: nums = [3,2,4], target = 6
Output: [1,2]`,
    difficulty: "Easy",
    category: "Array",
    tags: ["array", "hash-table"],
    constraints: "2 <= nums.length <= 10^4, -10^9 <= nums[i] <= 10^9, -10^9 <= target <= 10^9, Only one valid answer exists.",
    inputFormat: "First line contains array of integers nums separated by spaces. Second line contains target integer.",
    outputFormat: "Two integers representing indices of numbers that add up to target.",
    sampleInput: "[2,7,11,15]\n9",
    sampleOutput: "[0,1]",
    explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
    points: 100,
    timeLimit: 1000,
    memoryLimit: 256,
    testCases: [
      {
        input: "[2,7,11,15]\n9",
        expectedOutput: "[0,1]",
        isHidden: false
      },
      {
        input: "[3,2,4]\n6", 
        expectedOutput: "[1,2]",
        isHidden: false
      },
      {
        input: "[3,3]\n6",
        expectedOutput: "[0,1]",
        isHidden: true
      }
    ],
    hints: [
      "Try using a hash map to store numbers you've seen",
      "For each number, check if target - number exists in the hash map"
    ]
  },
  {
    title: "Reverse String",
    slug: "reverse-string",
    description: `Write a function that reverses a string. The input string is given as an array of characters s.

You must do this by modifying the input array in-place with O(1) extra memory.

**Example 1:**
Input: s = ["h","e","l","l","o"]
Output: ["o","l","l","e","h"]

**Example 2:**
Input: s = ["H","a","n","n","a","h"]
Output: ["h","a","n","n","a","H"]`,
    difficulty: "Easy",
    category: "String", 
    tags: ["string", "two-pointers"],
    constraints: "1 <= s.length <= 10^5, s[i] is a printable ascii character",
    inputFormat: "Array of characters as strings",
    outputFormat: "Reversed array of characters",
    sampleInput: '["h","e","l","l","o"]',
    sampleOutput: '["o","l","l","e","h"]',
    explanation: "Reverse the input array by swapping characters from both ends moving towards center.",
    points: 50,
    timeLimit: 1000,
    memoryLimit: 256,
    testCases: [
      {
        input: '["h","e","l","l","o"]',
        expectedOutput: '["o","l","l","e","h"]',
        isHidden: false
      },
      {
        input: '["H","a","n","n","a","h"]',
        expectedOutput: '["h","a","n","n","a","H"]', 
        isHidden: false
      }
    ],
    hints: [
      "Use two pointers, one at the start and one at the end",
      "Swap characters and move pointers towards center"
    ]
  },
  {
    title: "Binary Search",
    slug: "binary-search",
    description: `Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.

You must write an algorithm with O(log n) runtime complexity.

**Example 1:**
Input: nums = [-1,0,3,5,9,12], target = 9
Output: 4
Explanation: 9 exists in nums and its index is 4

**Example 2:**
Input: nums = [-1,0,3,5,9,12], target = 2
Output: -1
Explanation: 2 does not exist in nums so return -1`,
    difficulty: "Easy",
    category: "Binary Search",
    tags: ["array", "binary-search"],
    constraints: "1 <= nums.length <= 10^4, -10^4 < nums[i], target < 10^4, All integers in nums are unique, nums is sorted in ascending order",
    inputFormat: "First line contains sorted array of integers. Second line contains target integer.",
    outputFormat: "Index of target if found, otherwise -1.",
    sampleInput: "[-1,0,3,5,9,12]\n9",
    sampleOutput: "4",
    explanation: "9 exists in nums and its index is 4",
    points: 150,
    timeLimit: 1000,
    memoryLimit: 256,
    testCases: [
      {
        input: "[-1,0,3,5,9,12]\n9",
        expectedOutput: "4",
        isHidden: false
      },
      {
        input: "[-1,0,3,5,9,12]\n2",
        expectedOutput: "-1", 
        isHidden: false
      },
      {
        input: "[5]\n5",
        expectedOutput: "0",
        isHidden: true
      }
    ],
    hints: [
      "Use binary search with left and right pointers",
      "Compare middle element with target to decide search direction"
    ]
  }
];

const seedDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(config.database.uri, config.database.options);
    console.log('✅ Connected to MongoDB');

    // Get admin user as author
    const User = require('../models/User');
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('❌ No admin user found. Please run setupAdmins.js first');
      return;
    }

    // Clear existing problems
    const existingCount = await Problem.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing problems`);
      // For now, let's skip clearing and just add new ones
      console.log('👍 Adding new problems alongside existing ones...');
    }

    // Insert sample problems
    let insertCount = 0;
    for (const problemData of sampleProblems) {
      const existingProblem = await Problem.findOne({ title: problemData.title });
      if (!existingProblem) {
        // Add author field
        problemData.author = adminUser._id;
        
        const problem = new Problem(problemData);
        await problem.save();
        console.log(`✅ Created problem: ${problemData.title}`);
        insertCount++;
      } else {
        console.log(`⏭️  Problem already exists: ${problemData.title}`);
      }
    }

    console.log(`\n🎉 Database seeding complete!`);
    console.log(`📊 Problems added: ${insertCount}`);
    console.log(`📊 Total problems in database: ${await Problem.countDocuments()}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 MongoDB is not running. Please:');
      console.log('1. Start MongoDB locally, or');
      console.log('2. Update MONGODB_URL in .env to use MongoDB Atlas');
    }
  } finally {
    await mongoose.disconnect();
    console.log('📝 Database connection closed');
  }
};

// Run the seeding
seedDatabase();
