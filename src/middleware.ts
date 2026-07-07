import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware that adds distributed tracing headers.
 *
 * Generates a unique request ID (trace ID) for every incoming request.
 * The ID is attached as:
 *   - X-Request-Id response header
 *   - X-Trace-Id response header
 *
 * If an upstream proxy already sets X-Request-Id, that value is preserved
 * so the trace can be correlated across services.
 */
export function middleware(request: NextRequest) {
  const requestId =
    request.headers.get('X-Request-Id') ??
    crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('X-Request-Id', requestId);
  requestHeaders.set('X-Trace-Id', requestId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('X-Request-Id', requestId);
  response.headers.set('X-Trace-Id', requestId);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt
     * - sitemap.xml
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
