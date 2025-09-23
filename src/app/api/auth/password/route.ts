import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE = 'site_auth';
const AUTH_COOKIE_VALUE = 'verified';

// WARNING: For simple gating only. For stronger security, use proper auth.
const PASSWORD = 'Dumf7r-xok3yn';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    if (typeof password !== 'string') {
      return NextResponse.json({ error: 'Passwort fehlt' }, { status: 400 });
    }

    if (password !== PASSWORD) {
      return NextResponse.json({ error: 'Ungültiges Passwort' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    // Set httpOnly cookie for 30 days
    response.cookies.set(AUTH_COOKIE, AUTH_COOKIE_VALUE, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Fehlerhafte Anfrage' }, { status: 400 });
  }
}


