import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE = 'site_auth';
const AUTH_COOKIE_VALUE = 'verified';

// WARNING: For simple gating only. For stronger security, use proper auth.
const PASSWORD = 'Dumf7r-xok3yn';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    if (typeof password !== 'string') {
      return NextResponse.json({ error: 'Password missing' }, { status: 400 });
    }

    if (password !== PASSWORD) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    // Set httpOnly session cookie (expires when browser closes)
    response.cookies.set(AUTH_COOKIE, AUTH_COOKIE_VALUE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      // No maxAge = session cookie that expires when browser closes
    });
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}


