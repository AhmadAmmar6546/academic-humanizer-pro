import { database } from './database';
import { getChatGPTUser } from '@/app/chatgpt-auth';

export function config() {
  return {
    LLM_API_KEY: process.env.LLM_API_KEY,
    LLM_BASE_URL: process.env.LLM_BASE_URL,
    LLM_MODEL: process.env.LLM_MODEL,
    get DB() { return database(); },
  };
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  // Next may use an internal hostname in Request.url. Host is the browser's
  // destination; browsers cannot replace it when sending cross-origin forms.
  const destination = new URL(request.url);
  const host = request.headers.get('host');
  if (host) destination.host = host;
  if (process.env.VERCEL === '1') destination.protocol = 'https:';
  if (!origin || origin !== destination.origin) throw Error('FORBIDDEN');
}

export async function identity(request: Request, mutation = false) {
  const user = await getChatGPTUser();
  if (!user) throw Error('UNAUTHORIZED');
  if (mutation) sameOrigin(request);
  return user.userId;
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function boundedText(request: Request, limit = 100000) {
  if (Number(request.headers.get('content-length')) > limit) throw Error('Request too large.');
  const reader = request.body?.getReader();
  if (!reader) throw Error('Empty request.');
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) { await reader.cancel(); throw Error('Request too large.'); }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { all.set(chunk, offset); offset += chunk.length; }
  return new TextDecoder().decode(all);
}

export async function boundedJSON(request: Request, limit = 100000) {
  return JSON.parse(await boundedText(request, limit));
}

export function failure(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unexpected error';
  if (message === 'UNAUTHORIZED') return json({ error: 'Sign in to your private workspace.' }, 401);
  if (message === 'FORBIDDEN') return json({ error: 'Request origin is not allowed.' }, 403);
  if (message === 'DATABASE_UNAVAILABLE' || message === 'AUTH_UNAVAILABLE') {
    return json({ error: 'The workspace is not configured yet. Contact the workspace owner.' }, 503);
  }
  // Database driver errors can contain connection details; never return them.
  if (error instanceof Error && (error.name === 'NeonDbError' || 'code' in error)) {
    return json({ error: 'The database request failed. Please retry.' }, 503);
  }
  return json({ error: message }, 400);
}
