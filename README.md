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

## History (Apps Script)
- Paste `apps-script/Code.gs` into the sheet's Extensions > Apps Script. Project Settings > Script properties: add `SECRET` (same value as `APPS_SCRIPT_SECRET`). Deploy > New deployment > Web app: Execute as **Me**, access **Anyone**. Copy the `/exec` URL into `APPS_SCRIPT_URL`.
- "Save to history" on the Desert Storm tab posts the selected date to `api/save-history.ts`, which forwards it (with the secret) to Apps Script. Apps Script creates/updates the `History` tab, replacing any earlier rows for that date.
- Publish the `History` tab as CSV and set `HISTORY_CSV_URL`; the History tab reads it through `api/history.ts` (admin only).
- Extra env vars: `APPS_SCRIPT_URL`, `APPS_SCRIPT_SECRET`, `HISTORY_CSV_URL`.
