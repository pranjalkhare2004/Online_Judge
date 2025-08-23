/**
 * ENHANCED ONLINE JUDGE API CLIENT v2.0
 * 
 * Comprehensive API client with WebSocket integration, real-time communication,
 * automatic token refresh, and proper error handling for the Online Judge platform.
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import Cookies from 'js-cookie';

// API Response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  errors?: any[];
}

export interface SubmissionResult {
  submissionId: string;
  status: string;
  problemTitle: string;
  language: string;
  submittedAt: string;
}

export interface ExecutionResult {
  results: TestResult[];
  totalTests: number;
  passedTests: number;
  executionTime: number;
  memoryUsed: number;
  overallResult: string;
  compilationError?: string;
}

export interface TestResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  executionTime: number;
  memoryUsed: number;
  error?: string;
}

export interface Problem {
  _id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  testCases: TestCase[];
  constraints: string;
  examples: Example[];
  totalSubmissions: number;
  acceptedSubmissions: number;
  acceptanceRate: number;
  timeLimit: number;
  memoryLimit: number;
  userStats?: {
    hasSubmitted: boolean;
    isAccepted: boolean;
    submissionCount: number;
    lastSubmission?: string;
  };
}

export interface TestCase {
  input: string;
  expectedOutput: string;
}

export interface Example {
  input: string;
  output: string;
  explanation?: string;
}

export interface Submission {
  _id: string;
  userId: string;
  problemId: Problem;
  code: string;
  language: string;
  status: string;
  executionTime?: number;
  memoryUsed?: number;
  score?: number;
  passedTests?: number;
  totalTests?: number;
  testResults?: TestResult[];
  submittedAt: string;
  completedAt?: string;
  progress?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface WebSocketMessage {
  type: string;
  submissionId?: string;
  status?: string;
  progress?: number;
  result?: any;
  error?: string;
  timestamp: string;
}

class EnhancedOnlineJudgeAPI {
  private client: AxiosInstance;
  private ws: WebSocket | null = null;
  private wsReconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private wsReconnectDelay = 1000;
  private submissionCallbacks: Map<string, (message: WebSocketMessage) => void> = new Map();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup axios interceptors for automatic token handling and retry logic
   */
  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        // Use the same token storage mechanism as the main auth system
        let token = null;
        if (typeof window !== 'undefined') {
          // Try cookies first, then localStorage (same as main API client)
          token = Cookies.get('accessToken') || localStorage.getItem('accessToken');
        }
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh and error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Handle 401 errors (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await this.refreshAuthToken(refreshToken);
              if (response.success) {
                return this.client(originalRequest);
              }
            }
          } catch (refreshError) {
            this.handleAuthenticationError();
            return Promise.reject(refreshError);
          }
        }

        // Handle network errors with retry logic
        if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
          if (!originalRequest._retryCount) {
            originalRequest._retryCount = 0;
          }

          if (originalRequest._retryCount < 3) {
            originalRequest._retryCount++;
            const delay = Math.pow(2, originalRequest._retryCount) * 1000;
            
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.client(originalRequest);
          }
        }

        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  /**
   * Normalize error responses for consistent error handling
   */
  private normalizeError(error: AxiosError): Error & { status?: number; code?: string } {
    const normalizedError = new Error() as Error & { status?: number; code?: string };

    if (error.response) {
      const data = error.response.data as any;
      normalizedError.message = data.message || 'An error occurred';
      normalizedError.status = error.response.status;
      normalizedError.code = data.code;
    } else if (error.request) {
      normalizedError.message = 'Network error - please check your connection';
      normalizedError.code = 'NETWORK_ERROR';
    } else {
      normalizedError.message = error.message || 'An unexpected error occurred';
    }

    return normalizedError;
  }

  /**
   * Handle authentication errors by clearing tokens and redirecting
   */
  private handleAuthenticationError(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/auth';
    }
  }

  /**
   * Refresh authentication token
   */
  private async refreshAuthToken(refreshToken: string): Promise<ApiResponse> {
    try {
      const response = await axios.post(`${this.client.defaults.baseURL}/auth/tokens/refresh`, {
        refreshToken
      });

      if (response.data.success) {
        localStorage.setItem('authToken', response.data.data.accessToken);
        if (response.data.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.data.refreshToken);
        }
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Initialize WebSocket connection for real-time updates
   */
  public initializeWebSocket(): void {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('authToken');
    if (!token) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000/ws';
    
    try {
      this.ws = new WebSocket(`${wsUrl}?token=${token}`);

      this.ws.onopen = () => {
        console.log('🔌 WebSocket connected');
        this.wsReconnectAttempts = 0;
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        this.stopHeartbeat();
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleWebSocketMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'submission_progress':
      case 'submission_completed':
      case 'submission_failed':
      case 'submission_status':
        if (message.submissionId) {
          const callback = this.submissionCallbacks.get(message.submissionId);
          if (callback) {
            callback(message);
          }
        }
        break;
      
      case 'system_notification':
        this.handleSystemNotification(message);
        break;
        
      case 'pong':
        // Heartbeat response - connection is alive
        break;
        
      default:
        console.log('Unhandled WebSocket message:', message);
    }
  }

  /**
   * Handle system notifications
   */
  private handleSystemNotification(message: WebSocketMessage): void {
    // Dispatch custom event for system notifications
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('systemNotification', {
        detail: message
      }));
    }
  }

  /**
   * Start WebSocket heartbeat
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  /**
   * Stop WebSocket heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Attempt to reconnect WebSocket
   */
  private attemptReconnect(): void {
    if (this.wsReconnectAttempts < this.maxReconnectAttempts) {
      this.wsReconnectAttempts++;
      const delay = this.wsReconnectDelay * Math.pow(2, this.wsReconnectAttempts - 1);
      
      setTimeout(() => {
        console.log(`🔄 Attempting WebSocket reconnection (${this.wsReconnectAttempts}/${this.maxReconnectAttempts})`);
        this.initializeWebSocket();
      }, delay);
    }
  }

  /**
   * Subscribe to submission updates via WebSocket
   */
  public trackSubmission(
    submissionId: string, 
    callback: (message: WebSocketMessage) => void
  ): () => void {
    // Store callback for this submission
    this.submissionCallbacks.set(submissionId, callback);

    // Subscribe via WebSocket if connected
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe_submission',
        payload: { submissionId }
      }));
    } else {
      // Fallback to polling if WebSocket is not available
      this.pollSubmissionStatus(submissionId, callback);
    }

    // Return cleanup function
    return () => {
      this.submissionCallbacks.delete(submissionId);
      
      // Clear any polling interval for this submission
      const pollInterval = this.pollingIntervals.get(submissionId);
      if (pollInterval) {
        clearInterval(pollInterval);
        this.pollingIntervals.delete(submissionId);
      }
      
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'unsubscribe_submission',
          payload: { submissionId }
        }));
      }
    };
  }

  /**
   * Fallback polling for submission updates when WebSocket is unavailable
   */
  private pollSubmissionStatus(submissionId: string, callback: (message: WebSocketMessage) => void): void {
    // Clear any existing polling for this submission
    const existingInterval = this.pollingIntervals.get(submissionId);
    if (existingInterval) {
      console.log(`[EnhancedAPIClient] Clearing existing polling for submission ${submissionId}`);
      clearInterval(existingInterval);
    }

    let pollCount = 0;
    const maxPolls = 150; // Maximum 5 minutes of polling (150 * 2 seconds)
    
    console.log(`[EnhancedAPIClient] Starting polling for submission ${submissionId}`);

    const pollInterval = setInterval(async () => {
      pollCount++;
      console.log(`[EnhancedAPIClient] Poll ${pollCount}/${maxPolls} for submission ${submissionId}`);
      
      // Emergency timeout to prevent infinite polling
      if (pollCount >= maxPolls) {
        console.warn(`[EnhancedAPIClient] Emergency timeout: stopping polling for submission ${submissionId} after ${maxPolls} attempts`);
        clearInterval(pollInterval);
        this.pollingIntervals.delete(submissionId);
        return;
      }
      
      try {
        const response = await this.getSubmission(submissionId);
        if (response.success && response.data) {
          const submission = response.data;
          console.log(`[EnhancedAPIClient] Polled submission ${submissionId}, status: ${submission.status}, poll count: ${pollCount}`);
          
          // Create WebSocket-like message from polling data
          const message: WebSocketMessage = {
            type: 'submission_status',
            submissionId,
            status: submission.status,
            progress: submission.progress || 0,
            timestamp: new Date().toISOString()
          };

          callback(message);

          // Stop polling if submission is complete
          const finalStates = [
            'Accepted', 'Wrong Answer', 'Compilation Error', 'Runtime Error', 
            'Time Limit Exceeded', 'Memory Limit Exceeded', 'System Error',
            'ACCEPTED', 'REJECTED'
          ];
          
          if (finalStates.includes(submission.status)) {
            console.log(`[EnhancedAPIClient] Final state '${submission.status}' reached for submission ${submissionId}, stopping polling after ${pollCount} polls`);
            clearInterval(pollInterval);
            this.pollingIntervals.delete(submissionId);
            
            // Send completion message
            callback({
              ...message,
              type: 'submission_completed',
              result: submission
            });
            return; // Exit immediately
          }
        }
      } catch (error) {
        console.error(`[EnhancedAPIClient] Error polling submission ${submissionId}:`, error);
        callback({
          type: 'submission_failed',
          submissionId,
          error: 'Failed to get submission status',
          timestamp: new Date().toISOString()
        });
        clearInterval(pollInterval);
        this.pollingIntervals.delete(submissionId);
      }
    }, 2000); // Poll every 2 seconds

    // Store interval for cleanup
    this.pollingIntervals.set(submissionId, pollInterval);
    
    // Auto-cleanup after 5 minutes
    setTimeout(() => {
      const interval = this.pollingIntervals.get(submissionId);
      if (interval) {
        clearInterval(interval);
        this.pollingIntervals.delete(submissionId);
      }
    }, 300000);
  }

  // API Methods using enhanced endpoints

  /**
   * Execute code with custom test cases or problemId
   */
  public async executeCode(
    code: string,
    language: string,
    testCases?: TestCase[],
    problemId?: string
  ): Promise<ApiResponse<ExecutionResult>> {
    const requestBody: any = {
      code,
      language
    };
    
    if (problemId) {
      requestBody.problemId = problemId;
    } else if (testCases) {
      requestBody.testCases = testCases;
    }
    
    const response = await this.client.post('/enhanced/execute', requestBody);
    return response.data;
  }

  /**
   * Submit code for a problem
   */
  public async submitSolution(
    problemId: string,
    code: string,
    language: string
  ): Promise<ApiResponse<SubmissionResult>> {
    const response = await this.client.post('/enhanced/submit', {
      problemId,
      code,
      language
    });
    return response.data;
  }

  /**
   * Get submission details
   */
  public async getSubmission(submissionId: string): Promise<ApiResponse<Submission>> {
    const response = await this.client.get(`/enhanced/submission/${submissionId}`);
    return response.data;
  }

  /**
   * Get user submissions with pagination
   */
  public async getUserSubmissions(
    page: number = 1,
    limit: number = 20,
    problemId?: string
  ): Promise<ApiResponse<PaginatedResponse<Submission>>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    
    if (problemId) {
      params.append('problemId', problemId);
    }

    console.log(`[FRONTEND DEBUG] getUserSubmissions - URL: /enhanced/submissions/user?${params}`);
    console.log(`[FRONTEND DEBUG] getUserSubmissions - problemId: ${problemId}`);
    
    const response = await this.client.get(`/enhanced/submissions/user?${params}`);
    
    console.log(`[FRONTEND DEBUG] getUserSubmissions - Response:`, response.data);
    
    return response.data;
  }

  /**
   * Get problems with filtering and pagination
   */
  public async getProblems(
    page: number = 1,
    limit: number = 20,
    difficulty?: string,
    tags?: string[],
    search?: string
  ): Promise<ApiResponse<PaginatedResponse<Problem>>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    
    if (difficulty) params.append('difficulty', difficulty);
    if (tags?.length) params.append('tags', tags.join(','));
    if (search) params.append('search', search);

    const response = await this.client.get(`/enhanced/problems?${params}`);
    return response.data;
  }

  /**
   * Get problem details by slug
   */
  public async getProblem(slug: string): Promise<ApiResponse<Problem>> {
    const response = await this.client.get(`/enhanced/problem/${slug}`);
    return response.data;
  }

  /**
   * Authentication methods
   */
  public async login(email: string, password: string): Promise<ApiResponse> {
    const response = await this.client.post('/auth/login', { email, password });
    
    if (response.data.success) {
      localStorage.setItem('authToken', response.data.data.token);
      if (response.data.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
      }
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      
      // Initialize WebSocket after successful login
      this.initializeWebSocket();
    }
    
    return response.data;
  }

  public async register(userData: any): Promise<ApiResponse> {
    const response = await this.client.post('/auth/register', userData);
    return response.data;
  }

  public async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Close WebSocket connection
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      
      this.stopHeartbeat();
    }
  }

  /**
   * Get current user profile
   */
  public async getProfile(): Promise<ApiResponse> {
    const response = await this.client.get('/user/profile');
    return response.data;
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stopHeartbeat();
    
    // Clear all polling intervals
    this.pollingIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.pollingIntervals.clear();
    
    this.submissionCallbacks.clear();
  }
}

// Create singleton instance
const enhancedApiClient = new EnhancedOnlineJudgeAPI();

export default enhancedApiClient;
