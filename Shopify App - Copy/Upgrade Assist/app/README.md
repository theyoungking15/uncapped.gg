# Upgrade Assist Local App

This is the local-first backend for Upgrade Assist. It is designed for:

- running on your PC during development
- accepting storefront-style submissions through an app-proxy-compatible route
- storing submissions locally in JSON
- giving you a simple review UI to approve or reject entries
- attempting Shopify `used_listing` sync when the app is installed on the store
- staying portable so it can later move to a hosted server with minimal changes

## What it does today

- `GET /health` returns a health payload
- `POST /app-proxy/upgrade-assist/submit` accepts Upgrade Assist submissions
- `POST /api/submissions` accepts direct local submissions without Shopify proxy
- `GET /admin` shows a simple review dashboard
- `POST /admin/submissions/:id/status` updates submission status and re-syncs it to Shopify
- `POST /admin/submissions/:id/delete` deletes the local record and tries to delete the synced Shopify metaobject first
- stores uploaded files under `storage/uploads`
- stores submission records in `storage/submissions.json`
- stores Shopify sync state per submission so local review still works when Shopify sync fails

## What it does not do yet

- embed inside Shopify admin
- persist uploaded photos or proof files in Shopify Files
- sync brand metaobject handles or fallback brand text into Shopify with full fidelity yet
- verify real app proxy signatures when `ALLOW_UNSIGNED_PROXY=true`

## Setup

1. Copy `.env.example` to `.env`
2. Fill in:
   - `SHOPIFY_CLIENT_ID`
   - `SHOPIFY_CLIENT_SECRET`
   - optional: `SHOPIFY_USED_LISTING_TYPE` if your metaobject type is not `used_listing`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
3. Install dependencies:

```bash
npm install
```

4. Start the server:

```bash
npm start
```

Default local URL:

- `http://localhost:3000`

## Admin UI

Open:

- `http://localhost:3000/admin`

Use the username and password from `.env`.

If the app is installed on the store and the credentials are correct, the admin page will also show per-card Shopify sync state for each listing.

## Dev Dashboard values once you have a tunnel

If your tunnel URL is:

- `https://abc123.ngrok-free.app`

Then use:

- `App URL` = `https://abc123.ngrok-free.app`
- `Redirect URL` = `https://abc123.ngrok-free.app/auth/callback`
- `App proxy prefix` = `apps`
- `App proxy subpath` = `upgrade-assist`
- `Proxy target path` = `/app-proxy/upgrade-assist`

That means the storefront proxy URL becomes:

- `https://gkmf2d-mn.myshopify.com/apps/upgrade-assist/submit`

and Shopify forwards it to:

- `https://abc123.ngrok-free.app/app-proxy/upgrade-assist/submit`

## Future transition to hosting

This app was intentionally structured so hosting is mostly a config change:

- keep the same Express app
- move `.env` values to the host
- point `APP_PUBLIC_URL` to the hosted domain
- move storage from local JSON/files to a database and Shopify Files later
- replace local submission storage with Shopify-backed persistence when ready
