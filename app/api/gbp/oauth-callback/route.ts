import { NextRequest, NextResponse } from "next/server"
import { exchangeCodeForTokens } from "@/lib/google-business-profile/api"

/**
 * OAuth2 callback handler for GBP
 * Exchanges authorization code for tokens and closes the popup window
 * GET /api/gbp/oauth-callback?code=...
 */
export async function GET(request: NextRequest) {
  console.log("[API] GET /api/gbp/oauth-callback")
  
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  // Handle OAuth errors
  if (error) {
    console.error(`[API] OAuth error: ${error}`)
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authorization Failed</title>
        </head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GBP_AUTH_ERROR', error: '${error}' }, '*');
              window.close();
            }
          </script>
          <p>Authorization failed. This window should close automatically.</p>
        </body>
      </html>
      `,
      {
        headers: { "Content-Type": "text/html" },
      }
    )
  }

  // Validate code parameter
  if (!code) {
    console.error("[API] No authorization code provided")
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authorization Failed</title>
        </head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GBP_AUTH_ERROR', error: 'no_code' }, '*');
              window.close();
            }
          </script>
          <p>No authorization code provided. This window should close automatically.</p>
        </body>
      </html>
      `,
      {
        headers: { "Content-Type": "text/html" },
      }
    )
  }

  try {
    // Exchange code for tokens and store refresh token
    await exchangeCodeForTokens(code)
    
    console.log("[API] OAuth callback successful, tokens stored")
    
    // Return HTML that closes the window and notifies the parent
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authorization Successful</title>
        </head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GBP_AUTH_SUCCESS' }, '*');
              window.close();
            }
          </script>
          <p>Authorization successful! This window should close automatically.</p>
        </body>
      </html>
      `,
      {
        headers: { "Content-Type": "text/html" },
      }
    )
  } catch (error) {
    console.error("[API] Error during OAuth callback:", error)
    const errorMessage = error instanceof Error ? error.message : "unknown_error"
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authorization Failed</title>
        </head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GBP_AUTH_ERROR', error: '${errorMessage.replace(/'/g, "\\'")}' }, '*');
              window.close();
            }
          </script>
          <p>Authorization failed: ${errorMessage}. This window should close automatically.</p>
        </body>
      </html>
      `,
      {
        headers: { "Content-Type": "text/html" },
      }
    )
  }
}

