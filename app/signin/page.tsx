import { authConfigured } from '@/lib/session';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function SignIn({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getChatGPTUser()) redirect('/');
  const { error } = await searchParams;
  const available = authConfigured();
  const message = !available || error === 'unavailable'
    ? 'Sign-in is not configured yet. Contact the workspace owner.'
    : error === 'rate' ? 'Too many sign-in attempts. Please wait one minute.'
    : error ? 'The password is incorrect. Please try again.' : '';
  return <main className="signin"><section className="signin-card">
    <div className="eyebrow">ACADEMIC HUMANIZER PRO</div>
    <h1>Your private workspace</h1>
    <p>Sign in to edit your writing and access saved revisions.</p>
    {message && <p className="signin-error" role="alert">{message}</p>}
    {available && <form action="/api/auth/login" method="post">
      <label htmlFor="password">Workspace password</label>
      <input id="password" name="password" type="password" required maxLength={512} autoComplete="current-password" />
      <button className="btn primary" type="submit">Sign in</button>
    </form>}
  </section></main>;
}
