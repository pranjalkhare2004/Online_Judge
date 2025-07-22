/**
 * USER MODEL SCHEMA
 * 
 * Purpose: Defines the data structure and validation rules for user accounts in the system.
 * This Mongoose schema handles user authentication, profile information, and account management.
 * 
 * Key Responsibilities:
 * - Define user fields with validation rules
 * - Implement password hashing with bcrypt
 * - Provide password comparison methods
 * - Handle account lockout for security
 * - Track user statistics and preferences
 * 
 * Why this exists: Every user-based application needs a robust user model that handles
 * authentication securely, validates input data, and provides necessary user management
 * functionality. This model serves as the foundation for the entire user system.
 */

const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: [true, "First name is required"],
        trim: true, 
        minlength: [2, "First name must be at least 2 characters long"],
        maxlength: [50, "First name cannot exceed 50 characters"]
    },
    
    lastname: {
        type: String,
        required: [true, "Last name is required"],
        trim: true,
        minlength: [2, "Last name must be at least 2 characters long"],
        maxlength: [50, "Last name cannot exceed 50 characters"]
    },
    
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true, 
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            "Please enter a valid email address"
        ]
    },
    
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters long"]
    },
    
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
        required: true
    },
    
    profile: {
        bio: {
            type: String,
            maxlength: [500, "Bio cannot exceed 500 characters"]
        },
        institution: {
            type: String,
            maxlength: [100, "Institution name cannot exceed 100 characters"]
        },
        country: {
            type: String,
            maxlength: [50, "Country name cannot exceed 50 characters"]
        }
    },
    
    stats: {
        problemsSolved: {
            type: Number,
            default: 0
        },
        contestsParticipated: {
            type: Number,
            default: 0
        },
        rating: {
            type: Number,
            default: 1200
        }
    },
    
    isActive: {
        type: Boolean,
        default: true
    },
    
}, {
    timestamps: true 
});

// Add bcrypt for password hashing
const bcrypt = require('bcryptjs');

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        this.password = await bcrypt.hash(this.password, 12);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Increment login attempts
userSchema.methods.incLoginAttempts = async function() {
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { lockUntil: 1, loginAttempts: 1 }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = {
            lockUntil: Date.now() + 2 * 60 * 60 * 1000 // Lock for 2 hours
        };
    }
    
    return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = async function() {
    return this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 }
    });
};

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model("User", userSchema);
