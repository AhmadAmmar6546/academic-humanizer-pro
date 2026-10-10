# Source uploaded to GitHub

The extracted project is stored in `AhmadAmmar6546/academic-humanizer-pro`. The original ZIP remains in the repository alongside the source.

This branch has been ported from Sites/Cloudflare to standard Next.js for Vercel. Follow [VERCEL.md](VERCEL.md) to import it, connect a Neon database, configure private authentication and your AI provider, and validate the deployed app.

GitHub stores source code; it does not run this backend. GitHub Pages cannot host the server API. Vercel credentials and application secrets are not included in the repository.

Keep real `.env.local`, `.dev.vars`, credentials, `node_modules`, `.next`, `.vercel` and generated runtime state out of commits. The safe `.env.example` lists required variable names without values.
