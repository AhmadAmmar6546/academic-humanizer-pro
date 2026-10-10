import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/session';
import { sameOrigin, failure } from '@/lib/server';

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const response = new NextResponse(null, { status: 303, headers: { Location: '/signin' } });
    response.cookies.set(SESSION_COOKIE_NAME, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) { return failure(error); }
}
