import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { auth } from '@/lib/auth';

/**
 * Proxy that handles:
 * 1. Distributed tracing headers (X-Request-Id, X-Trace-Id)
 * 2. Auth session checking and role-based route protection
 * 3. Redirect unauthenticated /dashboard/* requests to /login
 * 4. Role-based access via ROLE_ROUTES capability map
 * 5. Root path redirection based on role (authenticated only)
 */

// Read-path authorization: role → route prefixes each role may access.
// Mirrors `roles` in app-sidebar nav config — keep the two in sync.
const ROLE_ROUTES: Record<string, string[]> = {
  owner: ['/dashboard'],
  teacher: ['/dashboard', '/dashboard/daily', '/dashboard/calendar'],
};

// ponytail: teacher-preview is a dev/testing aid to exercise the teacher
// read-path without a seeded teacher user. Not a shipped feature.
function effectiveRole(role: string, searchParams: URLSearchParams): string {
  return searchParams.get('teacher-preview') === 'true' ? 'teacher' : role;
}

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
        const role = effectiveRole(
          session.user.role as string,
          request.nextUrl.searchParams
        );
        const home = role === 'owner' ? '/dashboard' : '/dashboard/daily';
        return NextResponse.redirect(new URL(home, request.url));
      }
    } catch {
      // Session check failed — fall through to pass-through below
    }

    // Unauthenticated: redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Protected dashboard routes
  if (pathname.startsWith('/dashboard/') || pathname === '/dashboard') {
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

      const role = effectiveRole(
        session.user.role as string,
        request.nextUrl.searchParams
      );
      const allowed =
        ROLE_ROUTES[role]?.some(
          (p) => pathname === p || pathname.startsWith(p + '/')
        ) ?? false;

      if (!allowed) {
        const response = new NextResponse('Akses Diblokir', { status: 403 });
        response.headers.set('X-Request-Id', requestId);
        response.headers.set('X-Trace-Id', requestId);
        return response;
      }
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
