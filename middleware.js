import { NextResponse } from 'next/server';

export function middleware(request) {
  console.log('🔍 RAG Middleware running for:', request.nextUrl.pathname);
  
  const { pathname } = request.nextUrl;
  
  // Skip authentication for login page, API routes, and static assets
  if (
    pathname === '/login' || 
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next') || 
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/static')
  ) {
    console.log('✅ Skipping auth for:', pathname);
    return NextResponse.next();
  }
  
  // Check if user is authenticated
  const isAuthenticated = request.cookies.get('rag_auth');
  console.log('🍪 Auth cookie:', isAuthenticated);
  
  if (!isAuthenticated) {
    console.log('❌ Not authenticated, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  console.log('✅ Authenticated, allowing access');
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};