import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE_NAME, verifySession, type SessionUser } from '@/lib/session';

export type ChatGPTUser = SessionUser;

// Vercel authentication uses signed cookies. Sites identity headers are ignored.
export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  return verifySession((await cookies()).get(SESSION_COOKIE_NAME)?.value);
}

export async function requireChatGPTUser(_returnTo: string): Promise<ChatGPTUser> {
  const user = await getChatGPTUser();
  if (!user) redirect('/signin');
  return user;
}

export function chatGPTSignInPath(_returnTo: string): string { return '/signin'; }
