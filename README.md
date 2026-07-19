# Smart Commercial Energy — Wins Board

A live office-TV dashboard. Rotates through up to six screens and interrupts
with a full-screen branded celebration the moment a deal closes in HubSpot or
a project is marked complete in Microsoft Planner.

**Screens:** Sales leaderboards (FYTD, two teams) · Projects delivered (FYTD tally) ·
Announcements · Photo gallery · Birthdays this month · Work anniversaries this month.

**URLs once deployed:**
- `/` — the TV dashboard (open full-screen on the office TV)
- `/admin` — team page for uploading photos and posting announcements (shared password)

---

## 1. Deploy (≈15 minutes)

1. **Push this folder to GitHub** — create a new repo and push these files.
2. **Import into Vercel** — vercel.com → Add New Project → import the repo. Deploy
   (the first deploy will error until env vars are set — that's fine).
3. **Add storage** (both one-click, free tiers are plenty):
   - Vercel project → Storage → **Upstash for Redis** → create & connect
     (adds `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`).
   - Storage → **Blob** → create (adds `BLOB_READ_WRITE_TOKEN`).
4. **Set env vars** (Project → Settings → Environment Variables — see `.env.example`):
   - `HUBSPOT_TOKEN` — HubSpot → Settings → Integrations → **Private Apps** →
     create "Wins Board", scopes `crm.objects.deals.read` + `crm.objects.owners.read`, copy token.
   - `WEBHOOK_SECRET` — any long random string.
   - `ADMIN_PASSWORD` — the shared team password for `/admin`.
   - `APP_URL` — your deployed URL, e.g. `https://wins-board.vercel.app` (no trailing slash).
5. **Redeploy** (Deployments → ⋯ → Redeploy). Open the URL — the leaderboards
   should populate from HubSpot within a couple of minutes.

The TV keeps everything alive: while the dashboard is open it re-syncs HubSpot
every 2 minutes (safety net) and checks for celebration events every 5 seconds.

## 2. Instant HubSpot celebrations (optional but recommended)

The 2-minute sync already triggers celebrations. For near-instant ones:
HubSpot → Automations → Workflows → Create → trigger **Deal stage is any Closed Won stage**
→ action **Send a webhook** → `POST` to:

    https://YOUR-APP.vercel.app/api/webhooks/hubspot?secret=YOUR_WEBHOOK_SECRET

(If your HubSpot tier doesn't include the webhook workflow action, skip this — the sync covers it.)

## 3. Planner delivery celebrations (Power Automate, ≈10 minutes)

Built by anyone with access to the **Projects** team's plan:

1. make.powerautomate.com → Create → **Automated cloud flow**.
2. Trigger: **When a task is completed (Planner)** → choose the Projects group + plan.
3. (Recommended) Trigger condition so only the delivery task fires, e.g. task title
   contains "Delivered": Settings → Trigger conditions →
   `@contains(triggerOutputs()?['body/title'], 'Delivered')`
4. Action: **HTTP** → `POST` to
   `https://YOUR-APP.vercel.app/api/webhooks/planner?secret=YOUR_WEBHOOK_SECRET`
   Headers: `Content-Type: application/json` · Body:

       { "project": "@{triggerOutputs()?['body/title']}" }

   Name tasks like `P1843 - Shell Coles Express Dianella - Delivered` and strip the
   suffix with `replace(...)` if you like — whatever lands in `project` is what the
   TV announces: *"Great news! {project} has now been completed and handed over to
   Performance. Well done to the team on delivering another successful project!"*
5. Save, then complete a test task — the celebration should appear within seconds.

*(If the HTTP action isn't in your Power Automate licence, use "Add a row into a
table" to an Excel file instead and ask Claude to add the Excel-polling fallback.)*

## 4. Employment Hero (birthdays & anniversaries)

1. Employment Hero → profile menu → **Developer Portal** → Add Application.
   Redirect URI: `https://YOUR-APP.vercel.app/api/eh/callback`. Scopes: read
   access to organisations + employees.
2. Put the Client ID / Client Secret into Vercel env vars (`EH_CLIENT_ID`,
   `EH_CLIENT_SECRET`) and redeploy.
3. Sign in at `/admin`, then visit `/api/eh/connect` and approve. Done — the
   employee list refreshes daily.

Privacy: birthdays show **day and month only** (never year or age); anniversaries
show years of service. To exclude anyone, add their name to `EXCLUDED_NAMES` in
`lib/employmenthero.js`. Give the team a heads-up before switching these screens on.

## 5. Day-to-day

- **Photos / announcements:** anyone with the password → `/admin`.
- **Team changes:** edit `lib/rosters.js`, push — Vercel redeploys automatically.
- **New financial year:** update `FY_START` in `lib/rosters.js`.
- **The TV:** open `/` in a browser, press F11. Screens rotate every 20 s;
  birthday/anniversary/photo screens only appear when they have content.
