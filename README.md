# MERN Portfolio CMS

Modern full-stack developer portfolio with a secure admin dashboard. It works like a small WordPress-style CMS: log in, edit content, upload images/resume, manage messages, and publish changes without touching source code.

> **Developer reference:** every endpoint, function, and component is documented in **[FUNCTIONS.md](FUNCTIONS.md)** (with usage examples).

## Features

- React + Vite public portfolio — **100% CMS-driven, zero hardcoded copy**: every heading, nav label, button, form label/placeholder and toast is editable content (empty DB → empty sections), with **dark/light mode** and scroll reveals
- Admin login with JWT (Bearer), bcrypt password hashing, and protected dashboard routes
- Self-service **Account** page — the admin can update their name/email and change their password from the dashboard (no `.env` edit or re-seed)
- Full CRUD for **17 content types** — Hero, Stats, About, Skills, Projects, Experience, Education, Certificates, Blogs, Services, Testimonials, Contact Info, Resume, Social Links, SEO, Section Titles, Site Settings
- Admin dashboard with three sections — **Overview** (stats + recent messages), **Content** (per-type editor), **Messages** (click-to-open inbox)
- Power tools: image previews, reorder, duplicate, publish/draft toggle, search, confirm-delete, unsaved-changes guard, theme toggle
- Contact form saves to MongoDB + dashboard inbox (rate limiting + honeypot spam protection)
- **Cloudinary** uploads (via Multer) for images and resume PDFs
- Express REST API with Mongoose, Zod validation, Helmet, CORS, rate limiting, NoSQL-injection sanitization, compression, and central error handling
- Seed command + idempotent migration scripts

## Tech Stack

- **Frontend:** React, React Router, Framer Motion, Lucide icons, React Hot Toast, Axios (Vite)
- **Backend:** Node.js, Express 5, MongoDB, Mongoose 9, JWT, bcrypt, Multer, Cloudinary, Zod
- **Deploy:** env-based config — backend on Render, frontend on Vercel (cross-origin, CORS-aware)

## Setup

1. **Install** (root + client + server):
   ```bash
   npm run install:all
   ```
2. **Env** — create one root `.env` and fill in your values:
   ```bash
   copy .env.example .env
   ```
   Set `MONGO_URI`, `JWT_SECRET`, admin creds, and `CLOUDINARY_*`. Leave `VITE_API_URL` **unset** for local dev (the Vite dev server proxies `/api` to the backend).
3. **Seed** the first admin + starter content:
   ```bash
   npm run seed
   ```
4. **Run** API + client:
   ```bash
   npm run dev
   ```

On start the terminal prints a clear banner with the actual **Backend**, **API**, and **Frontend** URLs and the MongoDB status:

Frontend `http://localhost:5173` · API `http://localhost:5000/api` · Admin `http://localhost:5173/admin`

> **Ports auto-resolve.** The backend prefers **5000** and the frontend prefers **5173**; if either port is busy, that service automatically uses the next free port and prints the real URL — a collision never stops the app from starting. In dev the client always reaches the API through the Vite `/api` proxy, so there is no CORS setup and no port to keep in sync.

### Admin login

After `npm run seed`, sign in at **`/admin`** (`http://localhost:5173/admin`) with the credentials from your `.env`:

| Field | Value |
|---|---|
| **Email** | `zaidm1323@gmail.com` &nbsp;(the `ADMIN_EMAIL` in `.env`) |
| **Password** | `ChangeMe123!` &nbsp;(the `ADMIN_PASSWORD` in `.env`) |

> **⚠ Change these after first login.** In the dashboard open **Account** (sidebar) to update your name/email and change your password directly — no `.env` edit or re-seed needed. New passwords must be at least 8 characters. Do not commit real production credentials.

## Scripts

```bash
npm run dev          # client + server together
npm run dev:client   # Vite only
npm run dev:server   # Express API only
npm run seed         # create admin + default CMS content (idempotent)
npm run build        # production frontend build
npm start            # production server (also serves the built client)
npm run lint         # ESLint the client
```

**One-off migrations** (from the `server/` folder — all idempotent):
```bash
node src/scripts/migrate-split-content.js       # legacy: split single `contents` -> per-type collections
node src/scripts/merge-singletons.js            # fold single-instance types into the shared `content` collection
node src/scripts/migrate-media-to-cloudinary.js # move local /images & /resume.pdf into Cloudinary, rewrite URLs
```

## Content model (hybrid collections)

Content types are stored in one of two ways, but the REST API is uniform — you always work by **`type`** string and never care which collection it lives in:

- **List-like types** get their own collection: `projects`, `skills`, `stats`, `socialLinks`
- **Single-instance types** share one **`content`** collection, tagged by a `type` field: hero, about, contactInfo, resume, seo, siteText, siteSetting, blog, certificate, service, testimonial, experience, education

This is all handled by `server/src/models/contentModels.js` (`modelForType`, `scopeForType`, `findAcrossModels`, …). See [FUNCTIONS.md §4](FUNCTIONS.md#4-content-model-registry-contentmodelsjs).

> **No hardcoded copy:** every visible string on the public site — section headings/eyebrows, **nav labels**, **contact-form labels & placeholders**, button text, the success toast, even the "Syncing…" banner — lives in the **Section Titles** (`siteText`) singleton and is edited from the dashboard. Components render only DB values; nothing user-facing is baked into the source (an empty field renders nothing, an empty section disappears). The browser-frame address bar on project cards shows only the real `liveUrl` (or the project title) — no fabricated domains.

## Cloudinary uploads

Dashboard image/PDF uploads go straight to Cloudinary. Set in `.env`:
```
CLOUDINARY_CLOUD_NAME=…
CLOUDINARY_API_KEY=…
CLOUDINARY_API_SECRET=…
CLOUDINARY_FOLDER=portfolio-cms
```
If these are missing, `POST /api/upload` returns **503** (the rest of the app still works).

> **PDF gotcha:** new Cloudinary accounts block PDF/ZIP delivery by default (URLs return **401** with `x-cld-error: deny or ACL failure`). Enable it once at **Cloudinary Console → Settings → Security → "Allow delivery of PDF and ZIP files"**.

## Theming (design tokens)

All colors are CSS custom properties in `client/src/index.css` — `:root` (dark) and `:root[data-theme='light']`. The palette is **Slate & Indigo**: a comfortable elevated dark (not near-black), an indigo-blue accent (`#5a63e0` dark / `#4850d8` light), and WCAG-AA/AAA contrast in both themes. Change the whole app's look by editing those two blocks.

The admin can also override the brand color at runtime via **Site Settings → Accent color** (`settings.accentColor`), which `PublicSite.jsx` applies to `--accent` on the public site.

## Environment values (root `.env`)

| Var | Purpose |
|---|---|
| `MONGO_URI` | MongoDB Atlas/local connection string |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | admin token secret / expiry (default `7d`) |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | first admin created by `npm run seed` |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` / `_FOLDER` | dashboard uploads |
| `VITE_API_URL` | browser API URL. **Unset in dev** (Vite proxies `/api`). In production set it on the frontend host (Vercel) to the backend, e.g. `https://<render-service>.onrender.com/api` |
| `CLIENT_URL` | production frontend origin(s) allowed by CORS, comma-separated. Dev allows any localhost automatically; `*.vercel.app` is always allowed |
| `PORT` | preferred backend port (default `5000`; auto-falls-back if busy). Render injects its own `PORT` |
| `DNS_SERVERS` | *(optional)* comma-separated DNS resolvers (e.g. `8.8.8.8,1.1.1.1`) — auto-used if your machine's resolver can't do `mongodb+srv://` SRV lookups |

## Deployment (Render backend + Vercel frontend)

The API and the site deploy as two services with the frontend calling the backend cross-origin. The API's CORS allows the origins in `CLIENT_URL` plus any `*.vercel.app` host.

**Backend → Render** (config in `render.yaml`):
- Build `npm install --prefix server`, start `npm start`.
- Set in the Render dashboard: `MONGO_URI`, `JWT_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, and `CLIENT_URL` = your Vercel production URL (e.g. `https://<project>.vercel.app`). `NODE_ENV=production` is already set.
- Run `npm run seed` once (Render Shell) to create the first admin + default content.

**Frontend → Vercel** (config in `client/vercel.json`):
- Set the Vercel project **Root Directory** to `client/` (build `npm run build`, output `dist` — both already in `vercel.json`).
- Set one env var: `VITE_API_URL` = `https://<your-render-service>.onrender.com/api` (baked in at build time).

After both deploy, the site loads data from the Render API, and CORS accepts the Vercel origin. If data doesn't load, check the browser console/network tab: a CORS error means `CLIENT_URL` on Render doesn't match the Vercel origin; a 404/`ERR_NETWORK` means `VITE_API_URL` on Vercel is wrong.

## Performance & deployment

### Env vars, per host

The two hosts need different variables. Nothing is shared between them.

**Vercel (frontend)** — exactly one:

| Var | Value |
|---|---|
| `VITE_API_URL` | `https://<your-render-service>.onrender.com/api` — include `/api`, no trailing slash |

> **`VITE_API_URL` is baked in at build time**, not read at runtime. Vite substitutes it into the JS bundle during `vite build`, so **changing it in the Vercel dashboard does nothing until you redeploy**. It is also what `snapshot.mjs` reads to capture the build-time snapshot — without it you get no snapshot.

**Render (backend)** — `render.yaml` already sets `NODE_ENV`, `JWT_EXPIRES_IN`, `CLOUDINARY_FOLDER`, `NODE_VERSION` and `NPM_CONFIG_LEGACY_PEER_DEPS`. The rest are `sync: false`, i.e. you enter them by hand in the Render dashboard:

| Var | Value |
|---|---|
| `MONGO_URI` | Atlas connection string (allow `0.0.0.0/0` in Atlas → Network Access; Render's egress IPs are not static on the free plan) |
| `JWT_SECRET` | 32+ random chars |
| `CLIENT_URL` | your Vercel production origin, e.g. `https://<project>.vercel.app` |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | dashboard uploads |

> **Do not set `PORT`** — Render injects its own and the server reads it. **Do not set `DNS_SERVERS`** — it's a local-dev escape hatch for machines that can't do `mongodb+srv` SRV lookups; on Render it would force every Atlas lookup out to a public resolver and make each cold start slower.

### The free-plan cold start

Render **spins a free web service down after ~15 minutes with no inbound traffic**. The next visitor's request restarts the container, which takes **roughly 30-60 seconds** before the first byte. This is how the free plan works, not a bug in the app.

`render.yaml` sets `healthCheckPath: /api/health`. That is worth having — a deploy only receives traffic once the new container answers `200`, so Render never flips the domain onto a process that failed to boot, and an instance that stops answering gets restarted. **It does not stop the spin-down**: Render's own probes don't count as inbound traffic, and the idle timer keeps running.

There are only two real remedies.

**(a) Ping it from outside, every 10-14 minutes.** Any of these hit `https://<your-service>.onrender.com/api/health` on a schedule and keep the instance from ever going idle:

| Option | Notes |
|---|---|
| [UptimeRobot](https://uptimerobot.com) | Free tier, 5-minute interval, no card. The usual choice. |
| [cron-job.org](https://cron-job.org) | Free, intervals down to 1 minute, plain HTTP GET. |
| `.github/workflows/keep-warm.yml` | Already in this repo, **opt-in**: it does nothing until you set a `KEEP_WARM_URL` Actions variable or secret. Zero signup, but GitHub's scheduled runners are best-effort — runs are routinely delayed 5-20 minutes and dropped under load, and GitHub disables cron in public repos after ~60 days of inactivity. It reduces cold starts; it doesn't eliminate them. |

> Keeping a free instance awake 24/7 consumes your monthly free instance hours much faster, and leans on the free plan harder than it's meant to be leaned on.

**(b) Move off the free plan.** A paid Render instance never spins down. It is the only option that actually removes the cold start rather than hiding or reducing it.

### What the client-side mitigations do — and don't — fix

The client caches the CMS payload in `localStorage` and ships a build-time snapshot, so a visitor sees the **real, fully-rendered site immediately** instead of an empty page, and the live response swaps in when it lands. That hides the delay for **reads**.

It does **not** eliminate the cold start:

- **Writes still wait the full 30-60 s.** The contact form (`POST /api/public/contact`) has nothing to fall back on — a visitor who submits against a sleeping instance sits on a spinner until the container is up. Admin login at `/admin` is the same.
- **The snapshot is only as fresh as the last Vercel deploy.** CMS edits made after it are invisible until the live fetch resolves (or you redeploy).
- **The container still has to boot.** The API binds its socket *before* connecting to MongoDB (`server/src/index.js`), so the Atlas handshake is no longer part of the critical path — but Render still has to start the process, and the first DB-backed request waits on that handshake via Mongoose's command buffering.

Note what a `200` from `/api/health` does and doesn't prove: it means the process is up **and** has reached MongoDB at least once. It returns `503` until the first connect succeeds — that's what keeps Render from promoting a deploy whose database credentials are wrong. It does *not* track the live connection state afterwards, so a `200` is not proof the database is reachable right now.

### Build-time snapshot (`client/scripts/snapshot.mjs`)

Fetches `<VITE_API_URL>/public/site` during the client build and writes the response to `client/public/site-snapshot.json`, which Vercel then serves from its CDN — so a first-time visitor gets full content while the API is still waking.

```bash
cd client && node scripts/snapshot.mjs
```

It runs automatically as the client's `prebuild` step, so `npm run build` — and therefore every Vercel deploy — refreshes it. **It can never fail a build**: no `VITE_API_URL`, a sleeping API, a non-200, a bad payload or an unwritable disk all log a warning and exit 0 without writing. A 20-second timeout caps how long it will wait on a cold instance, which means **a build kicked off while the API is asleep simply keeps the previous snapshot** — worth re-running a deploy after the API is warm if you want the newest content baked in.

### Re-running the image optimizer (`client/scripts/optimize-images.mjs`)

Run it after adding or replacing anything in `client/public/images/`:

```bash
node client/scripts/optimize-images.mjs          # downscale + re-encode in place, write .webp siblings
node client/scripts/optimize-images.mjs --dry    # report what it would do, write nothing
node client/scripts/optimize-images.mjs --force  # re-encode even files it considers already optimal
```

It downscales (never upscales), re-encodes **in place under the same filename**, and writes a sibling `.webp` for `<picture>`/`srcset`. A re-encode is only kept when it is meaningfully smaller, so **re-running is a no-op** rather than a slow quality slide — `favicon.png` is never touched. Commit both the rewritten originals and the `.webp` files.

> `sharp` is deliberately **not** a dependency of this project — the script resolves it from a parent `node_modules` by normal upward lookup. If it can't find one it prints how to fix it and exits; `npm i -D sharp` in `client/` also works.

---

See **[FUNCTIONS.md](FUNCTIONS.md)** for the full API/function reference, and `SUGGESTIONS.md` for further improvements.
