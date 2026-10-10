# Academic Humanizer Pro

Private academic editing application using Next.js, React, TypeScript and Tailwind. This branch supports Vercel with Neon PostgreSQL and password-protected, signed-cookie authentication. It is a single-owner workspace: everyone with the workspace password accesses the same private history. Server API calls use an OpenAI-compatible provider (Gemini, OpenRouter or OpenAI).

## Deploy on Vercel

See [VERCEL.md](VERCEL.md) for import, database initialization, private login, AI configuration, and verification. A successful build does not initialize your hosted database or configure credentials. Older Sites/Cloudflare helper sources remain in the repository for reference and are not used by the Next.js build.

## Working features
- Four editing tools and five styles, real provider API calls, strict server-only credentials.
- DOCX, TXT and text-based PDF import up to 10 MB / 50,000 words; chapter selection.
- Per-paragraph accept/reject, word-level comparison, copy, original/revised TXT and DOCX export.
- Masks recognized citations, numbers and math spans; rejects missing/extra tokens and changed protected spans.
- Original DOCX ZIP parts retained; edited paragraph text is replaced without modifying tables, headers, images or other ZIP parts. Captions, references, fields and equations are excluded.
- Private database-backed revision history, explicit save, 1/7/30-day expiration, owner-scoped deletion, durable per-user request rate limits.

## Setup

Requires Node 22.x (22.13 or later) and pnpm 11.25.0. Run `pnpm install --frozen-lockfile`. Copy `.env.example` to ignored `.env.local` and supply your server-side values securely. Run `pnpm db:setup` once for a Neon database, then `pnpm dev` (local port 3000).

`pnpm exec tsc --noEmit` checks types. `pnpm test` runs document, preservation, database-adapter and session tests. `pnpm build` builds Next.js; `pnpm start` serves the production build. Credentials are never included in the source export. Without authentication settings, the workspace stays locked; without AI configuration, editing returns 503 and retains the original text.

## Private authentication

Set `APP_PASSWORD` (unique, strong, at least 12 characters) and `SESSION_SECRET` (random, at least 32 characters). Sign in at `/signin`. Sessions expire after seven days; signed cookies are HttpOnly, SameSite=Lax and Secure in production. Sites identity headers are ignored. Login attempts are limited in PostgreSQL. Rotate both secrets to revoke existing sessions. Multi-user accounts and registration are not implemented.

## Privacy and limitations
Files parse entirely in the browser. Selected paragraph text goes to the configured provider only when requested. Provider retention policies apply. Unsaved drafts are tab-local. History stores text only; DOCX source packages are not stored. Expired revisions cannot be retrieved and are purged on history access; no scheduled physical deletion job is installed. Manual deletion is immediate at the application database level (platform backup retention is external).

Large documents process sequentially while the tab is open, with retry on transient provider errors and partial results retained in memory. A durable autonomous background job queue is **not implemented**. There is no fake processing fallback. Save a partial revision before leaving the tab.

Exports include only accepted changes. The revised pane previews proposed changes; accept/reject determines the export. Rewritten paragraphs use the first run's formatting. Page layout and mixed inline styling can change. No native Word tracked-changes metadata is generated; optional yellow paragraph highlighting is supported. PDF imports preserve text only, not layout; scanned PDFs require external OCR. Unrecognized citation formats and semantic changes need author review. Automated checks are not factual verification. Bibliography detection depends on explicit headings/styles. Do not assume perfect preservation.

## Verification status
Vercel port: production Next.js build and all 22 tests pass. The PostgreSQL schema, owner isolation, retention cleanup and concurrent rate-limit SQL were also exercised in a temporary PostgreSQL-compatible engine. These checks do not establish live Neon or AI-provider connectivity. Those require your hosted credentials and the post-deployment checks in `VERCEL.md`. Historical export verification is recorded in `QA.md`.
