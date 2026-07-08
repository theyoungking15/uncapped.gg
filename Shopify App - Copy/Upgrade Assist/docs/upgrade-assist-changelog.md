# Upgrade Assist Changelog

## 2026-04-21. Signed-in intake form MVP

**Files changed**
- `sections/upgrade-assist-gate.liquid`
- `docs/UPGRADE_ASSIST_ARCHITECTURE_AND_CHANGELOG_RULES.md`
- `docs/upgrade-assist-architecture.md`
- `docs/upgrade-assist-changelog.md`

**Summary**
Replaced the logged-in placeholder state with a real Upgrade Assist intake form, added client-side validation and conditional field logic, added predictive product search for catalog references, used brand metaobject options when available with a fallback brand field when not available, and kept submission as a safe local preview instead of a fake backend flow.

**Why**
The feature needed to move past the gated placeholder stage into a browser-reviewable MVP without inventing backend infrastructure that does not yet exist.

**Risk / side effects**
The new form is section-local and does not touch other templates, but it now depends on Shopify predictive search for catalog lookup and on theme-exposed brand metaobjects for the primary manual-entry brand selector. File inputs are still preview-only and may be misunderstood unless the existing copy is preserved.

**Rollback note**
Restore the previous `sections/upgrade-assist-gate.liquid` placeholder version and remove the new lowercase docs if the intake-form MVP needs to be rolled back completely.

## 2026-04-21. Local-first app backend and review UI scaffold

**Files changed**
- `app/package.json`
- `app/package-lock.json`
- `app/.env.example`
- `app/README.md`
- `app/src/config.js`
- `app/src/server.js`
- `app/src/lib/submission-store.js`
- `app/src/lib/validation.js`
- `app/src/lib/shopify-admin.js`
- `docs/upgrade-assist-architecture.md`
- `docs/upgrade-assist-changelog.md`

**Summary**
Created a local-first Upgrade Assist app under `Upgrade Assist/app` with a small Express backend, file-backed submission storage, upload handling, a basic-auth protected review UI, app-proxy-compatible submission routes, and a Shopify client-credentials helper prepared for later Admin API integration.

**Why**
The next phase needed a working local app backend so submissions and review logic could move out of the theme and later transition to hosted infrastructure without re-architecting the route shape.

**Risk / side effects**
The app is local-first and only works while the machine and process are running. Review authentication is currently simple basic auth. Local storage is not a final persistence model. The theme form is still not wired to the app yet.

**Rollback note**
Remove the `Upgrade Assist/app` directory and revert the architecture doc changes if you need to go back to the theme-only Upgrade Assist state.

## 2026-04-21. Added dedicated local app docs

**Files changed**
- `docs/upgrade-assist-local-app-runbook.md`
- `docs/upgrade-assist-local-app-overview.md`
- `docs/upgrade-assist-changelog.md`

**Summary**
Added 2 dedicated Upgrade Assist docs: one for the exact local run/setup flow and one for the purpose and responsibilities of the local app.

**Why**
The local app is meant to be reused later, so it needed a simple runbook and a separate explanation file to reduce future setup friction and avoid rediscovering how the backend is supposed to work.

**Risk / side effects**
Documentation-only change. No runtime behavior changed.

**Rollback note**
Remove the 2 new docs and this changelog entry if you want to collapse the documentation back into the existing architecture files only.

## 2026-04-21. Wired the storefront form into the local app

**Files changed**
- `sections/upgrade-assist-gate.liquid`
- `app/src/server.js`
- `docs/upgrade-assist-architecture.md`
- `docs/upgrade-assist-local-app-runbook.md`
- `docs/upgrade-assist-local-app-overview.md`
- `docs/upgrade-assist-changelog.md`

**Summary**
Changed the signed-in Upgrade Assist form from preview-only into a configurable submit flow with 3 modes: `local_app_direct`, `preview_only`, and `shopify_app_proxy`. The default mode now posts directly to `http://localhost:3000/api/submissions`, the local app now returns permissive browser-origin CORS headers for local development, and the form now sends real multipart submissions including files into the local review queue.

**Why**
The project needed a real zero-cost local review loop where a storefront submission can immediately appear in the local admin dashboard for approval or rejection without waiting for hosted infrastructure.

**Risk / side effects**
Direct local submission from a live storefront page depends on the browser allowing the page to reach `http://localhost:3000` on the same machine. If that browser path is blocked, the next step is a tunnel URL plus the `shopify_app_proxy` mode. The local app remains offline whenever the PC or Node process is not running.

**Rollback note**
Switch the section back to `preview_only`, revert `sections/upgrade-assist-gate.liquid`, and remove the browser-origin header middleware from `app/src/server.js` if you need to return to the pre-wiring state.

## 2026-04-21. Upgraded the local admin review UI

**Files changed**
- `app/src/server.js`
- `app/src/lib/submission-store.js`
- `docs/upgrade-assist-architecture.md`
- `docs/upgrade-assist-local-app-overview.md`
- `docs/upgrade-assist-changelog.md`

**Summary**
Added collapsible submission cards with per-browser persistence, added `Archive` and hard `Delete` actions to the local admin, introduced an archived section hidden from the main working columns, and changed the Shopify status panel to show short readable error summaries with raw debug details tucked behind a details toggle.

**Why**
The local admin needed to scale beyond one or two submissions, give you a way to hide or remove stale entries, and stop flooding the dashboard with the full raw HTML body from Shopify OAuth failures.

**Risk / side effects**
Archive is now a real local status and delete now permanently removes both the record and its locally stored uploads. The browser stores collapse state in `localStorage`, so card state can look different across browsers or after manual storage clearing.

**Rollback note**
Revert `app/src/server.js` and `app/src/lib/submission-store.js` to remove archived/delete/collapse behavior and return the admin page to the earlier fixed-card layout and raw-status display.

## 2026-04-22. Added Shopify `used_listing` sync with local fallback

**Files changed**
- `app/.env.example`
- `app/README.md`
- `app/src/config.js`
- `app/src/server.js`
- `app/src/lib/shopify-admin.js`
- `app/src/lib/submission-store.js`
- `docs/upgrade-assist-architecture.md`
- `docs/upgrade-assist-local-app-overview.md`
- `docs/upgrade-assist-local-app-runbook.md`
- `docs/upgrade-assist-changelog.md`

**Summary**
Added best-effort Shopify persistence for Upgrade Assist. New submissions are still saved locally first, then the app attempts to create a `used_listing` metaobject in Shopify, stores per-submission sync state, retries sync on admin status changes, blocks local delete when a synced Shopify delete fails, and exposes Shopify sync status directly on each admin card.

**Why**
The local review loop was already working, but the next step was to stop treating local JSON as the only persistence layer and start moving accepted Upgrade Assist data into Shopify without breaking the zero-cost local workflow.

**Risk / side effects**
This is intentionally conservative sync, not full parity yet. Uploaded files still stay local, brand handles are not yet pushed as Shopify references, and Shopify writes still fail until the custom app is installed on the store. The local queue remains the fallback source of truth whenever Shopify sync errors occur.

**Rollback note**
Revert `app/src/server.js`, `app/src/lib/shopify-admin.js`, `app/src/lib/submission-store.js`, and `app/src/config.js` if you need to go back to local-only Upgrade Assist persistence.

## 2026-04-22. Aligned Shopify sync payload to the live `used_listing` schema

**Files changed**
- `app/src/lib/shopify-admin.js`
- `docs/upgrade-assist-changelog.md`

**Summary**
Adjusted the Shopify field mapping to match the store’s actual `used_listing` schema: status now uses the required JSON list format, `date_listed` and `expiry_date` are populated, relative catalog product URLs are no longer pushed into the URL field, the app uses the live `brand` field key instead of `brand_reference`, and boolean/display values are normalized to the value shapes the existing metaobject entries already use.

**Why**
The first live sync attempt surfaced real schema mismatches from Shopify: `personal_warranty_duration` does not exist, `date_listed` is required, the status field expects JSON list syntax, and the URL field rejects relative product paths. The sync layer needed to match the live store definition instead of the earlier planning assumptions.

**Risk / side effects**
This fix intentionally drops unsupported fields from the first persistence pass and keeps some richer mappings for later. Uploaded files are still local-only and brand syncing still requires a real metaobject GID before it can populate the `brand` reference field.

**Rollback note**
Revert `app/src/lib/shopify-admin.js` if you need to return to the earlier experimental field mapping, but Shopify create/update will fail again against the current live `used_listing` definition.

## 2026-04-22. Synced Upgrade Assist media into Shopify Files and added a public approved-listings page

**Files changed**
- `app/src/lib/shopify-admin.js`
- `app/src/server.js`
- `sections/upgrade-assist-gate.liquid`
- `sections/upgrade-assist-approved-listings.liquid`
- `templates/page.upgrade-assist-approved-listings.json`
- `docs/upgrade-assist-architecture.md`
- `docs/upgrade-assist-local-app-overview.md`
- `docs/upgrade-assist-changelog.md`

**Summary**
Added staged Shopify file uploads for Upgrade Assist photos and proof files, cached the resulting Shopify file IDs back onto the local submission records, attached the primary photo and proof file to the live `used_listing` metaobject, and created a new storefront page template that renders approved `used_listing` entries publicly from the theme.

**Why**
The core record sync was already working, but images and proof files still lived only on the local PC and approved entries had no public storefront surface. This pass moved media into Shopify Files so the listing record can survive without the local upload URL, and added the first public page for approved listings.

**Risk / side effects**
The current `used_listing.photos` field is a single `file_reference`, so the app uploads every selected photo to Shopify Files but attaches only the first photo to the metaobject record until the schema is widened to a list field. The public page depends on the `used_listing` definition being exposed to the Online Store; if storefront access is disabled on that definition, the template will render an empty state.

**Rollback note**
Revert `app/src/lib/shopify-admin.js`, `app/src/server.js`, `sections/upgrade-assist-gate.liquid`, `sections/upgrade-assist-approved-listings.liquid`, and `templates/page.upgrade-assist-approved-listings.json` to go back to local-only media links and remove the public approved-listings page.

## 2026-04-22. Added a storefront-access diagnostic to the approved-listings page

**Files changed**
- `sections/upgrade-assist-approved-listings.liquid`
- `docs/upgrade-assist-changelog.md`

**Summary**
Changed the public approved-listings empty state so it now explicitly tells you when the `used_listing` metaobject definition is not available to the Online Store instead of only showing the generic “No approved listings yet” message.

**Why**
At this point the approved Upgrade Assist entries were already syncing correctly into Shopify, so the remaining failure mode was theme visibility. The page needed to distinguish “no approved data exists” from “approved data exists but storefront access is disabled.”

**Risk / side effects**
This does not change the data source or listing filter. It only changes the empty-state message when the theme cannot access the `used_listing` definition.

**Rollback note**
Revert `sections/upgrade-assist-approved-listings.liquid` to restore the generic empty state.

## 2026-04-22. Made approved Upgrade Assist entries publishable on the storefront

**Files changed**
- `app/src/lib/shopify-admin.js`
- `docs/upgrade-assist-changelog.md`

**Summary**
Changed the Shopify metaobject sync so `approved` Upgrade Assist submissions are written with `capabilities.publishable.status = ACTIVE`, while non-approved entries are written as `DRAFT`.

**Why**
The public approved-listings page was empty even though the synced `used_listing` entries existed, because the entries were being created in Shopify as draft metaobjects. Storefront access on the definition was already enabled; the entry publish state was the actual blocker.

**Risk / side effects**
This pass changes publish state automatically during sync. If a submission is downgraded from `approved` back to `pending_review`, `rejected`, or `archived`, the next sync will now write it back to `DRAFT`.

**Rollback note**
Revert `app/src/lib/shopify-admin.js` if you need to stop the app from controlling Shopify metaobject publish state during sync.

## 2026-04-22. Rethemed the public approved-listings page to the site monochrome palette

**Files changed**
- `sections/upgrade-assist-approved-listings.liquid`

**Summary**
Updated the public approved-listings page styling to use the current site palette centered on `#333333` and `#FFFFFF`, removed the earlier warm/orange accents, and kept the hero as a layered gradient in grayscale so the page still feels dimensional without drifting from the site theme.

**Why**
The approved-listings page layout was already working, but its warm accent colors did not match the current storefront look. This pass keeps the easy-to-maintain structure while aligning it visually with the rest of the site.

**Risk / side effects**
This is a visual-only change. No listing data, filters, publish state, or file-sync behavior changed.

**Rollback note**
Revert `sections/upgrade-assist-approved-listings.liquid` to restore the previous warm accent palette.

## 2026-04-22. Added a Theme Editor width control to the approved-listings page

**Files changed**
- `sections/upgrade-assist-approved-listings.liquid`

**Summary**
Added a `Width` setting to the public approved-listings section with `Page width` and `Full width` options, matching the pattern already used by other sections in the theme. The default is `Page width`.

**Why**
The section already rendered within the page container, but it did not expose the same Theme Editor width control used elsewhere in the site. This pass makes the section easier to align with neighboring sections without editing code again.

**Risk / side effects**
This is configuration-only layout wiring. It does not change listing logic or default behavior.

**Rollback note**
Revert `sections/upgrade-assist-approved-listings.liquid` to remove the width selector and hard-lock the section back to page width.

## 2026-04-22. Added automatic Shopify brand resolution during Upgrade Assist sync

**Files changed**
- `app/src/lib/shopify-admin.js`
- `app/src/server.js`

**Summary**
Added automatic brand resolution to the Upgrade Assist Shopify sync path. Catalog-reference submissions now resolve their `brand` reference from the linked product's `relations.brand` metafield when present, with vendor-handle fallback. Manual-entry submissions now attempt to resolve their selected `brandReference` or `brandNameFallback` handle into the live Shopify `brand` metaobject before syncing the `used_listing`.

**Why**
The `used_listing` records were syncing successfully, but the `brand` reference field could stay blank unless the submission already contained a raw Shopify metaobject GID. This pass closes that gap for normal storefront submissions so the live listing data is more complete and easier to use later for storefront display, filtering, and reporting.

**Risk / side effects**
Brand sync still depends on a real matching Shopify `brand` metaobject existing. Catalog-reference listings are reliable when the referenced product already has `relations.brand` set or when the product vendor maps cleanly to a brand handle. Manual-entry listings still fall back to blank if no matching handle exists in Shopify.

**Rollback note**
Revert `app/src/lib/shopify-admin.js` and `app/src/server.js` to restore the older behavior where the app only writes `brand` when a submission already carries a direct Shopify metaobject GID.

## 2026-04-22. Added multi-photo public gallery support for approved listings

**Files changed**
- `app/src/lib/shopify-admin.js`
- `app/scripts/resync-used-listings.js`
- `app/package.json`
- `sections/upgrade-assist-approved-listings.liquid`
- `docs/upgrade-assist-architecture.md`
- `docs/upgrade-assist-local-app-overview.md`
- `docs/upgrade-assist-local-app-runbook.md`

**Summary**
Changed the Upgrade Assist sync layer so `used_listing.photos` is now written as a list of Shopify file references in upload order, added a local resync command for backfilling existing listings after the schema change, and upgraded the public approved-listings cards to render a main image plus a thumbnail row when multiple synced photos are available.

**Why**
The form and local app already accepted multiple photos, but only the first image was attached to the public listing because the live `used_listing.photos` field was still being written as a single file reference. This pass closes that product gap and makes multiple submitted photos visible on the public approved listings page.

**Risk / side effects**
This code now expects `used_listing.photos` to be a list-of-files field in Shopify. Until that one-time schema change is made in Shopify Admin, syncing any listing with photos will return a schema-mismatch error telling the operator to widen the field. After changing the schema, existing listings need to be re-synced with `npm run resync:shopify` to populate the gallery field.

**Rollback note**
Revert `app/src/lib/shopify-admin.js`, `app/scripts/resync-used-listings.js`, `app/package.json`, and `sections/upgrade-assist-approved-listings.liquid` to return to the previous single-photo public listing behavior.

## 2026-04-22. Added Upgrade Assist Phase 1 browsing and review controls

**Files changed**
- `app/src/server.js`
- `app/src/lib/validation.js`
- `sections/upgrade-assist-gate.liquid`
- `sections/upgrade-assist-approved-listings.liquid`

**Summary**
Added the first real browsing and review ergonomics layer for Upgrade Assist. The public approved-listings page now has client-side search, brand/condition/location filters, sorting, and a detail modal, while the local admin now has search/filter controls plus a manual `Re-sync Shopify` action per listing. The storefront intake form now also requires at least one photo and a usable contact target before submission.

**Why**
The core submit-review-sync loop already worked, but browsing approved listings was still a flat card feed and the admin review panel still required manual scanning for every listing. The intake form also allowed weak submissions that had no photos or no actionable contact detail. This pass makes the live workflow more usable without changing the overall architecture.

**Risk / side effects**
The public filters and detail modal are client-side only, so they depend on the latest section JavaScript being live in the theme. The new submit validation is stricter: new submissions now fail if they have no uploaded photos or if `Messenger` / `Phone` is selected without a contact value.

**Rollback note**
Revert `app/src/server.js`, `app/src/lib/validation.js`, `sections/upgrade-assist-gate.liquid`, and `sections/upgrade-assist-approved-listings.liquid` to restore the previous simpler browsing/admin behavior and the looser submit rules.

## 2026-04-22. Added a customer-account completeness gate before Upgrade Assist submission

**Files changed**
- `sections/upgrade-assist-gate.liquid`
- `app/src/lib/validation.js`
- `app/src/server.js`

**Summary**
Upgrade Assist submissions are now blocked unless the signed-in customer account already has the required profile fields. The theme now checks for account email, first name, last name, and phone number before rendering the form, shows a blocking callout with a link back to the customer account page when any of those fields are missing, and sends the account profile snapshot with valid submissions so the local app can reject incomplete-profile posts server-side too.

**Why**
The next contact-linking phase depends on real customer-account data. This pass enforces that a listing cannot enter review unless the seller account is populated enough to support later buyer contact and customer-linked listing ownership.

**Risk / side effects**
Customers who previously could submit with only an email now need to finish their profile first. Existing stored submissions are unaffected; this only changes new submissions.

**Rollback note**
Revert `sections/upgrade-assist-gate.liquid`, `app/src/lib/validation.js`, and `app/src/server.js` to remove the account-completeness gate and return to the previous looser submission rules.

## 2026-04-23. Added a first customer-account profile extension source and config generator

**Files changed**
- `app/extensions/customer-account-settings/package.json`
- `app/extensions/customer-account-settings/shopify.extension.toml`
- `app/extensions/customer-account-settings/src/ProfileSettingsExtension.jsx`
- `app/scripts/generate-shopify-app-config.js`
- `app/shopify.app.customer-account.template.toml`
- `app/package.json`
- `app/.gitignore`
- `docs/upgrade-assist-local-app-overview.md`
- `docs/upgrade-assist-architecture.md`

**Summary**
Added the first customer-account UI extension source to the same Shopify app workspace. The new profile-block extension is meant to let customers edit `Username` and `Preferred contact method` directly from Shopify customer accounts, while still using the existing merchant-owned metafield keys `custom.public_handle` and `custom.preferred_contact_method`. This pass also added a small config generator so the current local app can produce a baseline `shopify.app.toml` for Shopify CLI when you are ready to preview or deploy the extension.

**Why**
The customer metafield definitions now exist in Shopify, but the default customer account profile page does not render those fields automatically. The next real step is a customer-account UI layer that lets customers read and update those values themselves instead of relying on manual admin edits.

**Risk / side effects**
The extension source is now present in the app folder, but it is not live until Shopify CLI is installed, the generated `shopify.app.toml` is linked to the app, and the extension is deployed. The `Username` label is a UI/display rename only; the stored metafield key remains `custom.public_handle`.

**Rollback note**
Remove `app/extensions/customer-account-settings`, `app/scripts/generate-shopify-app-config.js`, and `app/shopify.app.customer-account.template.toml`, then revert the package/doc updates if you want to return the app to a backend-only structure.

## 2026-04-23. Fixed customer-account extension dependency resolution for Shopify CLI builds

**Files changed**
- `app/extensions/customer-account-settings/package.json`

**Summary**
Corrected the customer-account extension package versions to real published Shopify UI extension package versions and installed the extension-local dependencies so Shopify CLI can resolve `react`, `react/jsx-runtime`, and `@shopify/ui-extensions-react/customer-account` during bundling.

**Why**
The first extension scaffold used a non-existent `@shopify/ui-extensions-react@2026.1.x` version, and the extension directory did not yet have its own installed dependencies. Shopify CLI therefore failed to bundle the extension during deploy/link flows.

**Risk / side effects**
The extension now depends on the installed package set inside `app/extensions/customer-account-settings/node_modules`. This is expected for a Shopify UI extension and does not change runtime behavior beyond allowing the extension to build.

**Rollback note**
Revert `app/extensions/customer-account-settings/package.json` if you need to return to the previous package pins, but that will bring the Shopify CLI bundling error back.

## 2026-04-23. Added the first My Builds save route and saved-build creation support to the local app

**Files changed**
- `app/src/config.js`
- `app/.env.example`
- `app/src/lib/shopify-admin.js`
- `app/src/server.js`

**Summary**
Extended the same local Shopify app workspace so it now supports customer-owned `saved_build` creation in addition to Upgrade Assist listing sync. The backend now exposes a proxied `POST /my-builds/save` route, validates the proxied logged-in customer ID, and creates a `saved_build` metaobject record using the existing merchant-owned Shopify app credentials.

**Why**
`My Builds` is being implemented as a storefront-plus-app-proxy feature first, not a customer-account extension. That means the existing installed app needed a create route and Shopify persistence helper for customer-owned saved builds before the PC Builder could add a safe `Save Build` action.

**Risk / side effects**
This expands the responsibilities of the local app beyond Upgrade Assist submissions. The added route is isolated under the existing app proxy base path and does not change current Upgrade Assist submission, admin, or storefront behavior.

**Rollback note**
Revert `app/src/config.js`, `app/.env.example`, `app/src/lib/shopify-admin.js`, and `app/src/server.js` to remove saved-build creation support from the local app.

## 2026-04-24. Added saved-build lifecycle routes for rename, archive, share, and delete

**Files changed**
- `app/src/lib/shopify-admin.js`
- `app/src/server.js`

**Summary**
Extended the same local Shopify app so customer-owned `saved_build` records can now be updated and deleted through owner-checked app-proxy routes. The backend now supports `rename`, `archive`, `unarchive`, `share`, and hard `delete` actions by resolving the saved build by handle, verifying the proxied `logged_in_customer_id` owns it, and then updating or deleting the existing Shopify metaobject.

**Why**
`My Builds` already had working save/list/open behavior. The next required step was a real saved-build lifecycle so customers can manage old builds from the storefront without touching the underlying PC Builder implementation.

**Risk / side effects**
This adds more customer-owned mutation routes under the existing app proxy base path. Hard delete removes the `saved_build` metaobject permanently, but it does not delete the underlying quote record or any existing PC Builder logs.

**Rollback note**
Revert `app/src/lib/shopify-admin.js` and `app/src/server.js` to remove saved-build mutation support and return `My Builds` to save/list/open only.
