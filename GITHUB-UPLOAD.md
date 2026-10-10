# Upload to GitHub

1. Extract this ZIP on your computer.
2. Create an empty GitHub repository named academic-humanizer-pro.
3. Open the extracted academic-humanizer-pro folder in a terminal.
4. Run these commands, replacing YOUR_USERNAME:

```sh
git init
git add .
git commit -m "Add Academic Humanizer Pro"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/academic-humanizer-pro.git
git push -u origin main
```

Alternatively, use GitHub Desktop: File > Add local repository, create a repository in this folder if prompted, commit, then Publish repository.

Upload the extracted source files, not only the ZIP. Keep .env.example and .gitignore in the repository. Never upload actual API keys, .env.local, .dev.vars, node_modules, .git or runtime/build output.

## What this archive includes
Frontend, server API routes, DOCX/PDF import and DOCX export, preservation tests, D1 migrations, a PostgreSQL target schema, dependency lockfile and setup documentation. The exported hosting manifest intentionally omits the original private Site identity.

## Hosting boundary
Uploading to GitHub stores source code; it does not run the application. GitHub Pages cannot run its backend. This edition requires the Sites/Cloudflare-compatible runtime and D1. PostgreSQL/Prisma is a target schema only; the standalone adapter and autonomous job queue are not implemented. See README.md for limitations and deployment guidance.

API credentials are excluded. Configure your own server secret after deploying. The exported Gemini model setting is configurable; verify current availability in your provider account.
