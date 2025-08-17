/**
 * MOCK PROBLEMS DATA FOR DEVELOPMENT
 * 
 * This file contains the same 20 problems that would be seeded into the database
 * but serves as a temporary mock data source when database connection is unavailable.
 * Use this for development and testing the frontend problems page functionality.
 * 
 * Structure matches the Problem model schema exactly.
 */

const mockProblems = [
  // ============ EASY PROBLEMS (8) ============
  {
    _id: "67654321abcdef123456789a",
    title: "Two Sum",
    slug: "two-sum",
    difficulty: "Easy",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.",
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
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9", 
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists."
    ],
    tags: ["Array", "Hash Table"],
    totalSubmissions: 2847392,
    acceptedSubmissions: 1423696,
    acceptanceRate: 50.0,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    _id: "67654321abcdef123456789b",
    title: "Valid Parentheses",
    slug: "valid-parentheses", 
    difficulty: "Easy",
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if: Open brackets must be closed by the same type of brackets, and Open brackets must be closed in the correct order.",
    examples: [
      {
        input: "s = \"()\"",
        output: "true",
        explanation: "The parentheses are properly matched."
      },
      {
        input: "s = \"()[]{}\"",
        output: "true", 
        explanation: "All brackets are properly matched and in correct order."
      }
    ],
    constraints: [
      "1 <= s.length <= 10^4",
      "s consists of parentheses only '()[]{}'."
    ],
    tags: ["String", "Stack"],
    totalSubmissions: 1958392,
    acceptedSubmissions: 1174435,
    acceptanceRate: 59.9,
    isActive: true,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  },
  {
    _id: "67654321abcdef123456789c",
    title: "Maximum Depth of Binary Tree",
    slug: "maximum-depth-binary-tree",
    difficulty: "Easy", 
    description: "Given the root of a binary tree, return its maximum depth. A binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.",
    examples: [
      {
        input: "root = [3,9,20,null,null,15,7]",
        output: "3",
        explanation: "The maximum depth is 3: root -> 20 -> 15 (or 7)."
      }
    ],
    constraints: [
      "The number of nodes in the tree is in the range [0, 10^4].",
      "-100 <= Node.val <= 100"
    ],
    tags: ["Tree", "Depth-First Search", "Binary Tree"],
    totalSubmissions: 1547392,
    acceptedSubmissions: 1162044,
    acceptanceRate: 75.1,
    isActive: true,
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03')
  },
  {
    _id: "67654321abcdef123456789d",
    title: "Merge Two Sorted Lists",
    slug: "merge-two-sorted-lists",
    difficulty: "Easy",
    description: "You are given the heads of two sorted linked lists list1 and list2. Merge the two lists in a one sorted list. The list should be made by splicing together the nodes of the first two lists. Return the head of the merged linked list.",
    examples: [
      {
        input: "list1 = [1,2,4], list2 = [1,3,4]",
        output: "[1,1,2,3,4,4]",
        explanation: "The merged list is sorted."
      }
    ],
    constraints: [
      "The number of nodes in both lists is in the range [0, 50].",
      "-100 <= Node.val <= 100",
      "Both list1 and list2 are sorted in non-decreasing order."
    ],
    tags: ["Linked List", "Recursion"],
    totalSubmissions: 1847392,
    acceptedSubmissions: 1293575,
    acceptanceRate: 70.0,
    isActive: true,
    createdAt: new Date('2024-01-04'),
    updatedAt: new Date('2024-01-04')
  },
  {
    _id: "67654321abcdef123456789e",
    title: "Best Time to Buy and Sell Stock",
    slug: "best-time-buy-sell-stock",
    difficulty: "Easy",
    description: "You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock. Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.",
    examples: [
      {
        input: "prices = [7,1,5,3,6,4]",
        output: "5",
        explanation: "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5."
      }
    ],
    constraints: [
      "1 <= prices.length <= 10^5",
      "0 <= prices[i] <= 10^4"
    ],
    tags: ["Array", "Dynamic Programming"],
    totalSubmissions: 2147392,
    acceptedSubmissions: 1288435,
    acceptanceRate: 60.0,
    isActive: true,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05')
  },
  {
    _id: "67654321abcdef123456789f",
    title: "Palindrome Number",
    slug: "palindrome-number",
    difficulty: "Easy",
    description: "Given an integer x, return true if x is palindrome integer. An integer is a palindrome when it reads the same backward as forward.",
    examples: [
      {
        input: "x = 121",
        output: "true",
        explanation: "121 reads as 121 from left to right and from right to left."
      },
      {
        input: "x = -121",
        output: "false",
        explanation: "From left to right, it reads -121. From right to left, it becomes 121-."
      }
    ],
    constraints: [
      "-2^31 <= x <= 2^31 - 1"
    ],
    tags: ["Math"],
    totalSubmissions: 1847392,
    acceptedSubmissions: 1016065,
    acceptanceRate: 55.0,
    isActive: true,
    createdAt: new Date('2024-01-06'),
    updatedAt: new Date('2024-01-06')
  },
  {
    _id: "67654321abcdef12345678a0",
    title: "Roman to Integer",
    slug: "roman-to-integer",
    difficulty: "Easy",
    description: "Roman numerals are represented by seven different symbols: I, V, X, L, C, D and M. Given a roman numeral, convert it to an integer.",
    examples: [
      {
        input: "s = \"III\"",
        output: "3",
        explanation: "III = 3."
      },
      {
        input: "s = \"LVIII\"",
        output: "58",
        explanation: "L = 50, V= 5, III = 3."
      }
    ],
    constraints: [
      "1 <= s.length <= 15",
      "s contains only the characters ('I', 'V', 'X', 'L', 'C', 'D', 'M').",
      "It is guaranteed that s is a valid roman numeral in the range [1, 3999]."
    ],
    tags: ["Hash Table", "Math", "String"],
    totalSubmissions: 1547392,
    acceptedSubmissions: 1084575,
    acceptanceRate: 70.1,
    isActive: true,
    createdAt: new Date('2024-01-07'),
    updatedAt: new Date('2024-01-07')
  },
  {
    _id: "67654321abcdef12345678a1",
    title: "Longest Common Prefix",
    slug: "longest-common-prefix",
    difficulty: "Easy",
    description: "Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string \"\".",
    examples: [
      {
        input: "strs = [\"flower\",\"flow\",\"flight\"]",
        output: "\"fl\"",
        explanation: "The longest common prefix is \"fl\"."
      },
      {
        input: "strs = [\"dog\",\"racecar\",\"car\"]",
        output: "\"\"",
        explanation: "There is no common prefix among the input strings."
      }
    ],
    constraints: [
      "1 <= strs.length <= 200",
      "0 <= strs[i].length <= 200",
      "strs[i] consists of only lowercase English letters."
    ],
    tags: ["String"],
    totalSubmissions: 1647392,
    acceptedSubmissions: 938235,
    acceptanceRate: 57.0,
    isActive: true,
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08')
  },

  // ============ MEDIUM PROBLEMS (8) ============
  {
    _id: "67654321abcdef12345678a2", 
    title: "Add Two Numbers",
    slug: "add-two-numbers",
    difficulty: "Medium",
    description: "You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.",
    examples: [
      {
        input: "l1 = [2,4,3], l2 = [5,6,4]",
        output: "[7,0,8]",
        explanation: "342 + 465 = 807."
      }
    ],
    constraints: [
      "The number of nodes in each linked list is in the range [1, 100].",
      "0 <= Node.val <= 9",
      "It is guaranteed that the list represents a number that does not have leading zeros."
    ],
    tags: ["Linked List", "Math", "Recursion"],
    totalSubmissions: 2547392,
    acceptedSubmissions: 955735,
    acceptanceRate: 37.5,
    isActive: true,
    createdAt: new Date('2024-01-09'),
    updatedAt: new Date('2024-01-09')
  },
  {
    _id: "67654321abcdef12345678a3",
    title: "Longest Substring Without Repeating Characters", 
    slug: "longest-substring-without-repeating",
    difficulty: "Medium",
    description: "Given a string s, find the length of the longest substring without repeating characters.",
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
    constraints: [
      "0 <= s.length <= 5 * 10^4",
      "s consists of English letters, digits, symbols and spaces."
    ],
    tags: ["Hash Table", "String", "Sliding Window"],
    totalSubmissions: 3247392,
    acceptedSubmissions: 1169021,
    acceptanceRate: 36.0,
    isActive: true,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10')
  },
  {
    _id: "67654321abcdef12345678a4",
    title: "Container With Most Water",
    slug: "container-most-water",
    difficulty: "Medium",
    description: "You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]). Find two lines that together with the x-axis form a container that contains the most water.",
    examples: [
      {
        input: "height = [1,8,6,2,5,4,8,3,7]",
        output: "49",
        explanation: "The above vertical lines are represented by array [1,8,6,2,5,4,8,3,7]. In this case, the max area of water the container can contain is 49."
      }
    ],
    constraints: [
      "n == height.length",
      "2 <= n <= 10^5",
      "0 <= height[i] <= 10^4"
    ],
    tags: ["Array", "Two Pointers", "Greedy"],
    totalSubmissions: 1847392,
    acceptedSubmissions: 923696,
    acceptanceRate: 50.0,
    isActive: true,
    createdAt: new Date('2024-01-11'),
    updatedAt: new Date('2024-01-11')
  },
  {
    _id: "67654321abcdef12345678a5",
    title: "3Sum",
    slug: "three-sum",
    difficulty: "Medium",
    description: "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0. Notice that the solution set must not contain duplicate triplets.",
    examples: [
      {
        input: "nums = [-1,0,1,2,-1,-4]",
        output: "[[-1,-1,2],[-1,0,1]]",
        explanation: "nums[0] + nums[1] + nums[2] = (-1) + 0 + 1 = 0. nums[1] + nums[2] + nums[4] = 0 + 1 + (-1) = 0. The distinct triplets are [-1,0,1] and [-1,-1,2]."
      }
    ],
    constraints: [
      "3 <= nums.length <= 3000",
      "-10^5 <= nums[i] <= 10^5"
    ],
    tags: ["Array", "Two Pointers", "Sorting"],
    totalSubmissions: 2247392,
    acceptedSubmissions: 742697,
    acceptanceRate: 33.0,
    isActive: true,
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12')
  },
  {
    _id: "67654321abcdef12345678a6",
    title: "Letter Combinations of a Phone Number",
    slug: "letter-combinations-phone-number",
    difficulty: "Medium",
    description: "Given a string containing digits from 2-9 inclusive, return all possible letter combinations that the number could represent. Return the answer in any order.",
    examples: [
      {
        input: "digits = \"23\"",
        output: "[\"ad\",\"ae\",\"af\",\"bd\",\"be\",\"bf\",\"cd\",\"ce\",\"cf\"]",
        explanation: "2 maps to 'abc' and 3 maps to 'def'."
      }
    ],
    constraints: [
      "0 <= digits.length <= 4",
      "digits[i] is a digit in the range ['2', '9']."
    ],
    tags: ["Hash Table", "String", "Backtracking"],
    totalSubmissions: 1447392,
    acceptedSubmissions: 781631,
    acceptanceRate: 54.0,
    isActive: true,
    createdAt: new Date('2024-01-13'),
    updatedAt: new Date('2024-01-13')
  },
  {
    _id: "67654321abcdef12345678a7",
    title: "Generate Parentheses",
    slug: "generate-parentheses",
    difficulty: "Medium",
    description: "Given n pairs of parentheses, write a function to generate all combinations of well-formed parentheses.",
    examples: [
      {
        input: "n = 3",
        output: "[\"((()))\",\"(()())\",\"(())()\",\"()(())\",\"()()()\"]",
        explanation: "All possible combinations of 3 pairs of well-formed parentheses."
      }
    ],
    constraints: [
      "1 <= n <= 8"
    ],
    tags: ["String", "Dynamic Programming", "Backtracking"],
    totalSubmissions: 1347392,
    acceptedSubmissions: 889421,
    acceptanceRate: 66.0,
    isActive: true,
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14')
  },
  {
    _id: "67654321abcdef12345678a8",
    title: "Merge Intervals",
    slug: "merge-intervals",
    difficulty: "Medium", 
    description: "Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.",
    examples: [
      {
        input: "intervals = [[1,3],[2,6],[8,10],[15,18]]",
        output: "[[1,6],[8,10],[15,18]]",
        explanation: "Since intervals [1,3] and [2,6] overlap, merge them into [1,6]."
      }
    ],
    constraints: [
      "1 <= intervals.length <= 10^4",
      "intervals[i].length == 2",
      "0 <= starti <= endi <= 10^4"
    ],
    tags: ["Array", "Sorting"],
    totalSubmissions: 1547392,
    acceptedSubmissions: 803825,
    acceptanceRate: 52.0,
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    _id: "67654321abcdef12345678a9",
    title: "Rotate Image",
    slug: "rotate-image",
    difficulty: "Medium",
    description: "You are given an n x n 2D matrix representing an image, rotate the image by 90 degrees (clockwise). You have to rotate the image in-place, which means you have to modify the input 2D matrix directly. DO NOT allocate another 2D matrix and do the rotation.",
    examples: [
      {
        input: "matrix = [[1,2,3],[4,5,6],[7,8,9]]",
        output: "[[7,4,1],[8,5,2],[9,6,3]]",
        explanation: "Rotate the matrix 90 degrees clockwise."
      }
    ],
    constraints: [
      "n == matrix.length == matrix[i].length",
      "1 <= n <= 20",
      "-1000 <= matrix[i][j] <= 1000"
    ],
    tags: ["Array", "Math", "Matrix"],
    totalSubmissions: 1247392,
    acceptedSubmissions: 810635,
    acceptanceRate: 65.0,
    isActive: true,
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16')
  },

  // ============ HARD PROBLEMS (4) ============
  {
    _id: "67654321abcdef12345678aa",
    title: "Median of Two Sorted Arrays",
    slug: "median-two-sorted-arrays",
    difficulty: "Hard",
    description: "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays. The overall run time complexity should be O(log (m+n)).",
    examples: [
      {
        input: "nums1 = [1,3], nums2 = [2]",
        output: "2.00000",
        explanation: "merged array = [1,2,3] and median is 2."
      },
      {
        input: "nums1 = [1,2], nums2 = [3,4]",
        output: "2.50000",
        explanation: "merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5."
      }
    ],
    constraints: [
      "nums1.length == m",
      "nums2.length == n",
      "0 <= m <= 1000",
      "0 <= n <= 1000",
      "1 <= m + n <= 2000",
      "-10^6 <= nums1[i], nums2[i] <= 10^6"
    ],
    tags: ["Array", "Binary Search", "Divide and Conquer"],
    totalSubmissions: 1847392,
    acceptedSubmissions: 461848,
    acceptanceRate: 25.0,
    isActive: true,
    createdAt: new Date('2024-01-17'),
    updatedAt: new Date('2024-01-17')
  },
  {
    _id: "67654321abcdef12345678ab",
    title: "Merge k Sorted Lists",
    slug: "merge-k-sorted-lists",
    difficulty: "Hard",
    description: "You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.",
    examples: [
      {
        input: "lists = [[1,4,5],[1,3,4],[2,6]]",
        output: "[1,1,2,3,4,4,5,6]",
        explanation: "The linked-lists are: [ [1,4,5], [1,3,4], [2,6] ] merging them into one sorted list: [1,1,2,3,4,4,5,6]."
      }
    ],
    constraints: [
      "k == lists.length",
      "0 <= k <= 10^4",
      "0 <= lists[i].length <= 500",
      "-10^4 <= lists[i][j] <= 10^4",
      "lists[i] is sorted in ascending order.",
      "The sum of lists[i].length will not exceed 10^4."
    ],
    tags: ["Linked List", "Divide and Conquer", "Heap (Priority Queue)", "Merge Sort"],
    totalSubmissions: 1647392,
    acceptedSubmissions: 691105,
    acceptanceRate: 42.0,
    isActive: true,
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18')
  },
  {
    _id: "67654321abcdef12345678ac",
    title: "Trapping Rain Water",
    slug: "trapping-rain-water",
    difficulty: "Hard",
    description: "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
    examples: [
      {
        input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]",
        output: "6",
        explanation: "The above elevation map is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water are being trapped."
      }
    ],
    constraints: [
      "n == height.length",
      "1 <= n <= 2 * 10^4",
      "0 <= height[i] <= 3 * 10^4"
    ],
    tags: ["Array", "Two Pointers", "Dynamic Programming", "Stack", "Monotonic Stack"],
    totalSubmissions: 1547392,
    acceptedSubmissions: 649045,
    acceptanceRate: 42.0,
    isActive: true,
    createdAt: new Date('2024-01-19'),
    updatedAt: new Date('2024-01-19')
  },
  {
    _id: "67654321abcdef12345678ad",
    title: "Regular Expression Matching",
    slug: "regular-expression-matching",
    difficulty: "Hard",
    description: "Given an input string s and a pattern p, implement regular expression matching with support for '.' and '*' where: '.' Matches any single character, '*' Matches zero or more of the preceding element. The matching should cover the entire input string (not partial).",
    examples: [
      {
        input: "s = \"aa\", p = \"a*\"",
        output: "true",
        explanation: "'*' means zero or more of the preceding element, 'a'. Therefore, by repeating 'a' once, it becomes \"aa\"."
      },
      {
        input: "s = \"ab\", p = \".*\"",
        output: "true",
        explanation: "\".*\" means \"zero or more (*) of any character (.)\"."
      }
    ],
    constraints: [
      "1 <= s.length <= 20",
      "1 <= p.length <= 30",
      "s contains only lowercase English letters.",
      "p contains only lowercase English letters, '.', and '*'.",
      "It is guaranteed for each appearance of the character '*', there will be a previous valid character to match."
    ],
    tags: ["String", "Dynamic Programming", "Recursion"],
    totalSubmissions: 1247392,
    acceptedSubmissions: 324323,
    acceptanceRate: 26.0,
    isActive: true,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20')
  }
];

// Mock custom lists data
const mockCustomLists = [
  {
    _id: "67654321abcdef12345678ae",
    name: "Favorite Easy Problems",
    description: "Collection of my favorite easy problems for practice",
    userId: "user123",
    isPublic: false,
    problems: ["67654321abcdef123456789a", "67654321abcdef123456789b", "67654321abcdef123456789c"],
    createdAt: new Date('2024-01-21'),
    updatedAt: new Date('2024-01-21')
  },
  {
    _id: "67654321abcdef12345678af",
    name: "Interview Prep - Arrays",
    description: "Array-based problems commonly asked in interviews",
    userId: "user123", 
    isPublic: true,
    problems: ["67654321abcdef123456789a", "67654321abcdef12345678a4", "67654321abcdef12345678a9"],
    createdAt: new Date('2024-01-22'),
    updatedAt: new Date('2024-01-22')
  }
];

// Mock solved problems for a user
const mockSolvedProblems = [
  "67654321abcdef123456789a", // Two Sum
  "67654321abcdef123456789b", // Valid Parentheses
  "67654321abcdef123456789f", // Palindrome Number
  "67654321abcdef12345678a0"  // Roman to Integer
];

// Export for use in API endpoints or frontend
module.exports = {
  mockProblems,
  mockCustomLists, 
  mockSolvedProblems
};
