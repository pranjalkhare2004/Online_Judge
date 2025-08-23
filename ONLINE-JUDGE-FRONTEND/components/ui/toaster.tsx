"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react"

const getToastIcon = (variant: string | undefined) => {
  switch (variant) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
    case 'destructive':
      return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
    case 'info':
      return <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
    default:
      return <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
  }
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start space-x-3 flex-1">
              {getToastIcon(variant)}
              <div className="flex-1 space-y-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
