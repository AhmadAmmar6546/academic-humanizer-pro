# Verification for the Vercel port

- Standard Next.js production build and bundled TypeScript check: PASS (`pnpm build`).
- Frozen installation with pnpm 11.25.0: PASS (`pnpm install --frozen-lockfile`).
- 22 automated tests: PASS (`pnpm test`): document preservation/export, numeric/citation guards, SQL binding/result handling and signed-session authentication.
- PostgreSQL-compatible engine integration: PASS using a temporary PGlite engine. Schema applied twice, parameterized revisions, owner isolation, safe timestamps, expiration cleanup, and 21 concurrent rate-limit increments passed. This is not a live Neon test.
- Production HTTP integration: 13 checks PASS with temporary PostgreSQL/AI transports. Login/logout, relative redirects, private page access, forged-header rejection, signed Secure/HttpOnly/SameSite cookies, CSRF, multibyte/chunked byte limits, revision CRUD and concurrent edit/login limits passed. These mocks do not establish real Neon or AI connectivity.
- New authentication/database files lint: PASS. Inherited app and bundled PDF worker lint findings remain.
- Real hosted Neon initialization: NOT RUN because no DATABASE_URL is configured.
- Live provider request: NOT RUN because no provider key/model is configured.
- Vercel deployment and public live URL: NOT CREATED. User selected manual GitHub import; workspace Vercel network requests returned403. See VERCEL.md for required secure values and deployment checks.
- Visual browser QA: NOT RUN.

The current branch runs Next.js with Neon and private single-owner signed-cookie authentication. All users of the workspace password share one history. Existing Cloudflare/Sites history is not automatically migrated. The old Worker files are retained for reference.

Original DOCX packages are intentionally not retained in revision history. Mixed formatting, pagination and semantic preservation require author verification. No autonomous background job queue is implemented.
