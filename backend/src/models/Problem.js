/**
 * PROBLEM MODEL SCHEMA
 * 
 * Purpose: Defines the data structure for coding problems in the Online Judge platform.
 * This schema handles problem definitions, test cases, metadata, and statistics tracking.
 * 
 * Key Responsibilities:
 * - Define problem structure with comprehensive metadata
 * - Manage test cases (both visible and hidden)
 * - Handle problem difficulty and categorization
 * - Track submission statistics and acceptance rates
 * - Generate SEO-friendly slugs automatically
 * - Manage problem visibility and status
 * 
 * Why this exists: The Problem model is the core entity of any Online Judge system.
 * It needs to store all information required for problem presentation, solution testing,
 * and performance tracking. This schema ensures data consistency and provides rich
 * metadata for problem management.
 */

const mongoose = require("mongoose");

const testCaseSchema = new mongoose.Schema({
    input: {
        type: String,
        required: true
    },
    expectedOutput: {
        type: String,
        required: true
    },
    isHidden: {
        type: Boolean,
        default: false
    },
    points: {
        type: Number,
        default: 1
    }
});

const problemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Problem title is required"],
        trim: true,
        maxlength: [200, "Title cannot exceed 200 characters"]
    },
    
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    
    description: {
        type: String,
        required: [true, "Problem description is required"]
    },
    
    difficulty: {
        type: String,
        enum: ["Easy", "Medium", "Hard"],
        required: true
    },
    
    tags: [{
        type: String,
        trim: true
    }],
    
    constraints: {
        type: String,
        required: true
    },
    
    inputFormat: {
        type: String,
        required: true
    },
    
    outputFormat: {
        type: String,
        required: true
    },
    
    sampleInput: {
        type: String,
        required: true
    },
    
    sampleOutput: {
        type: String,
        required: true
    },
    
    explanation: {
        type: String
    },
    
    testCases: [testCaseSchema],
    
    timeLimit: {
        type: Number,
        required: true,
        default: 1000 // in milliseconds
    },
    
    memoryLimit: {
        type: Number,
        required: true,
        default: 256 // in MB
    },
    
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    
    isPublic: {
        type: Boolean,
        default: false
    },
    
    isActive: {
        type: Boolean,
        default: true
    },
    
    stats: {
        totalSubmissions: {
            type: Number,
            default: 0
        },
        acceptedSubmissions: {
            type: Number,
            default: 0
        },
        acceptanceRate: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Create slug from title before saving
problemSchema.pre('save', function(next) {
    if (this.isModified('title')) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    next();
});

// Update acceptance rate when stats change
problemSchema.pre('save', function(next) {
    if (this.stats.totalSubmissions > 0) {
        this.stats.acceptanceRate = Math.round(
            (this.stats.acceptedSubmissions / this.stats.totalSubmissions) * 100
        );
    }
    next();
});

module.exports = mongoose.model("Problem", problemSchema);
