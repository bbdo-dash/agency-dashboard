import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as { authenticated?: boolean };
    
    if (decoded.authenticated) {
      return NextResponse.json({ valid: true, decoded });
    } else {
      return NextResponse.json({ valid: false }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ valid: false }, { status: 401 });
  }
}
