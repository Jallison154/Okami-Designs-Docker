# Okami Designs Website

Public site and API for [okamidesigns.com](https://okamidesigns.com) — AV / event-production tools, a tools catalog, 3D prints, and an admin panel.

**Live surfaces:** home, services, support, contact, Tools hub, LED Video Wall Calculator, Okami Signal Lab, 3D prints (Cults3D), password-protected admin + analytics.

**Developer docs:** [Contributing](docs/CONTRIBUTING.md) · [Adding a tool](docs/ADDING-A-TOOL.md) · [Script load order](docs/SCRIPT-LOAD-ORDER.md) · [Admin login](docs/ADMIN-LOGIN-SETUP.md) · [Commercial architecture](ARCHITECTURE-COMMERCIAL.md)

## Stack

| Layer | Choice |
|--------|--------|
| Runtime | Node.js 18+ (Express) |
| Frontend | Multi-page HTML + vanilla JS |
| Styles | `styles.css` (dark grey + orange, Montserrat) |
| Data | JSON under `files/` (no database) |
| Deploy | Docker image for the API; optional Nginx; Cloudflare Tunnel friendly |

## Quick start (local)

```bash
cp .env.example .env
# Set ADMIN_PASSWORD_HASH (see docs/ADMIN-LOGIN-SETUP.md) and/or ADMIN_DEV_PASSWORD for local admin
npm install
npm run dev          # http://localhost:3000
```

Production-style without nodemon: `npm start`.

Useful scripts: `npm run test:gate`, `npm run test:calculations`, `npm run test:api`, `npm run generate:sitemap`.

## Docker

The app reads **`PORT` from the environment** (default `3000`) via `server/config/app-config.js`.

```bash
cp .env.example .env   # required — compose loads env_file: .env
docker compose up -d --build          # API only on :3000
docker compose --profile with-nginx up -d --build   # also start Nginx on :80/:443
```

| Service | Role |
|---------|------|
| `okami-designs-api` | Builds from `Dockerfile`, runs `server.js`, persists `./files` |
| `okami-designs-web` | Optional Nginx (`profiles: [with-nginx]`) — not needed if Cloudflare Tunnel (or another proxy) targets the API container directly |

### Environment

See `.env.example`. Important for any deploy:

- `PORT` — listen port inside the container (compose maps host → `3000`)
- `ADMIN_PASSWORD_HASH` / `ADMIN_SESSION_SECRET` — admin login
- `OKAMI_CORS_ALLOWED_ORIGINS` — production CORS allowlist
- Cults3D / commercial vars — optional; commercial stays off until phase gates say otherwise

### Nginx note

`nginx.conf` is written for the **Docker Compose** layout:

- `root /var/www/okami-designs` — path inside the Nginx container (compose bind-mounts the repo there)
- `proxy_pass http://okami-designs-api:3000` — Docker network hostname, not a host path

It is **not** a bare-metal `/var/www/...` install config by itself. If you route with Cloudflare Tunnel → Node only, you can omit the Nginx service entirely (default `docker compose up` already does).

## Project layout (high level)

```
server.js                 # Express entry
server/                   # API, admin auth, tools, Cults3D, commercial
shared/registry/pages.js  # Page + tool registry (nav, routes, visibility)
client/                   # Browser helpers (tools hub, prints, home)
tools/                    # Tools hub + detail shells (first-party apps are standalone repos)
files/                    # Runtime JSON + uploads (tools.json, analytics, icons)
docs/                     # Contributor docs
admin.html                # Admin UI
home.html                 # Public landing (when constructionMode is off)
index.html                # Construction splash (when constructionMode is on)
```

Routing and Tools nav are driven by `shared/registry/pages.js`. Adding a first-party tool: see [docs/ADDING-A-TOOL.md](docs/ADDING-A-TOOL.md).

## Construction mode

`files/site-settings.json` controls `constructionMode`. When `true`, `/` serves the splash (`index.html`). When `false`, `/` serves `home.html`. Admins can still open the splash at `/index.html` while the site is live.

## Brand / UI

- Background `#333333`, text `#e6e6e6`, accent `#FF6A2D`
- Prefer bumping `?v=` cache-busters on CSS/JS when shipping visible front-end changes

## Support / ops

```bash
docker logs okami-designs-api
docker compose ps
docker compose restart
```
