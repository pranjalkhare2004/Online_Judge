/**
 * USER NOTIFICATION ROUTES
 * 
 * DESCRIPTION:
 * This file handles user-facing notification operations including fetching,
 * marking as read, and managing user notifications. Used by frontend to
 * display notifications and update notification status.
 * 
 * ROUTES:
 * - GET /api/notifications: Get user notifications
 * - PUT /api/notifications/:id/read: Mark notification as read
 * - PUT /api/notifications/mark-all-read: Mark all notifications as read
 * - GET /api/notifications/unread-count: Get unread notification count
 * - DELETE /api/notifications/:id: Delete notification
 * 
 * EXPORTS:
 * - router: Express router with notification routes
 * 
 * USED BY:
 * - routes/index.js: Main API router
 * 
 * DEPENDENCIES:
 * - models/Notification.js: Notification operations
 */

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Notification = require('../models/Notification');

const router = express.Router();

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, unreadOnly = false } = req.query;
    
    const result = await Notification.getUserNotifications(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      unreadOnly: unreadOnly === 'true'
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count for user
 * @access  Private
 */
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user.id);
    
    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findOne({
      _id: id,
      userId: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.markAsRead();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/notifications/mark-all-read
 * @desc    Mark all notifications as read for user
 * @access  Private
 */
router.put('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const { type } = req.body; // Optional: only mark specific type as read
    
    const result = await Notification.markAllAsRead(req.user.id, type);

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/notifications/types
 * @desc    Get available notification types and counts
 * @access  Private
 */
router.get('/types', authenticateToken, async (req, res) => {
  try {
    const typeCounts = await Notification.aggregate([
      { $match: { userId: req.user.id } },
      {
        $group: {
          _id: '$type',
          total: { $sum: 1 },
          unread: {
            $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] }
          }
        }
      }
    ]);

    const types = typeCounts.reduce((acc, item) => {
      acc[item._id] = {
        total: item.total,
        unread: item.unread
      };
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: { types }
    });
  } catch (error) {
    console.error('Get notification types error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification types',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
