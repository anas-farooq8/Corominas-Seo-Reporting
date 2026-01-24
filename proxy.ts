import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect dashboard routes - require admin access
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }

    // Check if user is admin using RPC function
    const { data: isAdmin, error: adminCheckError } = await supabase.rpc('is_admin')

    if (adminCheckError || !isAdmin) {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("error", "not_admin")
      return NextResponse.redirect(url)
    }
  }

  // Redirect to dashboard if already logged in as admin and trying to access login
  if (request.nextUrl.pathname === "/login") {
    if (user) {
      // Check if user is admin before redirecting
      const { data: isAdmin } = await supabase.rpc('is_admin')
      if (isAdmin) {
        const url = request.nextUrl.clone()
        url.pathname = "/dashboard"
        return NextResponse.redirect(url)
      }
      // If not admin, let them stay on login page (don't redirect)
    }
  }

  // Redirect root to dashboard or login based on user and admin status
  if (request.nextUrl.pathname === "/") {
    if (user) {
      // Check if user is admin before redirecting to dashboard
      const { data: isAdmin } = await supabase.rpc('is_admin')
      const url = request.nextUrl.clone()
      url.pathname = isAdmin ? "/dashboard" : "/login"
      return NextResponse.redirect(url)
    } else {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

