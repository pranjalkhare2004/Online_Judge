/**
 * ENHANCED REAL-TIME WEBSOCKET SERVICE
 * 
 * Provides real-time updates for submissions, contests, and system events
 * with proper authentication, room management, and error handling.
 */

const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const Submission = require('../models/Submission');
const { submissionQueue } = require('../utils/enhancedSubmissionQueue');

class EnhancedWebSocketService {
  constructor(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws',
      verifyClient: this.verifyClient.bind(this)
    });
    
    this.clients = new Map(); // userId -> Set of WebSocket connections
    this.rooms = new Map(); // roomId -> Set of WebSocket connections
    
    this.setupEventHandlers();
    this.startHeartbeat();
    
    console.log('🔌 Enhanced WebSocket service initialized');
  }
  
  /**
   * Verify client authentication
   */
  verifyClient(info) {
    try {
      const url = new URL(info.req.url, 'http://localhost');
      const token = url.searchParams.get('token');
      
      if (!token) {
        console.log('❌ WebSocket connection rejected: No token provided');
        return false;
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      info.req.user = decoded;
      
      return true;
    } catch (error) {
      console.log('❌ WebSocket connection rejected: Invalid token');
      return false;
    }
  }
  
  /**
   * Setup WebSocket event handlers
   */
  setupEventHandlers() {
    this.wss.on('connection', (ws, req) => {
      const user = req.user;
      const userId = user.id;
      
      // Initialize connection
      ws.userId = userId;
      ws.rooms = new Set();
      ws.isAlive = true;
      
      // Add to client tracking
      if (!this.clients.has(userId)) {
        this.clients.set(userId, new Set());
      }
      this.clients.get(userId).add(ws);
      
      console.log(`🔗 User ${userId} connected via WebSocket`);
      
      // Send connection confirmation
      this.sendToClient(ws, {
        type: 'connection',
        status: 'connected',
        userId: userId,
        timestamp: new Date().toISOString()
      });
      
      // Handle incoming messages
      ws.on('message', (message) => {
        this.handleMessage(ws, message);
      });
      
      // Handle connection close
      ws.on('close', () => {
        this.handleDisconnection(ws);
      });
      
      // Handle connection errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
        this.handleDisconnection(ws);
      });
      
      // Heartbeat response
      ws.on('pong', () => {
        ws.isAlive = true;
      });
    });
    
    // Listen to submission queue events
    this.setupQueueEventHandlers();
  }
  
  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(ws, message) {
    try {
      const data = JSON.parse(message);
      const { type, payload } = data;
      
      switch (type) {
        case 'join_room':
          this.joinRoom(ws, payload.roomId);
          break;
          
        case 'leave_room':
          this.leaveRoom(ws, payload.roomId);
          break;
          
        case 'subscribe_submission':
          this.subscribeToSubmission(ws, payload.submissionId);
          break;
          
        case 'unsubscribe_submission':
          this.unsubscribeFromSubmission(ws, payload.submissionId);
          break;
          
        case 'ping':
          this.sendToClient(ws, { type: 'pong', timestamp: new Date().toISOString() });
          break;
          
        default:
          this.sendToClient(ws, {
            type: 'error',
            message: 'Unknown message type',
            receivedType: type
          });
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      this.sendToClient(ws, {
        type: 'error',
        message: 'Invalid message format'
      });
    }
  }
  
  /**
   * Handle client disconnection
   */
  handleDisconnection(ws) {
    const userId = ws.userId;
    
    if (userId && this.clients.has(userId)) {
      this.clients.get(userId).delete(ws);
      if (this.clients.get(userId).size === 0) {
        this.clients.delete(userId);
      }
    }
    
    // Remove from all rooms
    ws.rooms.forEach(roomId => {
      if (this.rooms.has(roomId)) {
        this.rooms.get(roomId).delete(ws);
        if (this.rooms.get(roomId).size === 0) {
          this.rooms.delete(roomId);
        }
      }
    });
    
    console.log(`🔌 User ${userId} disconnected from WebSocket`);
  }
  
  /**
   * Join a room for group updates
   */
  joinRoom(ws, roomId) {
    if (!roomId) return;
    
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    
    this.rooms.get(roomId).add(ws);
    ws.rooms.add(roomId);
    
    this.sendToClient(ws, {
      type: 'room_joined',
      roomId: roomId,
      timestamp: new Date().toISOString()
    });
    
    console.log(`👥 User ${ws.userId} joined room: ${roomId}`);
  }
  
  /**
   * Leave a room
   */
  leaveRoom(ws, roomId) {
    if (!roomId) return;
    
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(ws);
      if (this.rooms.get(roomId).size === 0) {
        this.rooms.delete(roomId);
      }
    }
    
    ws.rooms.delete(roomId);
    
    this.sendToClient(ws, {
      type: 'room_left',
      roomId: roomId,
      timestamp: new Date().toISOString()
    });
    
    console.log(`👥 User ${ws.userId} left room: ${roomId}`);
  }
  
  /**
   * Subscribe to submission updates
   */
  subscribeToSubmission(ws, submissionId) {
    if (!submissionId) return;
    
    const roomId = `submission_${submissionId}`;
    this.joinRoom(ws, roomId);
    
    // Send current submission status
    this.sendSubmissionStatus(submissionId, roomId);
  }
  
  /**
   * Unsubscribe from submission updates
   */
  unsubscribeFromSubmission(ws, submissionId) {
    if (!submissionId) return;
    
    const roomId = `submission_${submissionId}`;
    this.leaveRoom(ws, roomId);
  }
  
  /**
   * Send message to specific client
   */
  sendToClient(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(data));
      } catch (error) {
        console.error('Error sending message to client:', error);
      }
    }
  }
  
  /**
   * Send message to all clients of a user
   */
  sendToUser(userId, data) {
    if (this.clients.has(userId)) {
      this.clients.get(userId).forEach(ws => {
        this.sendToClient(ws, data);
      });
    }
  }
  
  /**
   * Send message to all clients in a room
   */
  sendToRoom(roomId, data) {
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).forEach(ws => {
        this.sendToClient(ws, data);
      });
    }
  }
  
  /**
   * Broadcast message to all connected clients
   */
  broadcast(data) {
    this.wss.clients.forEach(ws => {
      this.sendToClient(ws, data);
    });
  }
  
  /**
   * Setup submission queue event handlers
   */
  setupQueueEventHandlers() {
    // Listen for job progress updates
    submissionQueue.on('progress', (job, progress) => {
      const { submissionId } = job.data;
      const roomId = `submission_${submissionId}`;
      
      this.sendToRoom(roomId, {
        type: 'submission_progress',
        submissionId,
        progress,
        timestamp: new Date().toISOString()
      });
    });
    
    // Listen for job completion
    submissionQueue.on('completed', (job, result) => {
      const { submissionId, userId } = job.data;
      const roomId = `submission_${submissionId}`;
      
      this.sendToRoom(roomId, {
        type: 'submission_completed',
        submissionId,
        result,
        timestamp: new Date().toISOString()
      });
      
      // Also send to user directly
      this.sendToUser(userId, {
        type: 'submission_completed',
        submissionId,
        result,
        timestamp: new Date().toISOString()
      });
    });
    
    // Listen for job failures
    submissionQueue.on('failed', (job, err) => {
      const { submissionId, userId } = job.data;
      const roomId = `submission_${submissionId}`;
      
      this.sendToRoom(roomId, {
        type: 'submission_failed',
        submissionId,
        error: err.message,
        timestamp: new Date().toISOString()
      });
      
      // Also send to user directly
      this.sendToUser(userId, {
        type: 'submission_failed',
        submissionId,
        error: err.message,
        timestamp: new Date().toISOString()
      });
    });
  }
  
  /**
   * Send current submission status
   */
  async sendSubmissionStatus(submissionId, roomId) {
    try {
      const submission = await Submission.findById(submissionId)
        .select('status progress executionTime memoryUsed score passedTests totalTests')
        .lean();
      
      if (submission) {
        this.sendToRoom(roomId, {
          type: 'submission_status',
          submissionId,
          status: submission.status,
          progress: submission.progress || 0,
          executionTime: submission.executionTime,
          memoryUsed: submission.memoryUsed,
          score: submission.score,
          passedTests: submission.passedTests,
          totalTests: submission.totalTests,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error sending submission status:', error);
    }
  }
  
  /**
   * Start heartbeat to detect disconnected clients
   */
  startHeartbeat() {
    setInterval(() => {
      this.wss.clients.forEach(ws => {
        if (!ws.isAlive) {
          console.log(`💔 Terminating dead connection for user ${ws.userId}`);
          return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds
  }
  
  /**
   * Get service statistics
   */
  getStats() {
    return {
      totalConnections: this.wss.clients.size,
      uniqueUsers: this.clients.size,
      activeRooms: this.rooms.size,
      uptime: process.uptime()
    };
  }
  
  /**
   * Send system notification to all users
   */
  sendSystemNotification(message, type = 'info') {
    this.broadcast({
      type: 'system_notification',
      message,
      notificationType: type,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Send contest updates
   */
  sendContestUpdate(contestId, update) {
    const roomId = `contest_${contestId}`;
    this.sendToRoom(roomId, {
      type: 'contest_update',
      contestId,
      update,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Send leaderboard updates
   */
  sendLeaderboardUpdate(contestId, leaderboard) {
    const roomId = `contest_${contestId}`;
    this.sendToRoom(roomId, {
      type: 'leaderboard_update',
      contestId,
      leaderboard,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = EnhancedWebSocketService;
