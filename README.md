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
- Environment variables (mark all Sensitive): `ROSTER_CSV_URL`, `DESERT_STORM_CSV_URL` (published CSV links), `ADMIN_USER`, `ADMIN_PASSWORD` (a long passphrase), `SESSION_SECRET` (`openssl rand -hex 32`).
- Settings > Git > Deploy Hooks: create one for `main`, save it as the GitHub secret `VERCEL_DEPLOY_HOOK`.
- `.github/workflows/rebuild.yml` calls the hook every 30 minutes so sheet edits go live. Run it on demand from the Actions tab.
- Never commit the CSV link or real exports.

## Admin login
- Desert Storm is admin-only. The "Admin login" link sits under the Ranks card; once signed in, a Desert Storm tab appears.
- `api/login.ts` checks `ADMIN_USER`/`ADMIN_PASSWORD` and sets a signed HttpOnly cookie (7 days). `api/desert-storm.ts` fetches the sheet server-side, only for a valid cookie, so the data is not in the site files.
- Locally, `npm run dev` serves the same `/api` handlers (see `vite.config.ts`). To try fake data, run with `DESERT_STORM_CSV_URL=` empty to use `sample-desert-storm.csv`.
- Change the password: edit the variable in Vercel and redeploy.
