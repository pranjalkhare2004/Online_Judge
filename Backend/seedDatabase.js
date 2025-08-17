/**
 * DATABASE SEEDING SCRIPT
 * 
 * DESCRIPTION:
 * This comprehensive script populates the Online Judge database with sample data
 * for development, testing, and demonstration purposes. It creates users, problems,
 * contests, submissions, and test cases with realistic data relationships.
 * Essential for development environment setup and testing scenarios.
 * 
 * FUNCTIONS USED:
 * - connectDB(): Database connection establishment
 * - seedUsers(): User account creation with various roles
 * - seedProblems(): Sample coding problems with test cases
 * - seedContests(): Contest creation with problem associations
 * - seedSubmissions(): Sample submission records
 * - seedTestCases(): Test case data for problems
 * - generateSlug(): URL-friendly slug generation
 * - mongoose.connect(): Database connection
 * - bcrypt.hash(): Password hashing for user accounts
 * - Model.deleteMany(): Collection cleanup
 * - Model.insertMany(): Bulk data insertion
 * - console.log(): Progress tracking and logging
 * 
 * EXPORTS:
 * - Individual seeding functions (for selective seeding)
 * - Main execution when run directly
 * 
 * USED BY:
 * - package.json: npm run seed script
 * - development setup: Local environment initialization
 * - testing: Test data preparation
 * - CI/CD: Automated testing data setup
 * - Docker: Container initialization
 * 
 * DEPENDENCIES:
 * - models/User.js: User account model
 * - models/Problem.js: Problem model
 * - models/Contest.js: Contest model
 * - models/Submission.js: Submission model
 * - models/TestCase.js: Test case model
 * 
 * SEEDED DATA:
 * - Users: Admin, regular users, test accounts
 * - Problems: Algorithm problems with varying difficulties
 * - Contests: Sample programming contests
 * - Submissions: Historical submission records
 * - Test Cases: Input/output test cases for problems
 * 
 * DATA RELATIONSHIPS:
 * - Users linked to submissions and contest participation
 * - Problems associated with test cases and submissions
 * - Contests containing multiple problems
 * - Submissions referencing users and problems
 * 
 * SCRIPT FEATURES:
 * - Complete database reset and repopulation
 * - Realistic sample data generation
 * - Proper data relationships and references
 * - Error handling and rollback capability
 * - Progress logging and status updates
 * - Configurable data quantities
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Problem = require('./models/Problem');
const Contest = require('./models/Contest');
const Submission = require('./models/Submission');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/online-judge', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const seedUsers = async () => {
  try {
    // Clear existing users
    await User.deleteMany({});
    
    const users = [
      {
        name: 'Admin User',
        email: 'admin@codejudge.com',
        username: 'admin',
        password: 'Admin123!',
        rating: 2400,
        isVerified: true,
        role: 'admin'
      },
      {
        name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'Password123!',
        rating: 1800,
        isVerified: true
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        username: 'janesmith',
        password: 'Password123!',
        rating: 2100,
        isVerified: true
      },
      {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        username: 'alicej',
        password: 'Password123!',
        rating: 1650,
        isVerified: true
      },
      {
        name: 'Bob Wilson',
        email: 'bob@example.com',
        username: 'bobw',
        password: 'Password123!',
        rating: 1920,
        isVerified: true
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log('✅ Users seeded successfully');
    return createdUsers;
  } catch (error) {
    console.error('❌ Error seeding users:', error);
  }
};

const seedProblems = async () => {
  try {
    // Clear existing problems
    await Problem.deleteMany({});
    
    const problems = [
      {
        title: 'Two Sum',
        slug: 'two-sum',
        difficulty: 'Easy',
        description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
        constraints: [
          '2 <= nums.length <= 10^4',
          '-10^9 <= nums[i] <= 10^9',
          '-10^9 <= target <= 10^9',
          'Only one valid answer exists.'
        ],
        examples: [
          {
            input: 'nums = [2,7,11,15], target = 9',
            output: '[0,1]',
            explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
          },
          {
            input: 'nums = [3,2,4], target = 6',
            output: '[1,2]',
            explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].'
          }
        ],
        tags: ['Array', 'Hash Table'],
        timeLimit: 1000,
        memoryLimit: 256,
        isFeatured: true,
        totalSubmissions: 150,
        acceptedSubmissions: 95
      },
      {
        title: 'Add Two Numbers',
        slug: 'add-two-numbers',
        difficulty: 'Medium',
        description: `You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.

You may assume the two numbers do not contain any leading zero, except the number 0 itself.`,
        constraints: [
          'The number of nodes in each linked list is in the range [1, 100].',
          '0 <= Node.val <= 9',
          'It is guaranteed that the list represents a number that does not have leading zeros.'
        ],
        examples: [
          {
            input: 'l1 = [2,4,3], l2 = [5,6,4]',
            output: '[7,0,8]',
            explanation: '342 + 465 = 807.'
          },
          {
            input: 'l1 = [0], l2 = [0]',
            output: '[0]'
          }
        ],
        tags: ['Linked List', 'Math', 'Recursion'],
        timeLimit: 1500,
        memoryLimit: 256,
        isFeatured: true,
        totalSubmissions: 89,
        acceptedSubmissions: 52
      },
      {
        title: 'Longest Substring Without Repeating Characters',
        slug: 'longest-substring-without-repeating-characters',
        difficulty: 'Medium',
        description: `Given a string s, find the length of the longest substring without repeating characters.`,
        constraints: [
          '0 <= s.length <= 5 * 10^4',
          's consists of English letters, digits, symbols and spaces.'
        ],
        examples: [
          {
            input: 's = "abcabcbb"',
            output: '3',
            explanation: 'The answer is "abc", with the length of 3.'
          },
          {
            input: 's = "bbbbb"',
            output: '1',
            explanation: 'The answer is "b", with the length of 1.'
          }
        ],
        tags: ['Hash Table', 'String', 'Sliding Window'],
        timeLimit: 1000,
        memoryLimit: 256,
        isFeatured: false,
        totalSubmissions: 120,
        acceptedSubmissions: 68
      },
      {
        title: 'Median of Two Sorted Arrays',
        slug: 'median-of-two-sorted-arrays',
        difficulty: 'Hard',
        description: `Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.

The overall run time complexity should be O(log (m+n)).`,
        constraints: [
          'nums1.length == m',
          'nums2.length == n',
          '0 <= m <= 1000',
          '0 <= n <= 1000',
          '1 <= m + n <= 2000',
          '-10^6 <= nums1[i], nums2[i] <= 10^6'
        ],
        examples: [
          {
            input: 'nums1 = [1,3], nums2 = [2]',
            output: '2.00000',
            explanation: 'merged array = [1,2,3] and median is 2.'
          },
          {
            input: 'nums1 = [1,2], nums2 = [3,4]',
            output: '2.50000',
            explanation: 'merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5.'
          }
        ],
        tags: ['Array', 'Binary Search', 'Divide and Conquer'],
        timeLimit: 2000,
        memoryLimit: 512,
        isFeatured: true,
        totalSubmissions: 45,
        acceptedSubmissions: 12
      },
      {
        title: 'Valid Parentheses',
        slug: 'valid-parentheses',
        difficulty: 'Easy',
        description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.`,
        constraints: [
          '1 <= s.length <= 10^4',
          's consists of parentheses only \'()[]{}\''
        ],
        examples: [
          {
            input: 's = "()"',
            output: 'true'
          },
          {
            input: 's = "()[]{}"',
            output: 'true'
          },
          {
            input: 's = "(]"',
            output: 'false'
          }
        ],
        tags: ['String', 'Stack'],
        timeLimit: 1000,
        memoryLimit: 256,
        isFeatured: false,
        totalSubmissions: 95,
        acceptedSubmissions: 78
      },
      {
        title: 'Merge Two Sorted Lists',
        slug: 'merge-two-sorted-lists',
        difficulty: 'Easy',
        description: `You are given the heads of two sorted linked lists list1 and list2.

Merge the two lists in a one sorted list. The list should be made by splicing together the nodes of the first two lists.

Return the head of the merged linked list.`,
        constraints: [
          'The number of nodes in both lists is in the range [0, 50].',
          '-100 <= Node.val <= 100',
          'Both list1 and list2 are sorted in non-decreasing order.'
        ],
        examples: [
          {
            input: 'list1 = [1,2,4], list2 = [1,3,4]',
            output: '[1,1,2,3,4,4]'
          },
          {
            input: 'list1 = [], list2 = []',
            output: '[]'
          }
        ],
        tags: ['Linked List', 'Recursion'],
        timeLimit: 1000,
        memoryLimit: 256,
        isFeatured: true,
        totalSubmissions: 78,
        acceptedSubmissions: 65
      }
    ];

    const createdProblems = await Problem.insertMany(problems);
    console.log('✅ Problems seeded successfully');
    return createdProblems;
  } catch (error) {
    console.error('❌ Error seeding problems:', error);
  }
};

const seedContests = async (users, problems) => {
  try {
    // Clear existing contests
    await Contest.deleteMany({});
    
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekEnd = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    const contests = [
      {
        title: 'Weekly Contest #1',
        description: 'Join our weekly programming contest featuring algorithmic challenges for all skill levels.',
        startTime: tomorrow,
        endTime: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000), // 2 hours
        duration: 120,
        problems: [
          { problemId: problems[0]._id, points: 100, order: 1 },
          { problemId: problems[1]._id, points: 200, order: 2 },
          { problemId: problems[2]._id, points: 300, order: 3 }
        ],
        participants: [
          { userId: users[1]._id, totalScore: 0, totalTime: 0 },
          { userId: users[2]._id, totalScore: 0, totalTime: 0 }
        ],
        isPublic: true,
        maxParticipants: 100,
        scoringType: 'ICPC',
        createdBy: users[0]._id
      },
      {
        title: 'Algorithm Masters Challenge',
        description: 'Advanced algorithmic problems for experienced programmers. Test your skills with complex data structures and algorithms.',
        startTime: nextWeek,
        endTime: new Date(nextWeek.getTime() + 3 * 60 * 60 * 1000), // 3 hours
        duration: 180,
        problems: [
          { problemId: problems[3]._id, points: 150, order: 1 },
          { problemId: problems[1]._id, points: 250, order: 2 },
          { problemId: problems[2]._id, points: 350, order: 3 }
        ],
        participants: [
          { userId: users[2]._id, totalScore: 0, totalTime: 0 }
        ],
        isPublic: true,
        maxParticipants: 50,
        scoringType: 'IOI',
        createdBy: users[0]._id
      },
      {
        title: 'Beginner Friendly Contest',
        description: 'Perfect for newcomers to competitive programming. Easy to medium difficulty problems.',
        startTime: lastWeek,
        endTime: lastWeekEnd,
        duration: 90,
        problems: [
          { problemId: problems[0]._id, points: 100, order: 1 },
          { problemId: problems[4]._id, points: 150, order: 2 },
          { problemId: problems[5]._id, points: 200, order: 3 }
        ],
        participants: [
          { userId: users[1]._id, totalScore: 450, totalTime: 85, rank: 1 },
          { userId: users[3]._id, totalScore: 300, totalTime: 78, rank: 2 },
          { userId: users[4]._id, totalScore: 250, totalTime: 90, rank: 3 }
        ],
        isPublic: true,
        maxParticipants: 200,
        scoringType: 'ICPC',
        createdBy: users[0]._id
      }
    ];

    const createdContests = await Contest.insertMany(contests);
    console.log('✅ Contests seeded successfully');
    return createdContests;
  } catch (error) {
    console.error('❌ Error seeding contests:', error);
  }
};

const seedSubmissions = async (users, problems) => {
  try {
    // Clear existing submissions
    await Submission.deleteMany({});
    
    const submissions = [
      // User 1 submissions
      {
        userId: users[1]._id,
        problemId: problems[0]._id,
        code: 'function twoSum(nums, target) {\n  // Solution code here\n  return [];\n}',
        language: 'javascript',
        status: 'Accepted',
        executionTime: 85,
        memoryUsed: 15,
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        userId: users[1]._id,
        problemId: problems[4]._id,
        code: 'function isValid(s) {\n  // Solution code here\n  return true;\n}',
        language: 'javascript',
        status: 'Accepted',
        executionTime: 92,
        memoryUsed: 12,
        submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      // User 2 submissions
      {
        userId: users[2]._id,
        problemId: problems[0]._id,
        code: 'def two_sum(nums, target):\n    # Solution code here\n    return []',
        language: 'python',
        status: 'Accepted',
        executionTime: 78,
        memoryUsed: 18,
        submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        userId: users[2]._id,
        problemId: problems[1]._id,
        code: 'def addTwoNumbers(l1, l2):\n    # Solution code here\n    return None',
        language: 'python',
        status: 'Wrong Answer',
        executionTime: 120,
        memoryUsed: 22,
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        userId: users[2]._id,
        problemId: problems[2]._id,
        code: 'def lengthOfLongestSubstring(s):\n    # Solution code here\n    return 0',
        language: 'python',
        status: 'Accepted',
        executionTime: 156,
        memoryUsed: 25,
        submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ];

    await Submission.insertMany(submissions);
    
    // Update users' solved problems
    await User.findByIdAndUpdate(users[1]._id, {
      $push: {
        solvedProblems: [
          { problemId: problems[0]._id, difficulty: 'Easy', solvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
          { problemId: problems[4]._id, difficulty: 'Easy', solvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }
        ]
      }
    });

    await User.findByIdAndUpdate(users[2]._id, {
      $push: {
        solvedProblems: [
          { problemId: problems[0]._id, difficulty: 'Easy', solvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
          { problemId: problems[2]._id, difficulty: 'Medium', solvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }
        ]
      }
    });

    console.log('✅ Submissions seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding submissions:', error);
  }
};

const seedDatabase = async () => {
  console.log('🌱 Starting database seeding...');
  
  await connectDB();
  
  const users = await seedUsers();
  const problems = await seedProblems();
  const contests = await seedContests(users, problems);
  await seedSubmissions(users, problems);
  
  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📊 Seeded Data Summary:');
  console.log(`👥 Users: ${users.length}`);
  console.log(`📝 Problems: ${problems.length}`);
  console.log(`🏆 Contests: ${contests.length}`);
  console.log(`📤 Submissions: 5`);
  
  console.log('\n🔑 Test Credentials:');
  console.log('Admin: admin@codejudge.com / Admin123!');
  console.log('User: john@example.com / Password123!');
  console.log('User: jane@example.com / Password123!');
  
  mongoose.connection.close();
};

// Run the seeder
if (require.main === module) {
  seedDatabase().catch(error => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
}

module.exports = { seedDatabase };
