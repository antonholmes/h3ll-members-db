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

## Deploy (Vercel)
- Import the GitHub repo at vercel.com/new. Framework preset: Vite. Build command `npm run build`, output `dist`.
- Environment variable `ROSTER_CSV_URL` = the published CSV link (mark Sensitive).
- Settings > Git > Deploy Hooks: create one for `main`, save it as the GitHub secret `VERCEL_DEPLOY_HOOK`.
- `.github/workflows/rebuild.yml` calls the hook every 30 minutes so sheet edits go live. Run it on demand from the Actions tab.
- Never commit the CSV link or real exports.
