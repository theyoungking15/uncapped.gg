# Upgrade Assist Architecture

## Feature summary
Upgrade Assist now has 2 implementation layers:

- a Shopify theme-side gated intake form
- a separate local-first app backend and review UI

Current MVP scope:

- logged-out users are still gated behind sign-in
- logged-in users can fill out the Upgrade Assist intake form in the theme
- a local app can receive, store, and review submissions
- the local app attempts to create, update, and delete Shopify `used_listing` entries
- the app can mark submissions as `pending_review`, `approved`, `rejected`, or `archived`
- the app can permanently delete local submissions and their uploaded files

Current out-of-scope items:

- automatic creation of live storefront listings from approved entries
- checkout/cart behavior for used items
- hosted production deployment
- embedded Shopify admin app UI
- Shopify file persistence for uploads
- full multi-file parity for media/reference fields

## User flow
### Logged-out flow
The customer visits the Upgrade Assist page and sees:

- the page heading/subheading
- sign-in CTA
- create-account CTA

The sign-in link includes `return_to` so the customer is returned to the same page after login.

### Logged-in flow
The signed-in state renders the Upgrade Assist intake form directly in:

- `sections/upgrade-assist-gate.liquid`

That form currently:

- explains the review-first process
- validates fields in the browser
- supports catalog reference vs manual entry
- can run in `preview_only`, `local_app_direct`, or `shopify_app_proxy` mode
- defaults to direct local-app submission at `http://localhost:3000/api/submissions`

Important current state:

- the theme can now submit directly to the local app from the storefront browser
- the Shopify app proxy path is prepared but still depends on tunnel/hosting setup

### Review-before-public logic
The review workflow currently lives in the local app review UI:

- new app submissions are stored as `pending_review`
- each new submission is then synced to Shopify on a best-effort basis
- you review them in the local admin page
- you can change status to `approved`, `rejected`, `archived`, or back to `pending_review`
- you can permanently delete a local submission
- cards can be collapsed per browser so long admin queues are easier to skim
- each card shows whether the matching Shopify `used_listing` sync succeeded or failed

Approval does not yet publish anything on the storefront. That later publish step still needs to be built.

## Theme structure
### Theme files
- `templates/page.upgrade-assist.json`
- `sections/upgrade-assist-gate.liquid`

### Theme behavior
- gating remains in Liquid
- client-side validation and submit logic live inline in the section
- predictive search is used for catalog lookup
- brand metaobject values are used when exposed to the theme
- submission mode and endpoint settings are exposed in the section schema

## Local app structure
The local app lives in:

- `Upgrade Assist/app`

### Core files
- `app/src/server.js`
- `app/src/config.js`
- `app/src/lib/submission-store.js`
- `app/src/lib/validation.js`
- `app/src/lib/shopify-admin.js`
- `app/.env.example`
- `app/README.md`

### Local storage
- `app/storage/submissions.json`
- `app/storage/uploads/`

### App routes
- `GET /health`
- `GET /`
- `GET /auth/callback`
- `GET /admin`
- `GET /api/submissions`
- `POST /api/submissions`
- `GET /app-proxy/upgrade-assist`
- `POST /app-proxy/upgrade-assist/submit`
- `POST /admin/submissions/:id/status`
- `POST /admin/submissions/:id/delete`

### App behavior
- accepts multipart or standard form submissions
- stores uploads locally
- stores submission records in local JSON
- exposes a basic-auth protected review dashboard
- supports collapse/expand state in the browser for admin cards
- supports archive and hard-delete actions in the local admin
- attempts Shopify `used_listing` create/update/delete after local actions
- stores Shopify sync state on the local submission record
- is structured so hosting later is mostly a config change

## Form structure
The theme form is split into these sections:

1. Item Identification
2. Brand
3. Seller Details
4. Photos and Proof
5. Warranty
6. Contact and Agreement

The local app validates the same business shape again server-side through:

- `normalizePayload()`
- `validatePayload()`

in:

- `app/src/lib/validation.js`

## Data mapping
### Theme-side form payload shape
The theme currently assembles a preview payload inside:

- `buildPayload_()` in `sections/upgrade-assist-gate.liquid`

### Local app submission shape
The local app stores normalized records using these keys:

- `sellerCustomerId`
- `sourceType`
- `referencedProduct`
- `referencedProductTitle`
- `referencedProductUrl`
- `manualTitle`
- `manualModel`
- `externalProductUrl`
- `brandReference`
- `brandNameFallback`
- `askingPrice`
- `conditionGrade`
- `cityRegion`
- `usageNotes`
- `issueDisclosures`
- `photos`
- `proofOfPurchaseStatus`
- `proofOfPurchaseFile`
- `personalWarrantyOffered`
- `personalWarrantyDuration`
- `stillInWarranty`
- `contactPreference`
- `sellerAgreementAccepted`
- `status`
- `reviewNotes`
- `publishedAt`
- `shopifyMetaobjectId`
- `shopifyMetaobjectHandle`
- `shopifySyncStatus`
- `shopifySyncError`
- `shopifyLastSyncedAt`

### Mapping intent to `used_listing`
The local app now maps these values into the live Shopify-side `used_listing` model:

- `status`
- `date_listed`
- `expiry_date`
- `seller_customer_id`
- `source_type`
- `referenced_product`
- `manual_title`
- `manual_model`
- `external_product_url`
- `brand`, resolved automatically from catalog-reference product brand relations or matching brand handles when possible
- `asking_price`
- `condition_grade`
- `city_region`
- `usage_notes`
- `issue_disclosures`
- `photos`
- `proof_of_purchase_status`
- `proof_of_purchase_file`
- `personal_warranty_offered`
- `still_in_warranty`
- `contact_preference`
- `seller_agreement_accepted`
- `admin_notes`

## Integration seam
There are now 2 clear integration seams.

### 1. Theme -> local app
The theme submit handler in:

- `sections/upgrade-assist-gate.liquid`

can now:

- stay in preview-only mode
- POST directly to the local app at `http://localhost:3000/api/submissions`
- later POST to:

- `/apps/upgrade-assist/submit` on the storefront

which Shopify should proxy to:

- `/app-proxy/upgrade-assist/submit` in the local app

### 2. Local app -> Shopify Admin API
The app already includes Shopify client-credentials support in:

- `app/src/lib/shopify-admin.js`

Current use:

- connection-status check
- `used_listing` create/update/delete sync
- staged Shopify file uploads for photos and proof files
- Shopify file delete on local hard delete

Future use:

- move away from local JSON/file storage
- improve remaining reference-field fidelity beyond the current brand/file mappings
- extend the new public filtering/search/detail layer into a fuller marketplace browse flow

### 3. Shopify app -> Customer Account UI extension
The same app folder now also includes a customer-account profile-block extension source under:

- `app/extensions/customer-account-settings`

Its current intended role is:

- render a customer account settings card on the Shopify Profile page
- expose `Username` backed by `custom.public_handle`
- expose `Preferred contact method` backed by `custom.preferred_contact_method`
- write those values through the Customer Account API once the extension is deployed with Shopify CLI

## What is real vs placeholder
### Real right now
- Shopify theme gate
- signed-in storefront intake form
- browser validation
- direct local-app submission from the storefront form
- local backend app
- local review UI
- local file upload handling
- local status changes
- local archive/delete actions
- Shopify client-credentials connectivity helper
- best-effort Shopify `used_listing` sync with local fallback
- Shopify Files sync for the primary listing photo and proof file
- public approved-listings page template in the theme
- multi-photo gallery support in code once `used_listing.photos` is widened to a list-of-files field in Shopify Admin
- public approved-listings search, filters, sorting, and client-side detail modal
- admin-side submission search/filter controls and per-listing manual Shopify re-sync
- stricter intake validation requiring at least one photo and a usable contact target
- customer-account completeness gate requiring account email, first name, last name, and phone before the intake form is usable

### Placeholder right now
- Shopify app proxy live wiring
- embedded admin UI inside Shopify admin
- a full marketplace-style public browsing experience
- live deployment of the new customer-account profile extension

## Known limitations
- The local app works only while the PC/server is running.
- Direct `http://localhost` submission depends on the browser allowing the storefront page to reach the local app on the same machine.
- Local review UI currently uses basic auth, not Shopify embedded admin auth.
- Submissions are stored locally first and only sync to Shopify if the custom app is installed on the store and the credentials are valid.
- `ALLOW_UNSIGNED_PROXY=true` is intended only for local development convenience.
- Approval and archive changes only the local record status and do not publish anything to the website yet.
- The app now expects `used_listing.photos` to be a list-of-files field. Until that one-time Shopify Admin schema change is made, listing sync with photos will return a schema-mismatch error.
- Manual-entry brand sync still depends on the submitted handle matching a real Shopify `brand` metaobject. Unmatched handles remain blank on the live `used_listing`.
- Public listing filters/search are client-side only in the theme; there is no server-side paging or query layer yet.
- The form now captures `contact_value` for `Messenger` and `Phone`, but public contact-display logic is still a later phase.
- New submissions now depend on the customer profile being complete in Shopify. The gate is enforced in the theme first and rechecked by the local app using the posted account snapshot.
