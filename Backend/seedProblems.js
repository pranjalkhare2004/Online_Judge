/**
 * PROBLEM SEEDING SCRIPT
 * 
 * DESCRIPTION:
 * This script seeds the database with 20 comprehensive coding problems across different
 * difficulty levels and categories. Each problem includes detailed descriptions, examples,
 * constraints, and test cases for a complete Online Judge experience.
 * 
 * USAGE:
 * node seedProblems.js
 * 
 * FEATURES:
 * - 20 diverse coding problems (Easy: 8, Medium: 8, Hard: 4)
 * - Comprehensive test cases (public examples + private test cases)
 * - Multiple categories: Array, String, Dynamic Programming, Tree, Graph, etc.
 * - Realistic constraints and time/memory limits
 * - Professional problem statements with examples
 */

const mongoose = require('mongoose');
const Problem = require('./models/Problem');
const TestCase = require('./models/TestCase');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/online-judge');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Sample problems data
const problemsData = [
  // EASY PROBLEMS (8)
  {
    title: "Two Sum",
    difficulty: "Easy",
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    constraints: [
      "2 ≤ nums.length ≤ 10^4",
      "-10^9 ≤ nums[i] ≤ 10^9",
      "-10^9 ≤ target ≤ 10^9",
      "Only one valid answer exists."
    ],
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]",
        explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]."
      }
    ],
    tags: ["Array", "Hash Table"],
    timeLimit: 1000,
    memoryLimit: 256,
    testCases: [
      { input: "4\n2 7 11 15\n9", expectedOutput: "0 1", isPublic: true, description: "Basic example" },
      { input: "3\n3 2 4\n6", expectedOutput: "1 2", isPublic: true, description: "Second example" },
      { input: "2\n3 3\n6", expectedOutput: "0 1", isPublic: false, description: "Same numbers" },
      { input: "5\n-1 -2 -3 -4 -5\n-8", expectedOutput: "2 4", isPublic: false, description: "Negative numbers" }
    ]
  },
  
  {
    title: "Valid Parentheses",
    difficulty: "Easy",
    description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    constraints: [
      "1 ≤ s.length ≤ 10^4",
      "s consists of parentheses only '()[]{}'."
    ],
    examples: [
      {
        input: "s = \"()\"",
        output: "true",
        explanation: "The string contains valid parentheses."
      },
      {
        input: "s = \"()[]{}\"",
        output: "true",
        explanation: "All brackets are properly matched."
      },
      {
        input: "s = \"(]\"",
        output: "false",
        explanation: "Brackets are not properly matched."
      }
    ],
    tags: ["String", "Stack"],
    timeLimit: 1000,
    memoryLimit: 256,
    testCases: [
      { input: "()", expectedOutput: "true", isPublic: true, description: "Simple parentheses" },
      { input: "()[]{}", expectedOutput: "true", isPublic: true, description: "All types" },
      { input: "(]", expectedOutput: "false", isPublic: true, description: "Mismatched" },
      { input: "([)]", expectedOutput: "false", isPublic: false, description: "Wrong order" },
      { input: "{[]}", expectedOutput: "true", isPublic: false, description: "Nested brackets" }
    ]
  },

  {
    title: "Maximum Depth of Binary Tree",
    difficulty: "Easy",
    description: `Given the root of a binary tree, return its maximum depth.

A binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.`,
    constraints: [
      "The number of nodes in the tree is in the range [0, 10^4].",
      "-100 ≤ Node.val ≤ 100"
    ],
    examples: [
      {
        input: "root = [3,9,20,null,null,15,7]",
        output: "3",
        explanation: "The maximum depth is 3."
      },
      {
        input: "root = [1,null,2]",
        output: "2",
        explanation: "The maximum depth is 2."
      }
    ],
    tags: ["Tree", "Depth-First Search", "Binary Tree"],
    timeLimit: 1000,
    memoryLimit: 256,
    testCases: [
      { input: "3 9 20 # # 15 7", expectedOutput: "3", isPublic: true, description: "Balanced tree" },
      { input: "1 # 2", expectedOutput: "2", isPublic: true, description: "Right skewed" },
      { input: "#", expectedOutput: "0", isPublic: false, description: "Empty tree" },
      { input: "1", expectedOutput: "1", isPublic: false, description: "Single node" }
    ]
  },

  {
    title: "Palindrome Number",
    difficulty: "Easy",
    description: `Given an integer x, return true if x is a palindrome, and false otherwise.

Follow up: Could you solve it without converting the integer to a string?`,
    constraints: [
      "-2^31 ≤ x ≤ 2^31 - 1"
    ],
    examples: [
      {
        input: "x = 121",
        output: "true",
        explanation: "121 reads as 121 from left to right and from right to left."
      },
      {
        input: "x = -121",
        output: "false",
        explanation: "From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome."
      }
    ],
    tags: ["Math"],
    timeLimit: 1000,
    memoryLimit: 256,
    testCases: [
      { input: "121", expectedOutput: "true", isPublic: true, description: "Positive palindrome" },
      { input: "-121", expectedOutput: "false", isPublic: true, description: "Negative number" },
      { input: "10", expectedOutput: "false", isPublic: false, description: "Not palindrome" },
      { input: "0", expectedOutput: "true", isPublic: false, description: "Single digit" }
    ]
  },

  {
    title: "Remove Duplicates from Sorted Array",
    difficulty: "Easy",
    description: `Given an integer array nums sorted in non-decreasing order, remove the duplicates in-place such that each unique element appears only once. The relative order of the elements should be kept the same.

Return k after placing the final result in the first k slots of nums.`,
    constraints: [
      "1 ≤ nums.length ≤ 3 * 10^4",
      "-100 ≤ nums[i] ≤ 100",
      "nums is sorted in non-decreasing order."
    ],
    examples: [
      {
        input: "nums = [1,1,2]",
        output: "2, nums = [1,2,_]",
        explanation: "Your function should return k = 2, with the first two elements of nums being 1 and 2 respectively."
      }
    ],
    tags: ["Array", "Two Pointers"],
    timeLimit: 1000,
    memoryLimit: 256,
    testCases: [
      { input: "3\n1 1 2", expectedOutput: "2", isPublic: true, description: "Basic example" },
      { input: "10\n0 0 1 1 1 2 2 3 3 4", expectedOutput: "5", isPublic: false, description: "Multiple duplicates" },
      { input: "1\n1", expectedOutput: "1", isPublic: false, description: "Single element" }
    ]
  },

  {
    title: "Climbing Stairs",
    difficulty: "Easy",
    description: `You are climbing a staircase. It takes n steps to reach the top.

Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?`,
    constraints: [
      "1 ≤ n ≤ 45"
    ],
    examples: [
      {
        input: "n = 2",
        output: "2",
        explanation: "There are two ways to climb to the top: 1. 1 step + 1 step, 2. 2 steps"
      },
      {
        input: "n = 3",
        output: "3",
        explanation: "There are three ways to climb to the top: 1. 1 step + 1 step + 1 step, 2. 1 step + 2 steps, 3. 2 steps + 1 step"
      }
    ],
    tags: ["Math", "Dynamic Programming", "Memoization"],
    timeLimit: 1000,
    memoryLimit: 256,
    testCases: [
      { input: "2", expectedOutput: "2", isPublic: true, description: "Two steps" },
      { input: "3", expectedOutput: "3", isPublic: true, description: "Three steps" },
      { input: "1", expectedOutput: "1", isPublic: false, description: "One step" },
      { input: "10", expectedOutput: "89", isPublic: false, description: "Larger number" }
    ]
  },

  {
    title: "Merge Two Sorted Lists",
    difficulty: "Easy",
    description: `You are given the heads of two sorted linked lists list1 and list2.

Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.

Return the head of the merged linked list.`,
    constraints: [
      "The number of nodes in both lists is in the range [0, 50].",
      "-100 ≤ Node.val ≤ 100",
      "Both list1 and list2 are sorted in non-decreasing order."
    ],
    examples: [
      {
        input: "list1 = [1,2,4], list2 = [1,3,4]",
        output: "[1,1,2,3,4,4]",
        explanation: "Merge the two sorted lists."
      }
    ],
    tags: ["Linked List", "Recursion"],
    timeLimit: 1000,
    memoryLimit: 256,
    testCases: [
      { input: "3\n1 2 4\n3\n1 3 4", expectedOutput: "1 1 2 3 4 4", isPublic: true, description: "Basic merge" },
      { input: "0\n\n1\n0", expectedOutput: "0", isPublic: false, description: "One empty list" },
      { input: "0\n\n0\n", expectedOutput: "NULL", isPublic: false, description: "Both empty" }
    ]
  },

  {
    title: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    description: `You are given an array prices where prices[i] is the price of a given stock on the ith day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.`,
    constraints: [
      "1 ≤ prices.length ≤ 10^5",
      "0 ≤ prices[i] ≤ 10^4"
    ],
    examples: [
      {
        input: "prices = [7,1,5,3,6,4]",
        output: "5",
        explanation: "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5."
      }
    ],
    tags: ["Array", "Dynamic Programming"],
    timeLimit: 1000,
    memoryLimit: 256,
    testCases: [
      { input: "6\n7 1 5 3 6 4", expectedOutput: "5", isPublic: true, description: "Basic example" },
      { input: "5\n7 6 4 3 1", expectedOutput: "0", isPublic: false, description: "Decreasing prices" },
      { input: "2\n1 2", expectedOutput: "1", isPublic: false, description: "Simple profit" }
    ]
  },

  // MEDIUM PROBLEMS (8)
  {
    title: "Add Two Numbers",
    difficulty: "Medium",
    description: `You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.

You may assume the two numbers do not contain any leading zero, except the number 0 itself.`,
    constraints: [
      "The number of nodes in each linked list is in the range [1, 100].",
      "0 ≤ Node.val ≤ 9",
      "It is guaranteed that the list represents a number that does not have leading zeros."
    ],
    examples: [
      {
        input: "l1 = [2,4,3], l2 = [5,6,4]",
        output: "[7,0,8]",
        explanation: "342 + 465 = 807."
      }
    ],
    tags: ["Linked List", "Math", "Recursion"],
    timeLimit: 1000,
    memoryLimit: 256,
    testCases: [
      { input: "3\n2 4 3\n3\n5 6 4", expectedOutput: "7 0 8", isPublic: true, description: "Basic addition" },
      { input: "1\n0\n1\n0", expectedOutput: "0", isPublic: false, description: "Zero addition" },
      { input: "7\n9 9 9 9 9 9 9\n4\n9 9 9 9", expectedOutput: "8 9 9 9 0 0 0 1", isPublic: false, description: "Carry over" }
    ]
  },

  {
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    description: `Given a string s, find the length of the longest substring without repeating characters.`,
    constraints: [
      "0 ≤ s.length ≤ 5 * 10^4",
      "s consists of English letters, digits, symbols and spaces."
    ],
    examples: [
      {
        input: "s = \"abcabcbb\"",
        output: "3",
        explanation: "The answer is \"abc\", with the length of 3."
      },
      {
        input: "s = \"bbbbb\"",
        output: "1",
        explanation: "The answer is \"b\", with the length of 1."
      }
    ],
    tags: ["Hash Table", "String", "Sliding Window"],
    timeLimit: 1000,
    memoryLimit: 256,
    testCases: [
      { input: "abcabcbb", expectedOutput: "3", isPublic: true, description: "Mixed characters" },
      { input: "bbbbb", expectedOutput: "1", isPublic: true, description: "All same" },
      { input: "pwwkew", expectedOutput: "3", isPublic: false, description: "Complex pattern" },
      { input: "a", expectedOutput: "1", isPublic: false, description: "Single character" }
    ]
  },

  {
    title: "Container With Most Water",
    difficulty: "Medium",
    description: `You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]).

Find two lines that together with the x-axis form a container that contains the most water.

Return the maximum amount of water a container can store.`,
    constraints: [
      "n == height.length",
      "2 ≤ n ≤ 10^5",
      "0 ≤ height[i] ≤ 10^4"
    ],
    examples: [
      {
        input: "height = [1,8,6,2,5,4,8,3,7]",
        output: "49",
        explanation: "The vertical lines are represented by array [1,8,6,2,5,4,8,3,7]. The max area of water is 49."
      }
    ],
    tags: ["Array", "Two Pointers", "Greedy"],
    timeLimit: 1000,
    memoryLimit: 256,
    testCases: [
      { input: "9\n1 8 6 2 5 4 8 3 7", expectedOutput: "49", isPublic: true, description: "Basic example" },
      { input: "2\n1 1", expectedOutput: "1", isPublic: false, description: "Minimum case" },
      { input: "6\n1 2 4 3 2 1", expectedOutput: "6", isPublic: false, description: "Symmetric" }
    ]
  },

  {
    title: "3Sum",
    difficulty: "Medium",
    description: `Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.

Notice that the solution set must not contain duplicate triplets.`,
    constraints: [
      "3 ≤ nums.length ≤ 3000",
      "-10^5 ≤ nums[i] ≤ 10^5"
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
      { input: "6\n-1 0 1 2 -1 -4", expectedOutput: "[-1,-1,2],[-1,0,1]", isPublic: true, description: "Basic example" },
      { input: "3\n0 1 1", expectedOutput: "[]", isPublic: false, description: "No solution" },
      { input: "3\n0 0 0", expectedOutput: "[0,0,0]", isPublic: false, description: "All zeros" }
    ]
  },

  {
    title: "Group Anagrams",
    difficulty: "Medium",
    description: `Given an array of strings strs, group the anagrams together. You can return the answer in any order.

An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.`,
    constraints: [
      "1 ≤ strs.length ≤ 10^4",
      "0 ≤ strs[i].length ≤ 100",
      "strs[i] consists of lowercase English letters only."
    ],
    examples: [
      {
        input: "strs = [\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"]",
        output: "[[\"bat\"],[\"nat\",\"tan\"],[\"ate\",\"eat\",\"tea\"]]",
        explanation: "Group words that are anagrams of each other."
      }
    ],
    tags: ["Array", "Hash Table", "String", "Sorting"],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: "6\neat tea tan ate nat bat", expectedOutput: "[[bat],[nat,tan],[ate,eat,tea]]", isPublic: true, description: "Basic grouping" },
      { input: "1\na", expectedOutput: "[[a]]", isPublic: false, description: "Single character" },
      { input: "2\nab ba", expectedOutput: "[[ab,ba]]", isPublic: false, description: "Simple anagram" }
    ]
  },

  {
    title: "Longest Palindromic Substring",
    difficulty: "Medium",
    description: `Given a string s, return the longest palindromic substring in s.`,
    constraints: [
      "1 ≤ s.length ≤ 1000",
      "s consist of only digits and English letters."
    ],
    examples: [
      {
        input: "s = \"babad\"",
        output: "\"bab\"",
        explanation: "\"aba\" is also a valid answer."
      },
      {
        input: "s = \"cbbd\"",
        output: "\"bb\"",
        explanation: "The longest palindromic substring is \"bb\"."
      }
    ],
    tags: ["String", "Dynamic Programming"],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: "babad", expectedOutput: "bab", isPublic: true, description: "Odd length palindrome" },
      { input: "cbbd", expectedOutput: "bb", isPublic: true, description: "Even length palindrome" },
      { input: "a", expectedOutput: "a", isPublic: false, description: "Single character" },
      { input: "ac", expectedOutput: "a", isPublic: false, description: "No palindrome" }
    ]
  },

  {
    title: "Binary Tree Level Order Traversal",
    difficulty: "Medium",
    description: `Given the root of a binary tree, return the level order traversal of its nodes' values. (i.e., from left to right, level by level).`,
    constraints: [
      "The number of nodes in the tree is in the range [0, 2000].",
      "-1000 ≤ Node.val ≤ 1000"
    ],
    examples: [
      {
        input: "root = [3,9,20,null,null,15,7]",
        output: "[[3],[9,20],[15,7]]",
        explanation: "Level order traversal returns values level by level."
      }
    ],
    tags: ["Tree", "Breadth-First Search", "Binary Tree"],
    timeLimit: 1000,
    memoryLimit: 256,
    testCases: [
      { input: "3 9 20 # # 15 7", expectedOutput: "[[3],[9,20],[15,7]]", isPublic: true, description: "Basic tree" },
      { input: "1", expectedOutput: "[[1]]", isPublic: false, description: "Single node" },
      { input: "#", expectedOutput: "[]", isPublic: false, description: "Empty tree" }
    ]
  },

  {
    title: "Maximum Subarray",
    difficulty: "Medium",
    description: `Given an integer array nums, find the subarray with the largest sum, and return its sum.`,
    constraints: [
      "1 ≤ nums.length ≤ 10^5",
      "-10^4 ≤ nums[i] ≤ 10^4"
    ],
    examples: [
      {
        input: "nums = [-2,1,-3,4,-1,2,1,-5,4]",
        output: "6",
        explanation: "The subarray [4,-1,2,1] has the largest sum 6."
      }
    ],
    tags: ["Array", "Divide and Conquer", "Dynamic Programming"],
    timeLimit: 1000,
    memoryLimit: 256,
    testCases: [
      { input: "9\n-2 1 -3 4 -1 2 1 -5 4", expectedOutput: "6", isPublic: true, description: "Mixed positive/negative" },
      { input: "1\n1", expectedOutput: "1", isPublic: false, description: "Single positive" },
      { input: "5\n5 4 -1 7 8", expectedOutput: "23", isPublic: false, description: "Mostly positive" }
    ]
  },

  // HARD PROBLEMS (4)
  {
    title: "Median of Two Sorted Arrays",
    difficulty: "Hard",
    description: `Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.

The overall run time complexity should be O(log (m+n)).`,
    constraints: [
      "nums1.length == m",
      "nums2.length == n",
      "0 ≤ m ≤ 1000",
      "0 ≤ n ≤ 1000",
      "1 ≤ m + n ≤ 2000",
      "-10^6 ≤ nums1[i], nums2[i] ≤ 10^6"
    ],
    examples: [
      {
        input: "nums1 = [1,3], nums2 = [2]",
        output: "2.00000",
        explanation: "merged array = [1,2,3] and median is 2."
      }
    ],
    tags: ["Array", "Binary Search", "Divide and Conquer"],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: "2\n1 3\n1\n2", expectedOutput: "2.00000", isPublic: true, description: "Odd total length" },
      { input: "2\n1 2\n2\n3 4", expectedOutput: "2.50000", isPublic: false, description: "Even total length" },
      { input: "0\n\n1\n1", expectedOutput: "1.00000", isPublic: false, description: "One empty array" }
    ]
  },

  {
    title: "Merge k Sorted Lists",
    difficulty: "Hard",
    description: `You are given an array of k linked-lists lists, each linked-list is sorted in ascending order.

Merge all the linked-lists into one sorted linked-list and return it.`,
    constraints: [
      "k == lists.length",
      "0 ≤ k ≤ 10^4",
      "0 ≤ lists[i].length ≤ 500",
      "-10^4 ≤ lists[i][j] ≤ 10^4",
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
    tags: ["Linked List", "Divide and Conquer", "Heap (Priority Queue)", "Merge Sort"],
    timeLimit: 3000,
    memoryLimit: 512,
    testCases: [
      { input: "3\n3\n1 4 5\n3\n1 3 4\n2\n2 6", expectedOutput: "1 1 2 3 4 4 5 6", isPublic: true, description: "Three lists" },
      { input: "0", expectedOutput: "NULL", isPublic: false, description: "Empty input" },
      { input: "1\n0", expectedOutput: "NULL", isPublic: false, description: "One empty list" }
    ]
  },

  {
    title: "Trapping Rain Water",
    difficulty: "Hard",
    description: `Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.`,
    constraints: [
      "n == height.length",
      "1 ≤ n ≤ 2 * 10^4",
      "0 ≤ height[i] ≤ 3 * 10^4"
    ],
    examples: [
      {
        input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]",
        output: "6",
        explanation: "The elevation map can trap 6 units of rain water."
      }
    ],
    tags: ["Array", "Two Pointers", "Dynamic Programming", "Stack", "Monotonic Stack"],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: "12\n0 1 0 2 1 0 1 3 2 1 2 1", expectedOutput: "6", isPublic: true, description: "Complex elevation" },
      { input: "3\n3 0 2", expectedOutput: "0", isPublic: false, description: "Simple case" },
      { input: "4\n4 2 0 3", expectedOutput: "5", isPublic: false, description: "Water trapped" }
    ]
  },

  {
    title: "Regular Expression Matching",
    difficulty: "Hard",
    description: `Given an input string s and a pattern p, implement regular expression matching with support for '.' and '*' where:

- '.' Matches any single character.
- '*' Matches zero or more of the preceding element.

The matching should cover the entire input string (not partial).`,
    constraints: [
      "1 ≤ s.length ≤ 20",
      "1 ≤ p.length ≤ 20",
      "s contains only lowercase English letters.",
      "p contains only lowercase English letters, '.', and '*'.",
      "It is guaranteed for each appearance of the character '*', there will be a previous valid character to match."
    ],
    examples: [
      {
        input: "s = \"aa\", p = \"a\"",
        output: "false",
        explanation: "\"a\" does not match the entire string \"aa\"."
      },
      {
        input: "s = \"aa\", p = \"a*\"",
        output: "true",
        explanation: "\"a*\" means zero or more 'a's."
      }
    ],
    tags: ["String", "Dynamic Programming", "Recursion"],
    timeLimit: 2000,
    memoryLimit: 256,
    testCases: [
      { input: "aa\na", expectedOutput: "false", isPublic: true, description: "No match" },
      { input: "aa\na*", expectedOutput: "true", isPublic: true, description: "Star matching" },
      { input: "ab\n.*", expectedOutput: "true", isPublic: false, description: "Dot star" },
      { input: "aab\nc*a*b", expectedOutput: "true", isPublic: false, description: "Complex pattern" }
    ]
  }
];

// Helper function to create a slug from title
function createSlug(title) {
  return title.toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Seed problems and test cases
async function seedProblems() {
  try {
    // Find or create admin user
    let adminUser = await User.findOne({ Email: 'admin@onlinejudge.com' });
    if (!adminUser) {
      console.log('Creating admin user...');
      adminUser = new User({
        FullName: 'Administrator',
        Email: 'admin@onlinejudge.com',
        Password: 'adminpassword123', // Will be hashed by pre-save middleware
        DOB: new Date('1990-01-01'),
        role: 'admin',
        isActive: true
      });
      await adminUser.save();
    }

    // Clear existing problems and test cases
    console.log('Clearing existing problems and test cases...');
    await Problem.deleteMany({});
    await TestCase.deleteMany({});

    console.log('Seeding problems...');
    
    for (const problemData of problemsData) {
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
        totalSubmissions: Math.floor(Math.random() * 1000) + 50,
        acceptedSubmissions: Math.floor(Math.random() * 400) + 20,
        isActive: true,
        isFeatured: Math.random() > 0.7,
        createdBy: adminUser._id
      });

      const savedProblem = await problem.save();
      console.log(`✓ Created problem: ${problemData.title}`);

      // Create test cases
      const testCaseIds = [];
      for (const testCaseData of problemData.testCases) {
        const testCase = new TestCase({
          problemId: savedProblem._id,
          input: testCaseData.input,
          expectedOutput: testCaseData.expectedOutput,
          isPublic: testCaseData.isPublic,
          description: testCaseData.description || '',
          points: testCaseData.isPublic ? 0 : Math.floor(Math.random() * 20) + 10
        });

        const savedTestCase = await testCase.save();
        testCaseIds.push(savedTestCase._id);
      }

      // Update problem with test case references
      savedProblem.testCases = testCaseIds;
      await savedProblem.save();
      
      console.log(`  ✓ Created ${testCaseIds.length} test cases`);
    }

    console.log(`\n🎉 Successfully seeded ${problemsData.length} problems with test cases!`);
    console.log('\nProblems by difficulty:');
    console.log(`- Easy: ${problemsData.filter(p => p.difficulty === 'Easy').length}`);
    console.log(`- Medium: ${problemsData.filter(p => p.difficulty === 'Medium').length}`);
    console.log(`- Hard: ${problemsData.filter(p => p.difficulty === 'Hard').length}`);

    // Display seeded problems summary
    const problems = await Problem.find({}).populate('createdBy', 'name username');
    console.log('\n📊 Seeded Problems Summary:');
    problems.forEach((problem, index) => {
      console.log(`${index + 1}. ${problem.title} (${problem.difficulty}) - ${problem.tags.join(', ')}`);
    });

  } catch (error) {
    console.error('Error seeding problems:', error);
  }
}

// Main execution
async function main() {
  await connectDB();
  await seedProblems();
  console.log('\n✅ Database seeding completed successfully!');
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { seedProblems, problemsData };
