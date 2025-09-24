import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const PASSWORD = 'Dumf7r-xok3yn';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    
    if (typeof password !== 'string') {
      return NextResponse.json({ error: 'Password missing' }, { status: 400 });
    }

    if (password !== PASSWORD) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Create JWT token (valid for 24 hours)
    const token = jwt.sign(
      { 
        authenticated: true, 
        timestamp: Date.now() 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return NextResponse.json({ 
      success: true, 
      token: token 
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
