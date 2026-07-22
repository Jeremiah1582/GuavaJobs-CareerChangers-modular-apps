# GuavaJobs Web (`apps/web`)

Next.js App Router client for GuavaJobs. Calls the NestJS API on Coolify/Hetzner.

## Local development

```bash
cd apps/web
cp .env.example .env.local
# Fill Supabase keys (same project as the API)
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). API calls go through `/guava-api/*` → `API_UPSTREAM` (see `next.config.ts` rewrites).

## Production build

```bash
npm run build
npm run start
```

Requires the same env vars as Vercel (see `.env.example`).

## Deploy on Vercel

This repo’s **git root is `apps/`** — in Vercel set **Root Directory** to `web`.

### 1. Import project

1. [vercel.com/new](https://vercel.com/new) → import `GuavaJobs-CareerChangers-modular-apps` (or your fork).
2. **Root Directory:** `web`
3. **Framework Preset:** Next.js (auto-detected)
4. **Node.js Version:** 20

`vercel.json` in this folder sets `npm ci` + `npm run build`.

### 2. Environment variables

| Variable | Production | Preview | Notes |
|----------|------------|---------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | ✓ | Same Supabase project as API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ | ✓ | Publishable key only |
| `API_UPSTREAM` | ✓ | ✓ | **Must be `https://`** Coolify API host |
| `NEXT_PUBLIC_API_URL` | ✓ | ✓ | Use `/guava-api` (proxy; recommended) |
| `NEXT_PUBLIC_SITE_URL` | ✓ | optional | Custom domain; previews use `VERCEL_URL` |
| `NEXT_PUBLIC_POSTHOG_KEY` | optional | optional | Analytics |
| `NEXT_PUBLIC_POSTHOG_HOST` | optional | optional | e.g. `https://eu.i.posthog.com` |

Do **not** set `API_UPSTREAM` to `http://` on Vercel — browsers block mixed content.

### 3. Backend + auth prerequisites

Before the web app works in production:

1. **Coolify API** deployed with HTTPS (Let’s Encrypt on sslip.io or custom domain). See `docs/DEPLOY.md`.
2. **Coolify env** `WEB_ORIGIN=https://your-production-domain.com` (preview `*.vercel.app` is already allowed in Nest CORS).
3. **Supabase Auth → URL configuration:** add  
   `https://your-app.vercel.app/**` and `https://*.vercel.app/**` for preview deploys.
4. Run **`npx prisma migrate deploy`** on the API container after schema changes.

### 4. Deploy

Push to `main` (or connect your branch). Vercel builds and deploys automatically.

**Smoke test after deploy:**

- `/` — marketing landing loads
- `/sign-in` — Supabase auth works
- `/app/jobs` — job search returns results (API + Redis healthy)
- Heart bookmark — requires API build with `/saved-jobs` routes

### 5. Custom domain (optional)

Vercel → Project → Domains → add domain → set `NEXT_PUBLIC_SITE_URL` to match.

## API client

- Relative `NEXT_PUBLIC_API_URL=/guava-api` — same-origin proxy (local + Vercel).
- Absolute `NEXT_PUBLIC_API_URL=https://api.example.com` — direct calls (needs CORS on Nest).

Types: `npm run api:types` (requires reachable OpenAPI at `API_UPSTREAM`).

## Related docs

- `docs/DEPLOY.md` — Coolify / Hetzner API runbook
- `docs/MASTER_BUILD_PLAN.md` — v1.0 ship gate (Vercel + stable HTTPS API)
