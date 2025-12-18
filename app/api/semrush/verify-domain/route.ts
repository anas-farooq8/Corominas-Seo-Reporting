import { NextRequest, NextResponse } from "next/server"

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
 */
async function checkDNS(domain: string): Promise<boolean> {
  try {
    // Use DNS over HTTPS (DoH) via Google's public DNS
    const response = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`,
      {
        headers: {
          'Accept': 'application/dns-json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      }
    )
    
    if (!response.ok) {
      return false
    }
    
    const data = await response.json()
    
    // Check if we got valid A records
    return data.Status === 0 && Array.isArray(data.Answer) && data.Answer.length > 0
  } catch (error) {
    console.error("DNS check failed:", error)
    return false
  }
}

/**
 * Check if domain responds over HTTP or HTTPS
 */
async function checkHTTP(domain: string, timeout: number = 5000): Promise<boolean> {
  for (const scheme of ["https", "http"]) {
    try {
      const url = `${scheme}://${domain}`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      const response = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (response.status < 500) {
        return true
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

