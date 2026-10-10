# Deploy Academic Humanizer Pro on Vercel

This branch uses standard Next.js, Neon PostgreSQL and a password-protected single-owner workspace. All signed-in sessions share the same history. Vercel deployment and live provider connectivity have not been completed in this workspace.

## 1. Create the database

Create or connect a **Neon** database (Vercel Marketplace → Storage → Neon is supported). Use its PostgreSQL connection string as `DATABASE_URL`, with TLS enabled. The HTTP database driver requires a Neon-compatible endpoint; an arbitrary PostgreSQL provider URL will not work.

Open Neon's SQL Editor and execute [`db/postgres.sql`](db/postgres.sql). The script is idempotent and creates revision history, rate-limit tables and indexes. Alternatively, set `DATABASE_URL` in ignored `.env.local` and run `pnpm db:setup`. Do not put credentials in chat or source control.

## 2. Import the GitHub repository

In Vercel choose **Add New → Project → Import Git Repository**, then select `AhmadAmmar6546/academic-humanizer-pro` and branch `main`.

Use **Next.js** as the framework, the repository root as Root Directory, and Node **22.x**. `vercel.json` supplies the frozen pnpm installation and build commands. Do not select Vite or Cloudflare, and do not set `dist` as the output directory.

Add these in **Project Settings → Environment Variables** for Production (and separately for Preview if needed):

| Name | Value |
| --- | --- |
| `ENABLE_EXPERIMENTAL_COREPACK` | `1` (honors the pinned pnpm 11.25.0) |
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `APP_PASSWORD` | Unique strong workspace password, at least 12 characters |
| `SESSION_SECRET` | Random signing secret, at least 32 characters |
| `LLM_API_KEY` | Your provider's server-side API key |
| `LLM_BASE_URL` | Gemini: `https://generativelanguage.googleapis.com/v1beta/openai`; OpenRouter: `https://openrouter.ai/api/v1`; OpenAI: `https://api.openai.com/v1` |
| `LLM_MODEL` | A model your selected provider account can use; template suggests `gemini-2.5-flash` |

Treat the password, signing secret, database URL and provider key as secrets. Never use `NEXT_PUBLIC_` names for them. You can create a signing secret locally with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and paste it directly into Vercel's secure settings. Do not share it in chat.

Click **Deploy**. If variables are changed later, **Redeploy** to apply them. API editing requests allow up to 180 seconds; your Vercel plan must support that function duration. No build step contacts the AI provider or initializes database tables.

## 3. Verify the deployment

1. The home URL redirects to `/signin` before authentication. Opening `/api/history` while signed out returns HTTP 401.
2. Sign in with `APP_PASSWORD`; confirm the editor loads and history opens without a database error.
3. Open Preferences & privacy and confirm the provider is configured. This status checks required settings, not account credits or provider connectivity.
4. Edit a short sample, review and accept a change, then save the revision. Reload and open it from history; delete it afterward if it was only a test.
5. Sign out and verify private APIs return 401 again.

Missing authentication settings leave the app locked. Missing database access prevents login/history/rate limiting rather than using temporary storage. An unset AI key/model returns 503 without sending text to a provider. Existing Cloudflare/Sites histories are not automatically migrated to Neon.

## Checks completed before import

- Standard Next.js production build and TypeScript: passed.
- Tests: 22 passed (document handling, preservation, database adapter, signed sessions).
- PostgreSQL-compatible engine: schema repeatability, history ownership/retention, atomic concurrent rate limits passed.
- Production HTTP: 13 checks passed under temporary PostgreSQL/AI transports, including login/logout, private access, revision CRUD and rate limits.
- Live Vercel deployment, real Neon connectivity and live AI output: require your account configuration and have not been verified.
- The inherited lint command has pre-existing source and bundled PDF-worker findings.
