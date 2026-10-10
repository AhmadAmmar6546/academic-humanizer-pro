# Academic Humanizer Pro

Private academic editing application. React + TypeScript + Tailwind on the Next.js-compatible Vinext runtime. Server API calls use a configurable OpenAI-compatible provider (OpenRouter, OpenAI, or Gemini). This hosted edition uses Cloudflare D1/Drizzle and ChatGPT private-site authentication, rather than PostgreSQL/Prisma and email/password.

## Working features
- Four editing tools and five styles, real provider API calls, strict server-only credentials.
- DOCX, TXT and text-based PDF import up to 10 MB / 50,000 words; chapter selection.
- Per-paragraph accept/reject, word-level comparison, copy, original/revised TXT and DOCX export.
- Masks recognized citations, numbers and math spans; rejects missing/extra tokens and changed protected spans.
- Original DOCX ZIP parts retained; edited paragraph text is replaced without modifying tables, headers, images or other ZIP parts. Captions, references, fields and equations are excluded.
- Private database-backed revision history, explicit save, 1/7/30-day expiration, owner-scoped deletion, durable per-user request rate limits.

## Setup
Requires Node 22+, pnpm and the Cloudflare-compatible runtime supplied with this source. Install with `pnpm install`. Copy `.env.example` to ignored `.env.local` and set `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`. Never commit credentials. Rotate any key previously pasted into a chat.

`pnpm dev` runs the local compatible development server. `pnpm exec tsc --noEmit` checks types. `node --import tsx --test tests/*.test.ts` runs tests. `pnpm build` builds the Worker. Apply D1 migrations locally with `pnpm exec wrangler d1 migrations apply site-creator-d1 --local --config dist/server/wrangler.json`. For standalone preview identity, use the starter's supported mock authentication; production trusts only the Sites dispatch authentication boundary, never user-supplied identity headers on a public origin.

## Production configuration
In Sites runtime settings, set LLM_API_KEY as a secret, LLM_BASE_URL and LLM_MODEL. Publish again to apply environment changes. An unset key/model returns a clear 503 rather than invented rewriting. The browser never receives the key. Provider model availability and account credits must be verified separately. Runtime secrets from the hosted Site are not included in this source export.

OpenRouter API contract: https://openrouter.ai/docs/api/api-reference/chat/send-chat-completion-request

## Hosting / Hostinger
This is a deployed Sites / Cloudflare Worker application, an appropriate alternative to Hostinger shared hosting. It cannot be uploaded to Hostinger public_html as a PHP/static site. A Hostinger VPS port would require replacing Cloudflare D1/env and trusted Sites identity with PostgreSQL/Prisma and an independently secured auth/session layer, and running standard Next.js under Node with HTTPS. The `prisma/schema.prisma` file describes that database target, but this port is **not implemented**. Do not point an unprotected Node deployment at the current trusted-header identity helper.

## Privacy and limitations
Files parse entirely in the browser. Selected paragraph text goes to the configured provider only when requested. Provider retention policies apply. Unsaved drafts are tab-local. History stores text only; DOCX source packages are not stored. Expired revisions cannot be retrieved and are purged on history access; no scheduled physical deletion job is installed. Manual deletion is immediate at the application database level (platform backup retention is external).

Large documents process sequentially while the tab is open, with retry on transient provider errors and partial results retained in memory. A durable autonomous background job queue is **not implemented**. There is no fake processing fallback. Save a partial revision before leaving the tab.

Exports include only accepted changes. The revised pane previews proposed changes; accept/reject determines the export. Rewritten paragraphs use the first run's formatting. Page layout and mixed inline styling can change. No native Word tracked-changes metadata is generated; optional yellow paragraph highlighting is supported. PDF imports preserve text only, not layout; scanned PDFs require external OCR. Unrecognized citation formats and semantic changes need author review. Automated checks are not factual verification. Bibliography detection depends on explicit headings/styles. Do not assume perfect preservation.

## Verification status
See `QA.md`. End-to-end live model output requires a fresh server-side key and selected model. Browser visual verification was unavailable in this environment. This is a functional hosted foundation, not a certification of all requested production requirements.
