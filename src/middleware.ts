import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Add the paths that should be protected
const protectedPaths = [
  '/dashboard',
  '/projects',
  '/tasks',
  '/notes',
  '/wireframes'
];

const authPaths = [
  '/login',
  '/signup'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  const isAuthPath = authPaths.some(path => pathname.startsWith(path));

  // If the user tries to access a protected route without a token, redirect to login
  if (isProtectedPath && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If the user tries to access login/signup with a token, redirect to dashboard
  if (isAuthPath && token) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // If accessing root, redirect to dashboard (which handles auth redirect) or landing page
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = token ? '/dashboard' : '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
