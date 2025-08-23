import { toast } from '@/hooks/use-toast'

// Helper functions for different toast types
export const showSuccessToast = (title: string, description?: string) => {
  toast({
    title,
    description,
    variant: 'success',
  })
}

export const showErrorToast = (title: string, description?: string) => {
  toast({
    title,
    description,
    variant: 'destructive',
  })
}

export const showWarningToast = (title: string, description?: string) => {
  toast({
    title,
    description,
    variant: 'warning',
  })
}

export const showInfoToast = (title: string, description?: string) => {
  toast({
    title,
    description,
    variant: 'info',
  })
}

// Specific toast messages for common actions
export const showSubmissionToasts = {
  executing: () => showInfoToast('Code Executing', 'Your code is being executed...'),
  success: (status: string) => showSuccessToast('Submission Complete', `Status: ${status}`),
  error: (error: string) => showErrorToast('Submission Failed', error),
  timeout: () => showWarningToast('Execution Timeout', 'Your code took too long to execute'),
  compilationError: () => showErrorToast('Compilation Error', 'There was an error compiling your code'),
}

export const showAuthToasts = {
  loginSuccess: (username: string) => showSuccessToast('Login Successful', `Welcome back, ${username}!`),
  loginError: () => showErrorToast('Login Failed', 'Invalid credentials. Please try again.'),
  logoutSuccess: () => showInfoToast('Logged Out', 'You have been successfully logged out'),
  registrationSuccess: () => showSuccessToast('Registration Successful', 'Your account has been created!'),
  registrationError: (error: string) => showErrorToast('Registration Failed', error),
  sessionExpired: () => showWarningToast('Session Expired', 'Please log in again to continue'),
}

export const showNetworkToasts = {
  connectionError: () => showErrorToast('Connection Error', 'Please check your internet connection'),
  serverError: () => showErrorToast('Server Error', 'Something went wrong. Please try again later.'),
  loadingError: (resource: string) => showErrorToast('Loading Error', `Failed to load ${resource}. Please refresh the page.`),
}
