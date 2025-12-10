import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps {
  message?: string
  variant?: "page" | "card"
}

export function LoadingSpinner({ message = "Loading...", variant = "page" }: LoadingSpinnerProps) {
  if (variant === "card") {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <span className="text-sm text-muted-foreground">{message}</span>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

