import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * Authenticate user and return supabase client
 * Returns null if authentication fails (response is sent)
 */
export async function authenticateRequest(): Promise<
  { supabase: Awaited<ReturnType<typeof createClient>>; userId: string } | null
> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  return { supabase, userId: user.id }
}

/**
 * Create unauthorized response
 */
export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

/**
 * Create error response
 */
export function errorResponse(error: unknown, defaultMessage: string, status = 500) {
  const message = error instanceof Error ? error.message : defaultMessage
  console.error(defaultMessage, error)
  return NextResponse.json({ error: message }, { status })
}

/**
 * Require authentication - throws an error if not authenticated
 */
export async function requireAuth() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  return { supabase, userId: user.id }
}
