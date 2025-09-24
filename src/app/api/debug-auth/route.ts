import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get('site_auth')?.value;
  const authHeader = request.headers.get('authorization');
  
  return NextResponse.json({
    cookie: cookie,
    hasAuthHeader: !!authHeader,
    authHeader: authHeader ? 'present' : 'missing',
    userAgent: request.headers.get('user-agent'),
    url: request.url,
    method: request.method,
  });
}
