import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { auth } from '@/lib/auth';

/**
 * Proxy that handles:
 * 1. Distributed tracing headers (X-Request-Id, X-Trace-Id)
 * 2. Auth session checking and role-based route protection
 * 3. Redirect unauthenticated /dashboard/* requests to /login
 * 4. Role-based access: Teacher cannot access /dashboard/owner/*
 * 5. Root path redirection based on role (authenticated only)
 */
export async function proxy(request: NextRequest) {
  const requestId = request.headers.get('X-Request-Id') ?? crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('X-Request-Id', requestId);
  requestHeaders.set('X-Trace-Id', requestId);

  const { pathname } = request.nextUrl;

  // --- Tracing-only paths (static files, API, etc.) ---
  // For non-page paths, just add tracing headers and continue
  if (pathname === '/login') {
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.headers.set('X-Request-Id', requestId);
    response.headers.set('X-Trace-Id', requestId);
    return response;
  }

  // --- Auth and role checks for protected paths ---

  // Root path: redirect authenticated users to dashboard, unauthenticated to login
  if (pathname === '/') {
    try {
      const session = await auth.api.getSession({
        headers: requestHeaders,
      });

      if (session) {
        const role = session.user.role as string;
        const dashboardUrl =
          role === 'owner' ? '/dashboard/owner' : '/dashboard/teacher';
        return NextResponse.redirect(new URL(dashboardUrl, request.url));
      }
    } catch {
      // Session check failed — fall through to pass-through below
    }

    // Unauthenticated: redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Protected dashboard routes
  if (pathname.startsWith('/dashboard/')) {
    try {
      const session = await auth.api.getSession({
        headers: requestHeaders,
      });

      // Unauthenticated — redirect to login with destination preserved
      if (!session) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      const role = session.user.role as string;

      // Teacher trying to access owner-only routes → 403
      if (role === 'teacher' && pathname.startsWith('/dashboard/owner')) {
        const response = new NextResponse('Akses Diblokir', { status: 403 });
        response.headers.set('X-Request-Id', requestId);
        response.headers.set('X-Trace-Id', requestId);
        return response;
      }

      // Owner accessing /dashboard/teacher — allowed, falls through
    } catch {
      // Session check failed — redirect to login for safety
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Default: continue with tracing headers
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set('X-Request-Id', requestId);
  response.headers.set('X-Trace-Id', requestId);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - robots.txt
     * - sitemap.xml
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
