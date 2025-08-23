/**
 * Utility functions for formatting execution time and memory usage
 */

export function formatExecutionTime(timeMs?: number): string {
  if (!timeMs) return '-';
  
  // Round to nearest millisecond for very small values
  if (timeMs < 1000) {
    return `${Math.round(timeMs)}ms`;
  }
  
  // Convert to seconds for larger values (1000ms = 1s)
  const seconds = timeMs / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(2)}s`;
  }
  
  // Convert to minutes for very large values (unlikely but just in case)
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds.toFixed(1)}s`;
}

export function formatMemoryUsage(memoryKB?: number): string {
  if (!memoryKB) return '-';
  
  // Show in KB for values less than 1024KB
  if (memoryKB < 1024) {
    return `${Math.round(memoryKB)}KB`;
  }
  
  // Convert to MB for larger values
  const memoryMB = memoryKB / 1024;
  if (memoryMB < 1024) {
    return `${memoryMB.toFixed(1)}MB`;
  }
  
  // Convert to GB for very large values (unlikely but just in case)
  const memoryGB = memoryMB / 1024;
  return `${memoryGB.toFixed(2)}GB`;
}

// Alternative shorter format for execution time (always in ms)
export function formatExecutionTimeShort(timeMs?: number): string {
  if (!timeMs) return '-';
  return `${Math.round(timeMs)}ms`;
}
