/**
 * AUTHENTICATION MIDDLEWARE
 * 
 * Purpose: Provides middleware functions to protect API routes and verify user
 * authentication and authorization. This module ensures that only authenticated
 * and authorized users can access protected resources.
 * 
 * Key Responsibilities:
 * - Verify JWT tokens from requests (header or cookies)
 * - Authenticate users and attach user data to requests
 * - Check user permissions and roles (admin, user)
 * - Validate account status (active/deactivated)
 * - Provide role-based access control
 * 
 * Why this exists: API endpoints need protection to ensure security and proper
 * access control. This middleware provides reusable authentication and authorization
 * logic that can be applied to any route that requires user verification.
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "") || req.cookies.token;
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided."
            });
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY || process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid token. User not found."
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: "Account is deactivated."
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Token verification error:", error);
        res.status(401).json({
            success: false,
            message: "Invalid token."
        });
    }
};

// Middleware to check if user is admin
const verifyAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }

        if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin privileges required."
            });
        }

        next();
    } catch (error) {
        console.error("Admin verification error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error during authorization."
        });
    }
};

// Middleware to check if user is admin or accessing their own data
const verifyAdminOrSelf = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }

        const isAdmin = req.user.role === "admin";
        const isOwner = req.user._id.toString() === req.params.userId;

        if (!isAdmin && !isOwner) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You can only access your own data."
            });
        }

        next();
    } catch (error) {
        console.error("Authorization error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error during authorization."
        });
    }
};

module.exports = {
    verifyToken,
    authenticate: verifyToken, // Alias for backward compatibility
    verifyAdmin,
    requireAdmin: verifyAdmin, // Alias for backward compatibility
    verifyAdminOrSelf
};
