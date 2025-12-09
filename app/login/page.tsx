"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // Client-side validation
    if (!email.trim()) {
      setError("Please enter your email address")
      return
    }
    
    if (!password) {
      setError("Please enter your password")
      return
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        // Provide user-friendly error messages
        if (signInError.message.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please try again.")
        } else if (signInError.message.includes("Email not confirmed")) {
          setError("Please verify your email address before logging in.")
        } else {
          setError(signInError.message)
        }
        setLoading(false)
        return
      }

      if (data.session) {
        // Success - redirect to dashboard
        router.push("/dashboard")
        router.refresh()
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Login error:", err)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,hsl(var(--background))_0%,hsl(var(--muted))_50%,hsl(var(--accent))_100%)] p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-md shadow-lg border-border/50 backdrop-blur-sm">
        <CardHeader className="space-y-3 pb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BarChart3 className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
            <span className="text-xl sm:text-2xl font-bold">SEO Reporting</span>
          </div>
          <CardTitle className="text-xl sm:text-2xl text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center text-sm sm:text-base">
            Sign in to your Corominas Consulting dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="animate-in fade-in-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError(null) // Clear error on input change
                }}
                required
                disabled={loading}
                autoComplete="email"
                className="h-11 text-base"
                aria-invalid={error ? "true" : "false"}
                aria-describedby={error ? "login-error" : undefined}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError(null) // Clear error on input change
                  }}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  className="h-11 pr-11 text-base"
                  aria-invalid={error ? "true" : "false"}
                  aria-describedby={error ? "login-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer p-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 text-base font-medium cursor-pointer" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
