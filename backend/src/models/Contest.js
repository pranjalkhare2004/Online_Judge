const mongoose = require("mongoose");

const contestSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Contest title is required"],
        trim: true,
        maxlength: [200, "Title cannot exceed 200 characters"]
    },
    description: {
        type: String,
        required: [true, "Contest description is required"],
        maxlength: [2000, "Description cannot exceed 2000 characters"]
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    problems: [{
        problem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Problem',
            required: true
        },
        points: {
            type: Number,
            default: 100,
            min: 1
        }
    }],
    participants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        registeredAt: {
            type: Date,
            default: Date.now
        }
    }],
    startTime: {
        type: Date,
        required: [true, "Start time is required"]
    },
    endTime: {
        type: Date,
        required: [true, "End time is required"]
    },
    duration: {
        type: Number, // in minutes
        required: true
    },
    status: {
        type: String,
        enum: ["Draft", "Upcoming", "Live", "Completed"],
        default: "Draft"
    },
    maxParticipants: {
        type: Number,
        default: null // null means unlimited
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    rules: {
        type: String,
        maxlength: [1000, "Rules cannot exceed 1000 characters"]
    }
}, {
    timestamps: true
});

// Validate that end time is after start time
contestSchema.pre('save', function(next) {
    if (this.endTime <= this.startTime) {
        next(new Error('End time must be after start time'));
    }
    next();
});

// Indexes
contestSchema.index({ startTime: 1, status: 1 });
contestSchema.index({ organizer: 1 });

module.exports = mongoose.model("Contest", contestSchema);
