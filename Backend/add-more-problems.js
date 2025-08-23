/**
 * ADD MORE DIVERSE PROBLEMS
 * 
 * This script adds Medium and Hard problems plus more Easy problems
 * to create a comprehensive problem set
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('./config/db');

// Import models
const User = require('./models/User');
const Problem = require('./models/Problem');
const TestCase = require('./models/TestCase');

async function addMoreProblems() {
  console.log('🚀 ADDING MORE DIVERSE PROBLEMS');
  console.log('================================');

  try {
    await connectDB();
    console.log('✅ Database connected\n');

    // Get admin user for problem creation
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      throw new Error('Admin user not found. Please run database reset first.');
    }

    // Get current counts
    const initialCounts = {
      problems: await Problem.countDocuments(),
      testCases: await TestCase.countDocuments()
    };

    console.log(`📊 Current State: ${initialCounts.problems} problems, ${initialCounts.testCases} test cases\n`);

    // Add Medium Problems
    await addMediumProblems(adminUser._id);
    
    // Add Hard Problems  
    await addHardProblems(adminUser._id);
    
    // Add More Easy Problems
    await addMoreEasyProblems(adminUser._id);

    // Final summary
    await generateFinalSummary(initialCounts);

  } catch (error) {
    console.error('💥 Failed to add problems:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n📡 Database disconnected');
    }
  }
}

async function addMediumProblems(adminId) {
  console.log('🟡 ADDING MEDIUM PROBLEMS');
  console.log('==========================');

  const mediumProblems = [
    {
      title: "3Sum",
      difficulty: "Medium",
      description: "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.\n\nNotice that the solution set must not contain duplicate triplets.",
      constraints: [
        "3 <= nums.length <= 3000",
        "-10^5 <= nums[i] <= 10^5"
      ],
      examples: [
        {
          input: "nums = [-1,0,1,2,-1,-4]",
          output: "[[-1,-1,2],[-1,0,1]]",
          explanation: "The distinct triplets are [-1,0,1] and [-1,-1,2]."
        }
      ],
      tags: ["Array", "Two Pointers", "Sorting"],
      timeLimit: 2000,
      memoryLimit: 256,
      testCases: [
        { input: "6\n-1 0 1 2 -1 -4", expectedOutput: "[[-1, -1, 2], [-1, 0, 1]]", isPublic: true, description: "Basic example", points: 0 },
        { input: "3\n0 1 1", expectedOutput: "[]", isPublic: true, description: "No solution", points: 0 },
        { input: "3\n0 0 0", expectedOutput: "[[0, 0, 0]]", isPublic: false, description: "All zeros", points: 20 },
        { input: "4\n-2 0 1 1", expectedOutput: "[]", isPublic: false, description: "No valid triplet", points: 15 },
        { input: "5\n-1 0 1 2 -1", expectedOutput: "[[-1, 0, 1]]", isPublic: false, description: "Single solution", points: 25 }
      ]
    },
    {
      title: "Group Anagrams",
      difficulty: "Medium",
      description: "Given an array of strings strs, group the anagrams together. You can return the answer in any order.\n\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.",
      constraints: [
        "1 <= strs.length <= 10^4",
        "0 <= strs[i].length <= 100",
        "strs[i] consists of lowercase English letters only."
      ],
      examples: [
        {
          input: 'strs = ["eat","tea","tan","ate","nat","bat"]',
          output: '[["bat"],["nat","tan"],["ate","eat","tea"]]',
          explanation: "The anagrams are grouped together."
        }
      ],
      tags: ["Array", "Hash Table", "String", "Sorting"],
      timeLimit: 1500,
      memoryLimit: 256,
      testCases: [
        { input: "6\neat\ntea\ntan\nate\nnat\nbat", expectedOutput: '[["bat"], ["nat", "tan"], ["ate", "eat", "tea"]]', isPublic: true, description: "Basic grouping", points: 0 },
        { input: "1\na", expectedOutput: '[["a"]]', isPublic: true, description: "Single string", points: 0 },
        { input: "2\nab\nba", expectedOutput: '[["ab", "ba"]]', isPublic: false, description: "Two anagrams", points: 20 },
        { input: "3\nabc\nbca\nxyz", expectedOutput: '[["abc", "bca"], ["xyz"]]', isPublic: false, description: "Mixed groups", points: 25 }
      ]
    },
    {
      title: "Longest Palindromic Substring",
      difficulty: "Medium",
      description: "Given a string s, return the longest palindromic substring in s.",
      constraints: [
        "1 <= s.length <= 1000",
        "s consist of only digits and English letters."
      ],
      examples: [
        {
          input: 's = "babad"',
          output: '"bab"',
          explanation: '"aba" is also a valid answer.'
        },
        {
          input: 's = "cbbd"',
          output: '"bb"',
          explanation: "The longest palindromic substring is bb."
        }
      ],
      tags: ["String", "Dynamic Programming"],
      timeLimit: 1500,
      memoryLimit: 256,
      testCases: [
        { input: "babad", expectedOutput: "bab", isPublic: true, description: "Odd length palindrome", points: 0 },
        { input: "cbbd", expectedOutput: "bb", isPublic: true, description: "Even length palindrome", points: 0 },
        { input: "a", expectedOutput: "a", isPublic: false, description: "Single character", points: 15 },
        { input: "ac", expectedOutput: "a", isPublic: false, description: "No palindrome > 1", points: 20 },
        { input: "racecar", expectedOutput: "racecar", isPublic: false, description: "Entire string is palindrome", points: 25 }
      ]
    }
  ];

  await createProblemsFromData(mediumProblems, adminId);
}

async function addHardProblems(adminId) {
  console.log('\n🔴 ADDING HARD PROBLEMS');
  console.log('========================');

  const hardProblems = [
    {
      title: "Merge k Sorted Lists",
      difficulty: "Hard",
      description: "You are given an array of k linked-lists lists, each linked-list is sorted in ascending order.\n\nMerge all the linked-lists into one sorted linked-list and return it.",
      constraints: [
        "k == lists.length",
        "0 <= k <= 10^4",
        "0 <= lists[i].length <= 500",
        "-10^4 <= lists[i][j] <= 10^4",
        "lists[i] is sorted in ascending order.",
        "The sum of lists[i].length will not exceed 10^4."
      ],
      examples: [
        {
          input: "lists = [[1,4,5],[1,3,4],[2,6]]",
          output: "[1,1,2,3,4,4,5,6]",
          explanation: "The linked-lists are merged into one sorted list."
        }
      ],
      tags: ["Linked List", "Divide and Conquer", "Heap", "Merge Sort"],
      timeLimit: 2000,
      memoryLimit: 256,
      testCases: [
        { input: "3\n3\n1 4 5\n3\n1 3 4\n2\n2 6", expectedOutput: "1 1 2 3 4 4 5 6", isPublic: true, description: "Basic merge", points: 0 },
        { input: "0", expectedOutput: "NULL", isPublic: true, description: "Empty input", points: 0 },
        { input: "1\n0", expectedOutput: "NULL", isPublic: false, description: "Single empty list", points: 20 },
        { input: "2\n1\n1\n1\n2", expectedOutput: "1 2", isPublic: false, description: "Two single elements", points: 25 },
        { input: "1\n3\n1 2 3", expectedOutput: "1 2 3", isPublic: false, description: "Single non-empty list", points: 30 }
      ]
    },
    {
      title: "Trapping Rain Water",
      difficulty: "Hard",
      description: "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
      constraints: [
        "n == height.length",
        "1 <= n <= 2 * 10^4",
        "0 <= height[i] <= 3 * 10^4"
      ],
      examples: [
        {
          input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]",
          output: "6",
          explanation: "The elevation map is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water are being trapped."
        }
      ],
      tags: ["Array", "Two Pointers", "Dynamic Programming", "Stack", "Monotonic Stack"],
      timeLimit: 1500,
      memoryLimit: 256,
      testCases: [
        { input: "12\n0 1 0 2 1 0 1 3 2 1 2 1", expectedOutput: "6", isPublic: true, description: "Complex elevation", points: 0 },
        { input: "3\n3 0 2", expectedOutput: "2", isPublic: true, description: "Simple case", points: 0 },
        { input: "1\n5", expectedOutput: "0", isPublic: false, description: "Single bar", points: 15 },
        { input: "2\n3 2", expectedOutput: "0", isPublic: false, description: "Decreasing heights", points: 20 },
        { input: "5\n2 0 2 0 2", expectedOutput: "4", isPublic: false, description: "Multiple valleys", points: 30 }
      ]
    },
    {
      title: "Wildcard Matching",
      difficulty: "Hard",
      description: "Given an input string (s) and a pattern (p), implement wildcard pattern matching with support for '?' and '*' where:\n\n'?' Matches any single character.\n'*' Matches any sequence of characters (including the empty sequence).\n\nThe matching should cover the entire input string (not partial).",
      constraints: [
        "0 <= s.length, p.length <= 2000",
        "s contains only lowercase English letters.",
        "p contains only lowercase English letters, '?' or '*'."
      ],
      examples: [
        {
          input: 's = "aa", p = "a"',
          output: "false",
          explanation: '"a" does not match the entire string "aa".'
        },
        {
          input: 's = "aa", p = "*"',
          output: "true",
          explanation: '"*" matches any sequence.'
        }
      ],
      tags: ["String", "Dynamic Programming", "Greedy", "Recursion"],
      timeLimit: 2000,
      memoryLimit: 256,
      testCases: [
        { input: "aa\na", expectedOutput: "false", isPublic: true, description: "Simple mismatch", points: 0 },
        { input: "aa\n*", expectedOutput: "true", isPublic: true, description: "Star matches all", points: 0 },
        { input: "cb\n?a", expectedOutput: "false", isPublic: false, description: "Question mark mismatch", points: 20 },
        { input: "adceb\n*a*b*", expectedOutput: "true", isPublic: false, description: "Multiple stars", points: 30 },
        { input: "acdcb\na*c?b", expectedOutput: "false", isPublic: false, description: "Mixed wildcards", points: 25 }
      ]
    }
  ];

  await createProblemsFromData(hardProblems, adminId);
}

async function addMoreEasyProblems(adminId) {
  console.log('\n🟢 ADDING MORE EASY PROBLEMS');
  console.log('=============================');

  const moreEasyProblems = [
    {
      title: "Remove Duplicates from Sorted Array",
      difficulty: "Easy",
      description: "Given an integer array nums sorted in non-decreasing order, remove the duplicates in-place such that each unique element appears only once. The relative order of the elements should be kept the same.\n\nReturn k after placing the final result in the first k slots of nums.",
      constraints: [
        "1 <= nums.length <= 3 * 10^4",
        "-100 <= nums[i] <= 100",
        "nums is sorted in non-decreasing order."
      ],
      examples: [
        {
          input: "nums = [1,1,2]",
          output: "2",
          explanation: "Your function should return k = 2, with the first two elements of nums being 1 and 2 respectively."
        }
      ],
      tags: ["Array", "Two Pointers"],
      timeLimit: 1000,
      memoryLimit: 256,
      testCases: [
        { input: "3\n1 1 2", expectedOutput: "2", isPublic: true, description: "Basic case", points: 0 },
        { input: "10\n0 0 1 1 1 2 2 3 3 4", expectedOutput: "5", isPublic: true, description: "Multiple duplicates", points: 0 },
        { input: "1\n1", expectedOutput: "1", isPublic: false, description: "Single element", points: 15 },
        { input: "2\n1 2", expectedOutput: "2", isPublic: false, description: "No duplicates", points: 20 }
      ]
    },
    {
      title: "Implement strStr()",
      difficulty: "Easy",
      description: "Return the index of the first occurrence of needle in haystack, or -1 if needle is not part of haystack.",
      constraints: [
        "1 <= haystack.length, needle.length <= 10^4",
        "haystack and needle consist of only lowercase English characters."
      ],
      examples: [
        {
          input: 'haystack = "hello", needle = "ll"',
          output: "2",
          explanation: "The first occurrence of ll in hello is at index 2."
        }
      ],
      tags: ["Two Pointers", "String", "String Matching"],
      timeLimit: 1000,
      memoryLimit: 256,
      testCases: [
        { input: "hello\nll", expectedOutput: "2", isPublic: true, description: "Found in middle", points: 0 },
        { input: "aaaaa\nbba", expectedOutput: "-1", isPublic: true, description: "Not found", points: 0 },
        { input: "a\na", expectedOutput: "0", isPublic: false, description: "Single character match", points: 15 },
        { input: "abc\nabc", expectedOutput: "0", isPublic: false, description: "Exact match", points: 20 }
      ]
    }
  ];

  await createProblemsFromData(moreEasyProblems, adminId);
}

async function createProblemsFromData(problemsData, adminId) {
  let problemCount = 0;
  let testCaseCount = 0;

  for (const problemData of problemsData) {
    try {
      console.log(`\n📝 Creating: ${problemData.title}`);

      // Check if problem already exists
      const existing = await Problem.findOne({ title: problemData.title });
      if (existing) {
        console.log(`   ⚠️ Problem "${problemData.title}" already exists, skipping`);
        continue;
      }

      // Create problem
      const problem = new Problem({
        title: problemData.title,
        slug: createSlug(problemData.title),
        difficulty: problemData.difficulty,
        description: problemData.description,
        constraints: problemData.constraints,
        examples: problemData.examples,
        tags: problemData.tags,
        timeLimit: problemData.timeLimit,
        memoryLimit: problemData.memoryLimit,
        totalSubmissions: Math.floor(Math.random() * 300) + 50,
        acceptedSubmissions: Math.floor(Math.random() * 150) + 20,
        isActive: true,
        isFeatured: Math.random() > 0.6,
        createdBy: adminId
      });

      const savedProblem = await problem.save();
      problemCount++;

      // Create test cases
      const testCaseIds = [];
      for (const testCaseData of problemData.testCases) {
        const testCase = new TestCase({
          problemId: savedProblem._id,
          input: testCaseData.input,
          expectedOutput: testCaseData.expectedOutput,
          isPublic: testCaseData.isPublic,
          description: testCaseData.description,
          points: testCaseData.points || (testCaseData.isPublic ? 0 : Math.floor(Math.random() * 20) + 10),
          timeLimit: problemData.timeLimit,
          memoryLimit: problemData.memoryLimit
        });

        const savedTestCase = await testCase.save();
        testCaseIds.push(savedTestCase._id);
        testCaseCount++;
      }

      // Update problem with test case references
      savedProblem.testCases = testCaseIds;
      await savedProblem.save();

      const publicCount = problemData.testCases.filter(tc => tc.isPublic).length;
      const hiddenCount = problemData.testCases.length - publicCount;
      console.log(`   ✅ Created ${testCaseIds.length} test cases (${publicCount} public, ${hiddenCount} hidden)`);

    } catch (error) {
      console.log(`   ❌ Failed to create "${problemData.title}": ${error.message}`);
    }
  }

  console.log(`\n📊 Added: ${problemCount} problems, ${testCaseCount} test cases`);
}

function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
}

async function generateFinalSummary(initialCounts) {
  console.log('\n📊 FINAL EXPANSION SUMMARY');
  console.log('===========================');

  const finalCounts = {
    problems: await Problem.countDocuments(),
    testCases: await TestCase.countDocuments()
  };

  const addedProblems = finalCounts.problems - initialCounts.problems;
  const addedTestCases = finalCounts.testCases - initialCounts.testCases;

  // Problems by difficulty
  const easyProblems = await Problem.countDocuments({ difficulty: 'Easy' });
  const mediumProblems = await Problem.countDocuments({ difficulty: 'Medium' });
  const hardProblems = await Problem.countDocuments({ difficulty: 'Hard' });

  // Security distribution
  const publicTestCases = await TestCase.countDocuments({ isPublic: true });
  const hiddenTestCases = await TestCase.countDocuments({ isPublic: false });
  const hiddenPercentage = ((hiddenTestCases / finalCounts.testCases) * 100).toFixed(1);

  console.log(`📈 Database Growth:`);
  console.log(`   Problems: ${initialCounts.problems} → ${finalCounts.problems} (+${addedProblems})`);
  console.log(`   Test Cases: ${initialCounts.testCases} → ${finalCounts.testCases} (+${addedTestCases})`);

  console.log(`\n📚 Problems by Difficulty:`);
  console.log(`   🟢 Easy: ${easyProblems} problems`);
  console.log(`   🟡 Medium: ${mediumProblems} problems`);
  console.log(`   🔴 Hard: ${hardProblems} problems`);

  console.log(`\n🔒 Security Distribution:`);
  console.log(`   Public Test Cases: ${publicTestCases}`);
  console.log(`   Hidden Test Cases: ${hiddenTestCases} (${hiddenPercentage}%)`);

  const securityStatus = parseFloat(hiddenPercentage) >= 50 ? 'EXCELLENT' : 
                        parseFloat(hiddenPercentage) >= 30 ? 'GOOD' : 'NEEDS IMPROVEMENT';
  console.log(`   Security Status: ${securityStatus}`);

  console.log(`\n🎉 DATABASE EXPANSION COMPLETE!`);
  console.log(`   ✅ Added ${addedProblems} new problems`);
  console.log(`   ✅ Added ${addedTestCases} new test cases`);
  console.log(`   ✅ Comprehensive difficulty coverage`);
  console.log(`   ✅ Excellent problem diversity`);
  console.log(`   ✅ Ready for competitive programming!`);
}

// Run if executed directly
if (require.main === module) {
  addMoreProblems().catch(console.error);
}

module.exports = { addMoreProblems };
