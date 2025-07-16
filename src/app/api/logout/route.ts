import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ message: 'Logged out successfully' });
  
  // Clear the authentication cookie
  response.cookies.set('rag_auth', '', {
    httpOnly: true,
    maxAge: 0,
    sameSite: 'strict',
    path: '/'
  });
  
  return response;
}