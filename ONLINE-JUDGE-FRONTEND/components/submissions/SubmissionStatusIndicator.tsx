// ONLINE-JUDGE-FRONTEND/components/submissions/SubmissionStatusIndicator.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Submission } from '@/lib/api-client';
import enhancedApiClient from '@/lib/enhanced-api-client';
import { showErrorToast, showSuccessToast } from '@/lib/toast-utils';
import { formatExecutionTimeShort, formatMemoryUsage } from '@/lib/format-utils';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2, 
  AlertTriangle,
  MemoryStick,
  Timer,
  Code2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubmissionStatusIndicatorProps {
  submissionId: string;
  initialStatus?: string;
  showDetails?: boolean;
  showProgress?: boolean;
  autoRefresh?: boolean;
  onStatusChange?: (status: string, submission: Submission) => void;
  className?: string;
}

export const SubmissionStatusIndicator: React.FC<SubmissionStatusIndicatorProps> = ({
  submissionId,
  initialStatus = 'Pending',
  showDetails = true,
  showProgress = false,
  autoRefresh = true,
  onStatusChange,
  className
}) => {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const componentId = useRef(Math.random().toString(36).substr(2, 9));

  // Check if status is final (no more tracking needed)
  const isFinalState = (status: string) => {
    const finalStates = [
      'Accepted', 'Wrong Answer', 'Runtime Error', 'Compilation Error', 
      'Time Limit Exceeded', 'Memory Limit Exceeded', 'ACCEPTED', 'REJECTED'
    ];
    return finalStates.includes(status);
  };

  console.log(`[SubmissionStatusIndicator-${componentId.current}] Initialized for submission ${submissionId}, initial status: ${initialStatus}, autoRefresh: ${autoRefresh}, isFinal: ${isFinalState(initialStatus)}`);

  // Track submission updates
  useEffect(() => {
    const compId = componentId.current; // Capture ref value for cleanup
    let cleanup: (() => void) | null = null;
    let isCleanedUp = false;

    const performCleanup = () => {
      if (!isCleanedUp && cleanup) {
        console.log(`[SubmissionStatusIndicator-${compId}] Performing cleanup for submission ${submissionId}`);
        cleanup();
        cleanup = null;
        isCleanedUp = true;
      }
    };

    // Don't track if autoRefresh is disabled, no submissionId, or status is already final
    const shouldInitializeTracking = autoRefresh && submissionId && !isFinalState(currentStatus);
    
    console.log(`[SubmissionStatusIndicator-${compId}] Initialize tracking check - autoRefresh: ${autoRefresh}, submissionId: ${!!submissionId}, currentStatus: ${currentStatus}, isFinal: ${isFinalState(currentStatus)}, shouldInitialize: ${shouldInitializeTracking}`);

    if (shouldInitializeTracking) {
      // Only track submissions that are still processing
      const shouldTrack = ['Pending', 'Running', 'PENDING', 'RUNNING'].includes(currentStatus);
      
      console.log(`[SubmissionStatusIndicator-${compId}] Should track: ${shouldTrack}, current status: ${currentStatus}`);
      
      if (shouldTrack) {
        cleanup = enhancedApiClient.trackSubmission(submissionId, (message) => {
          // Don't process if already cleaned up
          if (isCleanedUp) {
            console.log(`[SubmissionStatusIndicator-${compId}] Ignoring message, already cleaned up`);
            return;
          }
          
          console.log(`[SubmissionStatusIndicator-${compId}] Received message:`, message);
          
          // Handle both old format (direct submission) and new format (WebSocket message)
          let updatedSubmission;
          let newStatus;
          
          if (message.type && (message.type === 'submission_status' || message.type === 'submission_completed')) {
            // New WebSocket message format
            newStatus = message.status;
            updatedSubmission = message.result || { 
              id: submissionId, 
              status: newStatus,
              progress: message.progress || 0
            };
          } else {
            // Old format - direct submission object
            updatedSubmission = message;
            newStatus = updatedSubmission.status;
          }
          
          console.log(`[SubmissionStatusIndicator-${compId}] Status update: ${currentStatus} -> ${newStatus}`);
          
          setSubmission(updatedSubmission);
          setCurrentStatus(newStatus);

          // Notify parent component
          if (onStatusChange) {
            onStatusChange(newStatus, updatedSubmission);
          }

          // Show completion toast for final states (only once)
          const finalStates = [
            'Accepted', 'Wrong Answer', 'Runtime Error', 'Compilation Error', 
            'Time Limit Exceeded', 'Memory Limit Exceeded', 'ACCEPTED', 'REJECTED'
          ];
          
          if (finalStates.includes(newStatus)) {
            console.log(`[SubmissionStatusIndicator-${compId}] Final state ${newStatus} reached, calling immediate cleanup`);
            
            if (newStatus === 'Accepted' || newStatus === 'ACCEPTED') {
              showSuccessToast('Solution Accepted! 🎉');
            } else {
              showErrorToast(`Submission ${newStatus}`);
            }
            
            // IMPORTANT: Clean up tracking immediately when reaching final state
            performCleanup();
          }
        });
        
        console.log(`[SubmissionStatusIndicator-${compId}] Started tracking submission ${submissionId}`);
      } else {
        console.log(`[SubmissionStatusIndicator-${compId}] Not tracking - shouldTrack: ${shouldTrack}, autoRefresh: ${autoRefresh}, isFinal: ${isFinalState(currentStatus)}`);
      }
    } else {
      console.log(`[SubmissionStatusIndicator-${compId}] Not tracking - autoRefresh: ${autoRefresh}, submissionId: ${submissionId}, isFinal: ${isFinalState(currentStatus)}`);
    }

    return () => {
      console.log(`[SubmissionStatusIndicator-${compId}] Effect cleanup called for submission ${submissionId}`);
      performCleanup();
    };
  }, [submissionId, currentStatus, autoRefresh, onStatusChange]);

  // Initial load
  useEffect(() => {
    const loadSubmission = async () => {
      if (!submissionId) return;
      
      try {
        const response = await enhancedApiClient.getSubmission(submissionId);
        if (response.success && response.data) {
          setSubmission(response.data);
          setCurrentStatus(response.data.status);
          console.log(`[SubmissionStatusIndicator-${componentId.current}] Initial load - submission ${submissionId}, status: ${response.data.status}`);
        } else {
          console.error('Failed to load submission - response not successful:', response);
          showErrorToast('Failed to load submission status');
        }
      } catch (error) {
        console.error('Failed to load submission:', error);
        showErrorToast('Failed to load submission status');
      }
    };

    loadSubmission();
  }, [submissionId]);
  useEffect(() => {
    if (submission) {
      setCurrentStatus(submission.status);
    }
  }, [submission]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'REJECTED':
      case 'Wrong Answer':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'Time Limit Exceeded':
        return <Timer className="h-4 w-4 text-orange-600" />;
      case 'Memory Limit Exceeded':
        return <MemoryStick className="h-4 w-4 text-purple-600" />;
      case 'Runtime Error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'Compilation Error':
        return <Code2 className="h-4 w-4 text-red-600" />;
      case 'Running':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'Pending':
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED':
      case 'Wrong Answer':
      case 'Runtime Error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Time Limit Exceeded':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Memory Limit Exceeded':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Compilation Error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Running':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Pending':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusMessage = (status: string, submission?: Submission) => {
    const executionTime = submission?.executionTime ? formatExecutionTimeShort(submission.executionTime) : '';
    const memoryUsed = submission?.memoryUsed ? formatMemoryUsage(submission.memoryUsed) : '';
    
    switch (status) {
      case 'ACCEPTED':
        return `Solution accepted! ${executionTime ? `Executed in ${executionTime}` : ''}${memoryUsed ? `, Memory: ${memoryUsed}` : ''}`;
      case 'REJECTED':
      case 'Wrong Answer':
        return 'Your solution produced incorrect output. Please check your logic.';
      case 'Time Limit Exceeded':
        return 'Your solution took too long to execute. Try optimizing your algorithm.';
      case 'Memory Limit Exceeded':
        return 'Your solution used too much memory. Try optimizing memory usage.';
      case 'Runtime Error':
        return 'Your solution encountered a runtime error during execution.';
      case 'Compilation Error':
        return 'Your code failed to compile. Please check for syntax errors.';
      case 'Running':
        return 'Your solution is being evaluated...';
      case 'Pending':
        return 'Your submission is queued for evaluation.';
      default:
        return 'Unknown status';
    }
  };

  const isProcessing = currentStatus === 'Pending' || currentStatus === 'Running';

  return (
    <div className={cn('space-y-2', className)}>
      {/* Main Status Badge */}
      <div className="flex items-center gap-2">
        <Badge 
          variant="outline" 
          className={cn(
            'flex items-center gap-2 px-3 py-1',
            getStatusColor(currentStatus)
          )}
        >
          {getStatusIcon(currentStatus)}
          <span className="font-medium">
            {currentStatus === 'ACCEPTED' ? 'Accepted' : 
             currentStatus === 'REJECTED' ? 'Rejected' : 
             currentStatus}
          </span>
        </Badge>
        
        {/* Real-time indicator */}
        {autoRefresh && isProcessing && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
            <span>Live</span>
          </div>
        )}
      </div>

      {/* Progress Bar for Processing */}
      {showProgress && isProcessing && (
        <div className="space-y-1">
          <Progress 
            value={currentStatus === 'Running' ? 70 : 30} 
            className="h-2"
          />
          <p className="text-xs text-gray-500">
            {currentStatus === 'Running' ? 'Executing code...' : 'Queued for execution...'}
          </p>
        </div>
      )}

      {/* Details */}
      {showDetails && submission && (
        <div className="text-xs text-gray-600 space-y-1">
          <p>{getStatusMessage(currentStatus, submission)}</p>
          
          {/* Performance Metrics */}
          {submission.executionTime && submission.memoryUsed && (
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <Timer className="h-3 w-3" />
                <span>{submission.executionTime}ms</span>
              </div>
              <div className="flex items-center gap-1">
                <MemoryStick className="h-3 w-3" />
                <span>{Math.round(submission.memoryUsed / 1024)}KB</span>
              </div>
            </div>
          )}
          
          {/* Test Cases Summary */}
          {submission.testCaseResults && submission.testCaseResults.length > 0 && (
            <p className="text-xs">
              {submission.testCaseResults.filter(tc => tc.passed).length}/{submission.testCaseResults.length} test cases passed
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SubmissionStatusIndicator;
