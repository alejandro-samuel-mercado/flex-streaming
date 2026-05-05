import { NextRequest, NextResponse } from 'next/server';

// ─── Route Classification ──────────────────────────────────────────────────────
//
// USER_PROTECTED → Requires cookie 'accessToken' (set on user login).
//                  Redirects to /login if missing.
//
// ADMIN          → Requires cookie 'adminToken' (set on admin login).
//                  Redirects to /admin/login if missing.
//                  adminToken is NEVER checked on user routes and vice-versa.
//
// PUBLIC         → All other routes. No auth required.
//

const USER_PROTECTED_PREFIXES = [
    '/watch',
    '/favoritos',
    '/historial',
    '/perfil',
];

const ADMIN_PREFIXES = [
    '/admin',
];

function matchesPrefixList(pathname: string, list: string[]): boolean {
    return list.some(prefix => pathname === prefix || pathname.startsWith(prefix + '/'));
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // ── 1. Admin routes ───────────────────────────────────────────────────────
    if (matchesPrefixList(pathname, ADMIN_PREFIXES)) {
        // Allow the login page itself through
        if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) {
            return NextResponse.next();
        }
        const adminToken = request.cookies.get('adminToken')?.value;
        if (!adminToken) {
            const loginUrl = request.nextUrl.clone();
            loginUrl.pathname = '/admin/login';
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }
        return NextResponse.next();
    }

    // ── 2. User-protected routes ───────────────────────────────────────────────
    if (matchesPrefixList(pathname, USER_PROTECTED_PREFIXES)) {
        const accessToken = request.cookies.get('accessToken')?.value;
        if (!accessToken) {
            const loginUrl = request.nextUrl.clone();
            loginUrl.pathname = '/login';
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }
        return NextResponse.next();
    }

    // ── 3. Everything else is public ──────────────────────────────────────────
    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all paths EXCEPT static assets and API routes.
         * Those have their own auth handled by the backend.
         */
        '/((?!_next/static|_next/image|favicon.ico|api/).*)',
    ],
};
