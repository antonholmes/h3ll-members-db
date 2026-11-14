# H3ll Members DB

Static roster site. Data lives in a Google Sheet (`name, power, role, squad`), is fetched and validated at build time, and shipped as a static bundle.

## Data
1. Sheet header row: `name, power, role, squad`.
2. File > Share > Publish to web > pick the roster tab > CSV > Publish. Copy the URL.
3. Local: `cp .env.example .env`, then `ROSTER_CSV_URL=<url> npm run fetch`. Without the variable the build uses `sample-roster.csv`.

## Run
- Needs Node >=22.13 (`.nvmrc` pins 26; run `nvm use`).
- `npm run dev`
- `npm run build` (fetch, validate, type-check, bundle to `dist/`)

## Deploy (Cloudflare Pages)
- Build command `npm run build`, output directory `dist`, env vars `ROSTER_CSV_URL` and `NODE_VERSION=26`.
- Create a deploy hook in Pages settings and save it as the GitHub secret `CF_PAGES_DEPLOY_HOOK`; `.github/workflows/rebuild.yml` triggers a rebuild every 30 minutes so sheet edits go live.
- Gate access with Cloudflare Zero Trust > Access > Applications (free up to 50 users, email one-time PIN).
