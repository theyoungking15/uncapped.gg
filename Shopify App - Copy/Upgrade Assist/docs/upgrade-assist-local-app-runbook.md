# Upgrade Assist Local App Runbook

This file explains exactly how to run the local Upgrade Assist app again in the future.

## App location
- `Upgrade Assist/app`

## What this local app is for
Use this app when you want to:

- receive Upgrade Assist submissions locally
- review pending submissions on your PC
- approve or reject them from a simple admin page
- prepare the project for later hosting without changing the route structure

This app is local-first. It only works while your PC, the Node process, and later the tunnel are running.

## Theme mode for local review
The Upgrade Assist theme section now supports 3 submission modes:

- `Direct local app`
- `Preview only`
- `Shopify app proxy`

For your current local-review workflow, use:

- `Direct local app`

and keep the section submit URL as:

- `http://localhost:3000/api/submissions`

## Before first run
Open this folder:

- [app](D:/Prince/Shopify%20App/Upgrade%20Assist/app)

Create a real `.env` file from:

- [app/.env.example](D:/Prince/Shopify%20App/Upgrade%20Assist/app/.env.example)

Minimum values to review locally:

```env
PORT=3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-this
ALLOW_UNSIGNED_PROXY=true
```

Recommended values to also prepare Shopify integration:

```env
SHOPIFY_STORE_DOMAIN=gkmf2d-mn.myshopify.com
SHOPIFY_CLIENT_ID=your-client-id
SHOPIFY_CLIENT_SECRET=your-client-secret
SHOPIFY_USED_LISTING_TYPE=used_listing
APP_PUBLIC_URL=https://your-tunnel-or-host.example.com
APP_PROXY_PREFIX=apps
APP_PROXY_SUBPATH=upgrade-assist
APP_PROXY_BASE_PATH=/app-proxy/upgrade-assist
```

For local-only use, `APP_PUBLIC_URL` can stay blank.

## Install dependencies
In PowerShell:

```powershell
cd "D:\Prince\Shopify App\Upgrade Assist\app"
npm install
```

## Start the server
In PowerShell:

```powershell
cd "D:\Prince\Shopify App\Upgrade Assist\app"
npm start
```

If it starts correctly, the server runs at:

- `http://localhost:3000`

## Useful local URLs
- Root: `http://localhost:3000/`
- Health: `http://localhost:3000/health`
- Admin review UI: `http://localhost:3000/admin`

## Admin login
Use the credentials from your `.env`:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

Default sample values from the example file are:

- username: `admin`
- password: `change-this`

Change them before using this for real testing.

## Where submissions are stored
Local submission records:

- [storage/submissions.json](D:/Prince/Shopify%20App/Upgrade%20Assist/app/storage/submissions.json)

Uploaded files:

- [storage/uploads](D:/Prince/Shopify%20App/Upgrade%20Assist/app/storage/uploads)

The local app still keeps a local copy of every submission and upload, but successful syncs also write the `used_listing` data and Shopify-hosted file references into Shopify.

## One-time Shopify photo schema step
Before multi-photo approved listings can work publicly, update the `used_listing.photos` field in Shopify Admin:

1. Go to `Settings -> Custom data -> Metaobjects -> used_listing`
2. Open the `photos` field
3. Change it from a single `File` / `file_reference` field to a list-of-files field
4. Save the definition

If Shopify blocks changing the type in place, delete and recreate the `photos` field with the same key as a list-of-files field, then run the resync command below.

## Backfill existing listings after the photo schema change
Run this after widening `used_listing.photos` so older local submissions repopulate the public gallery field:

```powershell
cd "D:\Prince\Shopify App\Upgrade Assist\app"
npm run resync:shopify
```

You can also target specific submission IDs:

```powershell
cd "D:\Prince\Shopify App\Upgrade Assist\app"
node scripts/resync-used-listings.js 8ad1bc85-d60c-4f24-8a44-74406b53020e
```

## How to test it quickly
### 1. Check health
Open:

- `http://localhost:3000/health`

Expected:
- JSON response with `ok: true`

### 2. Open the admin review UI
Open:

- `http://localhost:3000/admin`

Expected:
- basic-auth prompt
- after login, the Upgrade Assist admin page loads

### 3. Create a quick local test submission
Use the direct local route:

- `POST http://localhost:3000/api/submissions`

This route is for local testing before Shopify app proxy wiring is active.

### 3b. Create a real submission from the storefront form
Once the theme section is set to `Direct local app`, the signed-in Upgrade Assist page can also submit directly to:

- `http://localhost:3000/api/submissions`

Expected:
- the storefront form returns a success response panel
- the submission appears in the local admin page under `Pending review`

### 4. Check the admin page again
Expected:
- the new submission appears under `Pending review`
- the card shows a Shopify sync state such as `Synced` or `Sync error`

### 5. Approve or reject it
Use the buttons in the admin page:

- `Approve`
- `Reject`
- `Set pending`
- `Archive`
- `Delete`

Expected:
- status changes immediately in local storage
- the app tries to sync that status change to Shopify again

## Routes you should remember
Public/local utility routes:

- `GET /health`
- `GET /`

Local direct test route:

- `POST /api/submissions`

Proxy-compatible route for Shopify later:

- `POST /app-proxy/upgrade-assist/submit`

Admin UI routes:

- `GET /admin`
- `GET /api/submissions`
- `POST /admin/submissions/:id/status`

## When you are ready to connect Shopify
Once you have a tunnel URL or hosted backend URL, set:

- `APP_PUBLIC_URL`

Then in Shopify Dev Dashboard, use:

- `App URL` = your public app URL
- `Redirect URL` = `https://your-public-url/auth/callback`
- App proxy prefix = `apps`
- App proxy subpath = `upgrade-assist`
- Proxy target path = `/app-proxy/upgrade-assist`

Resulting storefront submit URL later:

- `https://gkmf2d-mn.myshopify.com/apps/upgrade-assist/submit`

## Known operational limits
- If your PC is off, the app is offline.
- If the app process is stopped, submissions fail.
- If the tunnel is down, Shopify cannot reach the app.
- This app stores data locally first and only syncs to Shopify if the app is installed and credentials are valid.
- Uploaded photos and proof files are also uploaded into Shopify Files when sync succeeds.
- Multi-photo public galleries require the one-time `used_listing.photos` schema change in Shopify Admin before resyncing old listings.
- Direct storefront submission to `http://localhost:3000` depends on the browser allowing the live page to reach localhost on the same machine.

## Safe shutdown
To stop the app:

- return to the PowerShell window running `npm start`
- press `Ctrl + C`

If you want a clean empty state again, you can clear:

- [storage/submissions.json](D:/Prince/Shopify%20App/Upgrade%20Assist/app/storage/submissions.json)

Do not delete uploads unless you intentionally want to remove local test files.
