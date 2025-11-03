import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''

  // Extract subdomain
  // Examples:
  // - fernando.iwantmyown.com -> fernando
  // - localhost:3003 -> null
  // - peter.iwantmyown.com -> peter
  const subdomain = hostname.split('.')[0]

  // For local development or ALB health checks
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1') || hostname.includes('elb.amazonaws.com')) {
    // During local dev or ALB access, treat everything as the main site
    return NextResponse.next()
  }

  // If on root domain (iwantmyown.com), show marketing site
  if (hostname === 'iwantmyown.com' || hostname === 'www.iwantmyown.com') {
    // Already on the marketing site
    return NextResponse.next()
  }

  // If on fernando.iwantmyown.com, this is Peter's personal instance
  if (subdomain === 'fernando') {
    // Store tenant ID in header for API calls
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-tenant-id', 'peter')

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // Any other subdomain would be a customer subdomain (e.g., acme.iwantmyown.com)
  // For now, redirect to marketing site
  return NextResponse.redirect(new URL('https://iwantmyown.com/fernando', request.url))
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     * - api/health (health check endpoint)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/health|.*\\.png$|.*\\.jpg$|.*\\.ico$).*)',
  ],
}
