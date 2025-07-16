import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    
    // Password for RAG system - you can change this
    const correctPassword = process.env.RAG_PASSWORD || 'rag2025';

    console.log('RAG Auth attempt'); // Debug log

    if (password === correctPassword) {
      // Set authentication cookie for RAG system
      const response = NextResponse.json({ message: 'Authentication successful' });
      
      response.cookies.set('rag_auth', 'true', {
        httpOnly: true,
        maxAge: 86400, // 24 hours
        sameSite: 'strict',
        path: '/'
      });
      
      return response;
    } else {
      return NextResponse.json({ message: 'Invalid password' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}