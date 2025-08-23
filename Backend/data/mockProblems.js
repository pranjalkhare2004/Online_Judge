/**
 * MOCK PROBLEMS DATA
 * 
 * This file contains sample problems data for development and testing
 * when database connection is not available. The structure matches
 * the Problem schema defined in models/Problem.js
 */

const mockProblems = [
  {
    _id: "507f1f77bcf86cd799439011",
    title: "Two Sum",
    slug: "two-sum",
    difficulty: "Easy",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
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
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    _id: "507f1f77bcf86cd799439012",
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
    totalSubmissions: 1847292,
    acceptedSubmissions: 923646,
    isActive: true,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  },
  {
    _id: "507f1f77bcf86cd799439013",
    title: "Longest Substring Without Repeating Characters",
    slug: "longest-substring-without-repeating-characters",
    difficulty: "Medium",
    description: "Given a string s, find the length of the longest substring without repeating characters.",
    examples: [
      {
        input: 's = "abcabcbb"',
        output: "3",
        explanation: 'The answer is "abc", with the length of 3.'
      },
      {
        input: 's = "bbbbb"',
        output: "1",
        explanation: 'The answer is "b", with the length of 1.'
      }
    ],
    constraints: [
      "0 <= s.length <= 5 * 10^4",
      "s consists of English letters, digits, symbols and spaces."
    ],
    tags: ["Hash Table", "String", "Sliding Window"],
    totalSubmissions: 2234567,
    acceptedSubmissions: 1117284,
    isActive: true,
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03')
  },
  {
    _id: "507f1f77bcf86cd799439014",
    title: "Median of Two Sorted Arrays",
    slug: "median-of-two-sorted-arrays",
    difficulty: "Hard",
    description: "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.",
    examples: [
      {
        input: "nums1 = [1,3], nums2 = [2]",
        output: "2.00000",
        explanation: "merged array = [1,2,3] and median is 2."
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
    totalSubmissions: 987654,
    acceptedSubmissions: 345678,
    isActive: true,
    createdAt: new Date('2024-01-04'),
    updatedAt: new Date('2024-01-04')
  },
  {
    _id: "507f1f77bcf86cd799439015",
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    difficulty: "Easy",
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    examples: [
      {
        input: 's = "()"',
        output: "true",
        explanation: "The string contains valid parentheses."
      },
      {
        input: 's = "()[]{}"',
        output: "true",
        explanation: "All parentheses are properly closed."
      }
    ],
    constraints: [
      "1 <= s.length <= 10^4",
      "s consists of parentheses only '()[]{}'."
    ],
    tags: ["String", "Stack"],
    totalSubmissions: 1567890,
    acceptedSubmissions: 1098765,
    isActive: true,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05')
  },
  {
    _id: "507f1f77bcf86cd799439016",
    title: "Container With Most Water",
    slug: "container-with-most-water",
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
      "n >= 2",
      "0 <= height[i] <= 3 * 10^4"
    ],
    tags: ["Array", "Two Pointers", "Greedy"],
    totalSubmissions: 1345678,
    acceptedSubmissions: 876543,
    isActive: true,
    createdAt: new Date('2024-01-06'),
    updatedAt: new Date('2024-01-06')
  },
  {
    _id: "507f1f77bcf86cd799439017",
    title: "Maximum Depth of Binary Tree",
    slug: "maximum-depth-of-binary-tree",
    difficulty: "Easy",
    description: "Given the root of a binary tree, return its maximum depth. A binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.",
    examples: [
      {
        input: "root = [3,9,20,null,null,15,7]",
        output: "3",
        explanation: "The maximum depth is 3."
      }
    ],
    constraints: [
      "The number of nodes in the tree is in the range [0, 10^4].",
      "-100 <= Node.val <= 100"
    ],
    tags: ["Tree", "Depth-First Search", "Recursion"],
    totalSubmissions: 1876543,
    acceptedSubmissions: 1654321,
    isActive: true,
    createdAt: new Date('2024-01-07'),
    updatedAt: new Date('2024-01-07')
  },
  {
    _id: "507f1f77bcf86cd799439018",
    title: "Merge k Sorted Lists",
    slug: "merge-k-sorted-lists",
    difficulty: "Hard",
    description: "You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.",
    examples: [
      {
        input: "lists = [[1,4,5],[1,3,4],[2,6]]",
        output: "[1,1,2,3,4,4,5,6]",
        explanation: "The linked-lists are merged into one sorted list."
      }
    ],
    constraints: [
      "k == lists.length",
      "0 <= k <= 10^4",
      "0 <= lists[i].length <= 500",
      "-10^4 <= lists[i][j] <= 10^4"
    ],
    tags: ["Linked List", "Divide and Conquer", "Heap", "Merge Sort"],
    totalSubmissions: 765432,
    acceptedSubmissions: 234567,
    isActive: true,
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08')
  }
];

// Helper functions for filtering and pagination
const applyFilters = (problems, filters) => {
  let filtered = [...problems];

  // Difficulty filter
  if (filters.difficulty && filters.difficulty !== 'All') {
    filtered = filtered.filter(p => p.difficulty === filters.difficulty);
  }

  // Tags filter
  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter(p => 
      filters.tags.some(tag => p.tags.includes(tag))
    );
  }

  // Search filter
  if (filters.search && filters.search.trim()) {
    const searchTerm = filters.search.toLowerCase();
    filtered = filtered.filter(p => 
      p.title.toLowerCase().includes(searchTerm) ||
      p.description.toLowerCase().includes(searchTerm) ||
      p.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  // Acceptance rate filter
  if (filters.acceptanceRateMin !== undefined || filters.acceptanceRateMax !== undefined) {
    filtered = filtered.filter(p => {
      const acceptanceRate = (p.acceptedSubmissions / p.totalSubmissions) * 100;
      const min = filters.acceptanceRateMin || 0;
      const max = filters.acceptanceRateMax || 100;
      return acceptanceRate >= min && acceptanceRate <= max;
    });
  }

  return filtered;
};

const applyPagination = (problems, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    problems: problems.slice(startIndex, endIndex),
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(problems.length / limit),
      totalCount: problems.length,
      hasNext: endIndex < problems.length,
      hasPrev: page > 1
    }
  };
};

// Get all unique tags from problems
const getAllTags = () => {
  const allTags = new Set();
  mockProblems.forEach(problem => {
    problem.tags.forEach(tag => allTags.add(tag));
  });
  return Array.from(allTags).sort();
};

module.exports = {
  mockProblems,
  applyFilters,
  applyPagination,
  getAllTags
};
