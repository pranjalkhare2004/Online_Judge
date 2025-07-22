const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    problem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
        required: true
    },
    code: {
        type: String,
        required: [true, "Code is required"]
    },
    language: {
        type: String,
        enum: ["javascript", "python", "java", "cpp", "c"],
        required: true
    },
    status: {
        type: String,
        enum: ["Pending", "Accepted", "Wrong Answer", "Time Limit Exceeded", "Runtime Error", "Compilation Error"],
        default: "Pending"
    },
    score: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    testCasesPassed: {
        type: Number,
        default: 0
    },
    totalTestCases: {
        type: Number,
        default: 0
    },
    executionTime: {
        type: Number, // in milliseconds
        default: 0
    },
    memoryUsed: {
        type: Number, // in KB
        default: 0
    },
    verdict: {
        type: String,
        maxlength: [500, "Verdict cannot exceed 500 characters"]
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for better query performance
submissionSchema.index({ user: 1, problem: 1 });
submissionSchema.index({ problem: 1, status: 1 });
submissionSchema.index({ user: 1, submittedAt: -1 });

module.exports = mongoose.model("Submission", submissionSchema);
