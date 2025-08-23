// ONLINE-JUDGE-FRONTEND/hooks/use-submission-polling.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api';

// Global registry to prevent multiple polling instances for the same submission
const activePollers = new Map<string, boolean>();
// Global registry to track completed submissions - once completed, never poll again
const completedSubmissions = new Set<string>();

interface SubmissionStatus {
  _id: string;
  status: 'Pending' | 'Running' | 'ACCEPTED' | 'REJECTED' | 'Time Limit Exceeded' | 'Memory Limit Exceeded' | 'Runtime Error' | 'Compilation Error';
  executionTime?: number;
  memoryUsed?: number;
  testCaseResults?: Array<{
    passed: boolean;
    executionTime: number;
    memoryUsed: number;
    error?: string;
  }>;
  errorMessage?: string;
}

interface UseSubmissionPollingOptions {
  submissionId: string;
  onStatusUpdate?: (submission: SubmissionStatus) => void;
  onComplete?: (submission: SubmissionStatus) => void;
  pollInterval?: number;
  maxPollingTime?: number;
  enabled?: boolean;
}

interface UseSubmissionPollingResult {
  submission: SubmissionStatus | null;
  isPolling: boolean;
  error: string | null;
  startPolling: () => void;
  stopPolling: () => void;
}

export const useSubmissionPolling = (options: UseSubmissionPollingOptions): UseSubmissionPollingResult => {
  const {
    submissionId,
    onStatusUpdate,
    onComplete,
    pollInterval = 2000, // Poll every 2 seconds
    maxPollingTime = 60000, // Stop polling after 1 minute
    enabled = true
  } = options;

  const [submission, setSubmission] = useState<SubmissionStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    console.log(`[SubmissionPolling] FORCE STOPPING polling for submission ${submissionId}`);
    setIsPolling(false);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    startTimeRef.current = null;
    activePollers.delete(submissionId);
    // Mark as completed to prevent future polling attempts
    completedSubmissions.add(submissionId);
  }, [submissionId]);

  const fetchSubmissionStatus = useCallback(async () => {
    try {
      const response = await apiClient.get(`/submissions/${submissionId}`);
      
      if (response.data.success) {
        const submissionData = response.data.data;
        setSubmission(submissionData);
        setError(null);
        
        // Call status update callback
        if (onStatusUpdate) {
          onStatusUpdate(submissionData);
        }
        
        // Check if submission is complete (no longer pending or running)
        const completedStatuses = ['ACCEPTED', 'REJECTED', 'Time Limit Exceeded', 'Memory Limit Exceeded', 'Runtime Error', 'Compilation Error'];
        const isComplete = completedStatuses.includes(submissionData.status);
        
        if (isComplete) {
          console.log(`[SubmissionPolling] Submission ${submissionId} completed with status: ${submissionData.status}`);
          // Stop polling immediately
          stopPolling();
          
          if (onComplete) {
            onComplete(submissionData);
          }
        }
        
        return isComplete; // Return completion status
      } else {
        throw new Error(response.data.message || 'Failed to fetch submission status');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching submission status:', err);
      return false;
    }
  }, [submissionId, onStatusUpdate, onComplete, stopPolling]);

  const startPolling = useCallback(() => {
    // AGGRESSIVE CHECK: Never poll completed submissions
    if (completedSubmissions.has(submissionId)) {
      console.log(`[SubmissionPolling] Submission ${submissionId} is already completed, refusing to poll`);
      return;
    }
    
    if (!enabled || isPolling) {
      console.log(`[SubmissionPolling] Skipping start for ${submissionId}: enabled=${enabled}, isPolling=${isPolling}`);
      return;
    }
    
    // Check global registry to prevent duplicate pollers
    if (activePollers.get(submissionId)) {
      console.log(`[SubmissionPolling] Another instance already polling ${submissionId}, skipping`);
      return;
    }
    
    console.log(`[SubmissionPolling] Starting polling for submission ${submissionId}`);
    activePollers.set(submissionId, true);
    setIsPolling(true);
    setError(null);
    startTimeRef.current = Date.now();
    
    // Immediate fetch
    fetchSubmissionStatus().then((isComplete) => {
      if (isComplete) {
        console.log(`[SubmissionPolling] Submission ${submissionId} already complete on start`);
        completedSubmissions.add(submissionId);
        activePollers.delete(submissionId);
        setIsPolling(false);
        return;
      }
      
      console.log(`[SubmissionPolling] Starting interval for ${submissionId} every ${pollInterval}ms`);
      // Start polling interval
      pollIntervalRef.current = setInterval(async () => {
        // Double-check if submission was completed by another instance
        if (completedSubmissions.has(submissionId)) {
          console.log(`[SubmissionPolling] Submission ${submissionId} was completed elsewhere, stopping interval`);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setIsPolling(false);
          activePollers.delete(submissionId);
          return;
        }
        
        console.log(`[SubmissionPolling] Polling tick for ${submissionId}`);
        
        // Check if max polling time exceeded
        if (startTimeRef.current && Date.now() - startTimeRef.current > maxPollingTime) {
          console.log(`[SubmissionPolling] Timeout reached for ${submissionId}`);
          setIsPolling(false);
          setError('Polling timeout - submission is taking longer than expected');
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          activePollers.delete(submissionId);
          return;
        }
        
        const isComplete = await fetchSubmissionStatus();
        if (isComplete) {
          console.log(`[SubmissionPolling] FINAL: Submission ${submissionId} completed, marking as done forever`);
          completedSubmissions.add(submissionId);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setIsPolling(false);
          activePollers.delete(submissionId);
        }
      }, pollInterval);
    });
  }, [enabled, isPolling, fetchSubmissionStatus, pollInterval, maxPollingTime, submissionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log(`[SubmissionPolling] Component unmounting, cleaning up ${submissionId}`);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      activePollers.delete(submissionId);
    };
  }, [submissionId]);

  // Auto-start polling when enabled and submissionId changes
  useEffect(() => {
    if (enabled && submissionId && !isPolling) {
      startPolling();
    } else if (!enabled && isPolling) {
      // Stop polling immediately when disabled
      stopPolling();
    }
  }, [enabled, submissionId, startPolling, isPolling, stopPolling]);

  return {
    submission,
    isPolling,
    error,
    startPolling,
    stopPolling
  };
};

export default useSubmissionPolling;
