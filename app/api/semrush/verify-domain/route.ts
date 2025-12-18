import { NextRequest, NextResponse } from "next/server"
import { promises as dns } from "dns"

// ============================================
// Domain Verification Utility Functions
// ============================================

const DOMAIN_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/

/**
 * Check if domain format is valid
 * Example: google.com -> true
 *          -google.com -> false
 */
function checkDomainSyntax(domain: string): boolean {
  return DOMAIN_REGEX.test(domain)
}

/**
 * Check if domain resolves via DNS (A record)
 * Uses Node.js built-in dns module for reliable server-side DNS resolution
 */
async function checkDNS(domain: string): Promise<boolean> {
  try {
    // Use Node.js's built-in DNS resolver (much more reliable than external APIs)
    const addresses = await dns.resolve4(domain)
    
    // If we get at least one IP address, the domain resolves
    return addresses && addresses.length > 0
  } catch (error: any) {
    // DNS resolution failed
    console.error("DNS check failed for domain:", domain, error.code || error.message)
    return false
  }
}

/**
 * Check if domain responds over HTTP or HTTPS
 */
async function checkHTTP(domain: string, timeout: number = 10000): Promise<boolean> {
  for (const scheme of ["https", "http"]) {
    try {
      const url = `${scheme}://${domain}`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      // Try HEAD first, then GET if HEAD fails
      for (const method of ["HEAD", "GET"]) {
        try {
          const response = await fetch(url, {
            method,
            redirect: "follow",
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          })
          
          clearTimeout(timeoutId)
          
          // Accept any response code that indicates the server is responding
          // (including 404, 403, etc. - we just want to know the domain is reachable)
          if (response.status < 600) {
            return true
          }
        } catch (methodError) {
          // If HEAD fails, try GET. If GET fails, try next scheme
          if (method === "HEAD") {
            continue
          }
          throw methodError
        }
      }
    } catch (error) {
      // Try next scheme
      continue
    }
  }
  
  return false
}

/**
 * Full domain verification
 */
async function verifyDomain(domain: string): Promise<{
  domain: string
  syntax_valid: boolean
  dns_resolves: boolean
  http_reachable: boolean
  is_valid: boolean
}> {
  const result = {
    domain,
    syntax_valid: false,
    dns_resolves: false,
    http_reachable: false,
    is_valid: false,
  }

  // 1. Syntax check
  result.syntax_valid = checkDomainSyntax(domain)
  if (!result.syntax_valid) {
    return result
  }

  // 2. DNS check
  result.dns_resolves = await checkDNS(domain)
  if (!result.dns_resolves) {
    return result
  }

  // 3. HTTP check (optional - don't fail if it doesn't respond)
  result.http_reachable = await checkHTTP(domain)

  // If syntax + DNS pass, domain is considered valid
  result.is_valid = true
  return result
}

// ============================================
// API Route Handler
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { domain } = body

    if (!domain || typeof domain !== "string") {
      return NextResponse.json(
        { error: "Domain is required and must be a string" },
        { status: 400 }
      )
    }

    // Remove any whitespace and convert to lowercase
    const cleanedDomain = domain.trim().toLowerCase()

    if (!cleanedDomain) {
      return NextResponse.json(
        { error: "Domain cannot be empty" },
        { status: 400 }
      )
    }

    // Verify the domain
    const result = await verifyDomain(cleanedDomain)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error verifying domain:", error)
    return NextResponse.json(
      { error: "Failed to verify domain" },
      { status: 500 }
    )
  }
}

