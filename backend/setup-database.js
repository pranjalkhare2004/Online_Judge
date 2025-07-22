const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Problem = require('./src/models/Problem');
require('dotenv').config();

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/online-judge');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Create admin user
const createAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      console.log('✅ Admin user already exists');
      return;
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const admin = await User.create({
      firstname: 'Admin',
      lastname: 'User',
      email: 'admin@algouniversity.com',
      password: hashedPassword,
      role: 'admin',
      isVerified: true,
      isActive: true
    });

    console.log('✅ Admin user created successfully');
    console.log('📧 Email: admin@algouniversity.com');
    console.log('🔑 Password: admin123');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  }
};

// Create sample problems
const createSampleProblems = async () => {
  try {
    const problemCount = await Problem.countDocuments();
    
    if (problemCount > 0) {
      console.log('✅ Sample problems already exist');
      return;
    }

    const admin = await User.findOne({ role: 'admin' });
    
    const sampleProblems = [
      {
        title: "Two Sum",
        slug: "two-sum",
        description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
        difficulty: "easy",
        category: "Array",
        tags: ["array", "hash-table"],
        points: 100,
        timeLimit: 2,
        memoryLimit: 128,
        sampleInput: "nums = [2,7,11,15], target = 9",
        sampleOutput: "[0,1]",
        constraints: `- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- -10^9 <= target <= 10^9
- Only one valid answer exists.`,
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
        testCases: [
          {
            input: "[2,7,11,15]\n9",
            expectedOutput: "[0,1]",
            points: 2
          },
          {
            input: "[3,2,4]\n6",
            expectedOutput: "[1,2]",
            points: 2
          },
          {
            input: "[3,3]\n6",
            expectedOutput: "[0,1]",
            points: 1
          }
        ],
        status: "published",
        isPublic: true,
        author: admin._id
      },
      {
        title: "Valid Parentheses",
        slug: "valid-parentheses",
        description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
        difficulty: "easy",
        category: "Stack",
        tags: ["string", "stack"],
        points: 150,
        timeLimit: 1,
        memoryLimit: 64,
        sampleInput: "s = \"()\"",
        sampleOutput: "true",
        constraints: `- 1 <= s.length <= 10^4
- s consists of parentheses only '()[]{}'.`,
        examples: [
          {
            input: "s = \"()\"",
            output: "true",
            explanation: "The string contains valid parentheses."
          },
          {
            input: "s = \"()[]{}\"",
            output: "true",
            explanation: "All brackets are properly closed."
          },
          {
            input: "s = \"(]\"",
            output: "false",
            explanation: "Brackets are not properly matched."
          }
        ],
        testCases: [
          {
            input: "()",
            expectedOutput: "true",
            points: 2
          },
          {
            input: "()[]{}",
            expectedOutput: "true",
            points: 2
          },
          {
            input: "(]",
            expectedOutput: "false",
            points: 1
          }
        ],
        status: "published",
        isPublic: true,
        author: admin._id
      },
      {
        title: "Binary Tree Inorder Traversal",
        slug: "binary-tree-inorder-traversal",
        description: `Given the root of a binary tree, return the inorder traversal of its nodes' values.

Follow up: Recursive solution is trivial, could you do it iteratively?`,
        difficulty: "medium",
        category: "Tree",
        tags: ["stack", "tree", "depth-first-search", "binary-tree"],
        points: 200,
        timeLimit: 3,
        memoryLimit: 128,
        sampleInput: "root = [1,null,2,3]",
        sampleOutput: "[1,3,2]",
        constraints: `- The number of nodes in the tree is in the range [0, 100].
- -100 <= Node.val <= 100`,
        examples: [
          {
            input: "root = [1,null,2,3]",
            output: "[1,3,2]",
            explanation: "Inorder traversal: left, root, right"
          },
          {
            input: "root = []",
            output: "[]",
            explanation: "Empty tree returns empty array"
          }
        ],
        testCases: [
          {
            input: "[1,null,2,3]",
            expectedOutput: "[1,3,2]",
            points: 3
          },
          {
            input: "[]",
            expectedOutput: "[]",
            points: 1
          },
          {
            input: "[1]",
            expectedOutput: "[1]",
            points: 1
          }
        ],
        status: "published",
        isPublic: true,
        author: admin._id
      }
    ];

    await Problem.insertMany(sampleProblems);
    console.log('✅ Sample problems created successfully');
    
  } catch (error) {
    console.error('❌ Error creating sample problems:', error.message);
  }
};

// Create sample users
const createSampleUsers = async () => {
  try {
    const userCount = await User.countDocuments({ role: 'user' });
    
    if (userCount > 0) {
      console.log('✅ Sample users already exist');
      return;
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('user123', salt);

    const sampleUsers = [
      {
        firstname: 'John',
        lastname: 'Doe',
        email: 'john.doe@example.com',
        password: hashedPassword,
        role: 'user',
        isVerified: true,
        isActive: true,
        bio: 'Passionate competitive programmer',
        institution: 'MIT',
        country: 'USA',
        programmingLanguages: ['JavaScript', 'Python', 'C++'],
        skillLevel: 'intermediate'
      },
      {
        firstname: 'Jane',
        lastname: 'Smith',
        email: 'jane.smith@example.com',
        password: hashedPassword,
        role: 'user',
        isVerified: true,
        isActive: true,
        bio: 'Software engineer with a love for algorithms',
        institution: 'Stanford University',
        country: 'USA',
        programmingLanguages: ['Java', 'Python', 'Go'],
        skillLevel: 'advanced'
      },
      {
        firstname: 'Alice',
        lastname: 'Johnson',
        email: 'alice.johnson@example.com',
        password: hashedPassword,
        role: 'user',
        isVerified: true,
        isActive: true,
        bio: 'Computer science student',
        institution: 'University of California',
        country: 'USA',
        programmingLanguages: ['Python', 'JavaScript'],
        skillLevel: 'beginner'
      }
    ];

    await User.insertMany(sampleUsers);
    console.log('✅ Sample users created successfully');
    console.log('📧 Sample user credentials:');
    console.log('   john.doe@example.com / user123');
    console.log('   jane.smith@example.com / user123');
    console.log('   alice.johnson@example.com / user123');
    
  } catch (error) {
    console.error('❌ Error creating sample users:', error.message);
  }
};

// Main setup function
const setupDatabase = async () => {
  console.log('🚀 Starting database setup...\n');
  
  await connectDB();
  await createAdminUser();
  await createSampleUsers();
  await createSampleProblems();
  
  console.log('\n✅ Database setup completed successfully!');
  console.log('\n📋 Setup Summary:');
  console.log('   🔐 Admin: admin@algouniversity.com / admin123');
  console.log('   👥 Sample users created with password: user123');
  console.log('   📚 Sample problems added');
  console.log('\n🌐 You can now start the server and test the API!');
  
  process.exit(0);
};

// Error handling
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  process.exit(1);
});

// Run setup
setupDatabase();
