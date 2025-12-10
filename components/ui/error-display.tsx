import { Button } from "@/components/ui/button"
import { ReactNode } from "react"

interface ErrorDisplayProps {
  title: string
  message?: string
  variant?: "page" | "card"
  action?: {
    label: string
    onClick: () => void
    icon?: ReactNode
  }
  secondaryAction?: {
    label: string
    onClick: () => void
    icon?: ReactNode
  }
}

export function ErrorDisplay({ 
  title, 
  message, 
  variant = "page", 
  action,
  secondaryAction 
}: ErrorDisplayProps) {
  if (variant === "card") {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
          <svg className="h-8 w-8 text-red-600 dark:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-center space-y-2">
          <p className="font-semibold text-foreground">{title}</p>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </div>
        {action && (
          <Button variant="default" onClick={action.onClick} className="mt-2">
            {action.icon}
            {action.label}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-8rem)] p-4 md:p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <svg className="h-10 w-10 text-red-600 dark:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          {message && <p className="text-muted-foreground">{message}</p>}
        </div>
        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {secondaryAction && (
              <Button variant="outline" onClick={secondaryAction.onClick}>
                {secondaryAction.icon}
                {secondaryAction.label}
              </Button>
            )}
            {action && (
              <Button variant="default" onClick={action.onClick} className="w-full sm:w-auto">
                {action.icon}
                {action.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

