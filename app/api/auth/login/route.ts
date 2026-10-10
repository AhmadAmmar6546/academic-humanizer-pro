import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { authConfigured, matchesPassword, createSession, SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from '@/lib/session';
import { sameOrigin, failure, boundedText } from '@/lib/server';

export const runtime = 'nodejs';

function back(_request: Request, error: string) {
  return new NextResponse(null, { status: 303, headers: { Location: `/signin?error=${error}`, 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    if (!authConfigured()) return back(request, 'unavailable');
    const text = await boundedText(request, 4096);
    const password = new URLSearchParams(text).get('password') ?? '';
    const db = database();
    const now = Date.now();
    // Shared durable bucket prevents brute force even if IP headers are spoofed.
    const bucket = createHash('sha256').update(`login:${Math.floor(now / 60000)}`).digest('hex');
    await db.prepare('DELETE FROM limits WHERE expires < ?').bind(now).run();
    const rate = await db.prepare('INSERT INTO limits(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=limits.count+1 RETURNING count')
      .bind(bucket, now + 120000).first<{ count: number }>();
    if ((rate?.count ?? 0) > 10) return back(request, 'rate');
    if (!matchesPassword(password)) return back(request, 'invalid');
    const response = new NextResponse(null, { status: 303, headers: { Location: '/' } });
    response.headers.set('Cache-Control', 'no-store');
    response.cookies.set(SESSION_COOKIE_NAME, createSession(), {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
      path: '/', maxAge: SESSION_TTL_SECONDS,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.message === 'DATABASE_UNAVAILABLE') return back(request, 'unavailable');
    return failure(error);
  }
}
