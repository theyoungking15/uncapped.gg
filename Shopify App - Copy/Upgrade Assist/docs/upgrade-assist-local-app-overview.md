# Upgrade Assist Local App Overview

This file explains what the local Upgrade Assist app does and what it does not do yet.

## Purpose
The local app is the first backend layer for Upgrade Assist.

Its job is to move the project beyond theme-only preview mode by giving you:

- a place to receive submissions
- a place to review them
- a place to approve or reject them
- a backend structure that can later be hosted elsewhere

## What it does today
The local app currently provides:

- a Node/Express backend
- a local review dashboard
- local file handling for uploaded evidence
- local JSON storage for submissions
- app-proxy-compatible routes for future Shopify wiring
- a Shopify client-credentials helper and `used_listing` sync layer for Admin API writes
- source files for a future customer-account profile extension tied to the same Shopify app

## What it is responsible for
### 1. Receiving submissions
The app can receive submissions through:

- `POST /api/submissions` for local direct testing
- `POST /app-proxy/upgrade-assist/submit` for the future Shopify app proxy path

### 2. Normalizing and validating data
The app normalizes incoming fields and validates required values before saving anything.

Main validation logic lives in:

- [validation.js](D:/Prince/Shopify%20App/Upgrade%20Assist/app/src/lib/validation.js)

### 3. Storing local records
The app stores submission records in:

- [submissions.json](D:/Prince/Shopify%20App/Upgrade%20Assist/app/storage/submissions.json)

That lets you review the full flow without needing paid hosting or Shopify writes yet.
It also means the app can keep working locally even if Shopify sync fails.

### 4. Storing uploaded files locally
Uploaded files are saved under:

- [uploads](D:/Prince/Shopify%20App/Upgrade%20Assist/app/storage/uploads)

This is only local file storage for now.

### 5. Reviewing submissions
The app exposes a simple review UI at:

- `GET /admin`

From there you can:

- inspect pending entries
- mark them `approved`
- mark them `rejected`
- archive them out of the main working view
- move them back to `pending_review`
- permanently delete them with their local uploaded files
- collapse cards in the browser to skim large queues faster
- see whether each listing has synced to Shopify or failed to sync

## What it does not do yet
The local app does not yet:

- upload files into Shopify Files
- embed itself inside Shopify admin
- publish approved listings to the storefront
- authenticate reviewers through Shopify admin auth
- receive live traffic reliably when your PC is off
- fully sync brand handles into Shopify metaobject reference fields yet

## Current architecture
### Main app file
- [server.js](D:/Prince/Shopify%20App/Upgrade%20Assist/app/src/server.js)

This file:

- starts Express
- defines the routes
- accepts uploads
- handles submission creation
- renders the admin UI
- updates review status
- deletes local submissions
- creates or updates Shopify `used_listing` entries when possible
- converts noisy Shopify status failures into shorter admin-safe messages

### Config
- [config.js](D:/Prince/Shopify%20App/Upgrade%20Assist/app/src/config.js)

This file controls:

- local port
- public app URL
- Shopify store domain
- proxy settings
- admin credentials

### Submission storage
- [submission-store.js](D:/Prince/Shopify%20App/Upgrade%20Assist/app/src/lib/submission-store.js)

This file handles:

- creating records
- listing records
- status updates
- count summaries

### Validation
- [validation.js](D:/Prince/Shopify%20App/Upgrade%20Assist/app/src/lib/validation.js)

This file handles:

- field normalization
- required-field validation
- conditional validation

### Shopify helper
- [shopify-admin.js](D:/Prince/Shopify%20App/Upgrade%20Assist/app/src/lib/shopify-admin.js)

This file is the seam for future Shopify work:

- client-credentials token fetch
- Admin API GraphQL helper
- `used_listing` create/update/delete helpers
- staged Shopify file upload + file delete helpers
- basic proxy-signature verification helper

### Customer account extension source
- [extensions/customer-account-settings](D:/Prince/Shopify%20App/Upgrade%20Assist/app/extensions/customer-account-settings)

This directory now holds the first customer-account UI extension source for the same Shopify app. It is intended to render a profile block in Shopify customer accounts so customers can edit `Username` and `Preferred contact method` through the Customer Account API later.

## Why this structure matters
This local app was designed so the next transition is easy:

- keep the same route structure
- move the app from your PC to hosted infrastructure later
- keep local JSON/file storage as the fallback while Shopify sync matures
- keep the admin review flow conceptually the same

So the app is not throwaway work. It is the first backend version of Upgrade Assist.

## How it fits with the theme
Current split:

- theme = customer-facing gated form UI
- local app = backend intake + review layer

Right now, the theme form can either stay in preview mode or submit directly to the local app.

The next integration step is:

1. use `Direct local app` for the zero-cost local review loop
2. later switch the same form to the Shopify app proxy mode
3. let Shopify forward that request to this app
4. later replace local storage with Shopify `used_listing` creation

Current sync behavior:

- every new submission is saved locally first
- the app then uploads the primary photo / proof file into Shopify Files when present
- the app then resolves the Shopify `brand` reference automatically from the catalog product relation or a matching submitted brand handle when possible
- the app then attempts to create or update a Shopify `used_listing`
- when `used_listing.photos` is configured as a list-of-files field, every selected photo is attached publicly in upload order instead of only the first image
- if Shopify sync fails, the local record stays intact and stores the sync error
- admin status changes try to re-sync the same submission
- local delete will refuse to remove a synced record if the Shopify delete fails
- synced files are deleted from Shopify when a local hard delete succeeds
- the app folder now also contains a profile-block customer-account extension source that writes `custom.public_handle` and `custom.preferred_contact_method` through the Customer Account API once deployed

## Long-term transition
When you host this later, the intended path is:

- same Node app
- same routes
- same config shape
- new hosted HTTPS domain
- later real Shopify persistence

That is why the local app already has:

- `APP_PUBLIC_URL`
- app proxy base path config
- Shopify token helper

## Bottom line
The local app is the backend starting point for Upgrade Assist.

Today it gives you:

- a free local review workflow
- a working backend skeleton
- live Shopify `used_listing` persistence with Shopify-hosted file references
- a public approved-listings page template on the theme side
- support for multi-photo public galleries after the one-time Shopify `used_listing.photos` schema update
- a clean migration path to hosted infrastructure later

It is not yet the final Shopify-integrated production system, but it is the correct base for getting there.
