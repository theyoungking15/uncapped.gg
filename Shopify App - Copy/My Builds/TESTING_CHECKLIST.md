# My Builds Testing Checklist

## Theme Files

- Paste [my-builds-page.liquid](D:/Prince%20Shopify%20App/My%20Builds/sections/my-builds-page.liquid) into the live Shopify theme `Sections`.
- Paste [page.my-builds.json](D:/Prince%20Shopify%20App/My%20Builds/templates/page.my-builds.json) into the live Shopify theme `Templates`.
- Assign the `page.my-builds` template to the Shopify page you created for `My Builds`.
- Confirm the theme has `html2canvas.min.js` in `Assets`, because the My Builds screenshot button loads that asset.
- Confirm the theme has `ucp-pcb-quote-image.js` in `Assets`, because My Builds now reuses the same quote screenshot renderer as PC Builder.
- In the My Builds section settings, choose `My Builds screenshot layout` as `Detailed with quick description`, `Clean item-only layout`, or `Compact My Builds-style layout`.

## Shopify Admin Setup

- In Shopify Admin, open `Settings -> Custom data -> Metaobjects -> saved_build`.
- Confirm this optional field exists:
  - Name: `Build snapshot`
  - Key: `build_snapshot`
  - Type: `JSON`
  - Required: `No`

## Backend

- Restart the local app in [Upgrade Assist/app](D:/Prince%20Shopify%20App/Upgrade%20Assist/app).
- Keep the current Cloudflare tunnel running if you are testing on the live storefront.

## Direct Route Checks

- While signed out, open:
  - `/apps/upgrade-assist/my-builds/list`
- Expected:
  - `ok: true`
  - `loggedIn: false`

- While signed in, open:
  - `/apps/upgrade-assist/my-builds/list`
- Expected:
  - `ok: true`
  - `loggedIn: true`
  - `builds` array present

- While signed in, send a `POST` to:
  - `/apps/upgrade-assist/my-builds/save`
- Expected:
  - `ok: true`
  - `savedBuildId`
  - `savedBuildHandle`
  - `buildName`
  - the created `saved_build` metaobject has `build_payload`
  - newly saved builds have `build_snapshot`

- While signed in, send a `POST` to:
  - `/apps/upgrade-assist/my-builds/<saved-build-handle>/rename`
  - `/apps/upgrade-assist/my-builds/<saved-build-handle>/archive`
  - `/apps/upgrade-assist/my-builds/<saved-build-handle>/unarchive`
  - `/apps/upgrade-assist/my-builds/<saved-build-handle>/share`
  - `/apps/upgrade-assist/my-builds/<saved-build-handle>/delete`
- Expected:
  - `ok: true`
  - updated `build` response for rename/archive/unarchive/share
  - `deletedId` for delete

## Page Checks

- Open the `My Builds` page while signed out.
- Expected:
  - sign-in prompt
  - no cards

- Open the `My Builds` page while signed in and with no saved builds yet.
- Expected:
  - empty state
  - CTA back to PC Builder

- If one or more `saved_build` records already exist for the signed-in customer ID:
  - builds should render in the left column
  - clicking a build should update the right-side detail panel
  - the detail panel should show status, visibility, created date, updated date, quote code, and total item count
  - new builds with `build_snapshot` should show component image, label, product name, variant, quantity, price, and product link when available
  - old builds without `build_snapshot` should show the fallback message and still allow open/share/rename/archive/delete
  - active builds should show `Open build`, `Share`, `Screenshot`, `Rename`, `Archive`, and `Delete`
  - archived builds should show `Open build`, `Screenshot`, `Rename`, `Unarchive`, and `Delete`

## PC Builder Save Checks

- Restart the local app before testing the new save route.
- Paste the updated PC Builder files into the live theme:
  - [ucp-pc-builder.liquid](D:/Prince%20Shopify%20App/PC%20Builder%202/sections/ucp-pc-builder.liquid)
  - [ucp-pc-builder.js](D:/Prince%20Shopify%20App/PC%20Builder%202/assets/ucp-pc-builder.js)
  - [ucp-pc-builder.css](D:/Prince%20Shopify%20App/PC%20Builder%202/assets/ucp-pc-builder.css)
- While signed in and with at least one selected part:
  - click `Save Build` from the summary actions
  - click `Save Build` from the desktop dock
  - click `Save` from the mobile action bar
- Expected:
  - the prompt asks for a build name
  - successful saves show a non-blocking success notice
  - a new `saved_build` record appears on the `My Builds` page after refresh
  - the new build shows full component details in the My Builds detail panel

- On the `My Builds` page:
  - click `Open build` on the selected build detail panel
- Expected:
  - the PC Builder page opens with the short `?quote=` query param when a quote code exists
  - otherwise it falls back to the `build=` query param
  - the saved parts are restored into the current builder
  - current quote/share/cart behavior remains unchanged after restore

- On the `My Builds` page:
  - click `Share` on an active saved build
- Expected:
  - if the build is still `private`, the backend flips it to `unlisted`
  - the short builder `?quote=` link is used when the build has a quote code
  - otherwise the page falls back to the encoded `build=` link
  - the native share sheet opens when supported, otherwise the link is copied

- On the `My Builds` page:
  - click `Rename` on a saved build
- Expected:
  - a prompt appears with the current build name
  - saving updates the card title after reload

- On the `My Builds` page:
  - click `Archive` on an active saved build
  - click `Unarchive` on an archived saved build
- Expected:
  - archive moves the build into the archived section
  - unarchive moves it back into the active section

- On the `My Builds` page:
  - click `Delete` on a saved build
- Expected:
  - a hard-delete confirmation appears
  - confirmed delete removes the build from the page after reload
  - the underlying quote record is not deleted by this action

- On the `My Builds` page:
  - select a newly saved build with component details
  - click `Screenshot`
- Expected:
  - a PNG downloads
  - the image uses the same quote screenshot layout as PC Builder
  - the layout follows the My Builds section setting: detailed, clean, or compact
  - compact mode uses image, item info, quantity, and price columns with one-line quick descriptions
  - the image contains quote code, component rows, quantities, prices, subtotal, and social footer
  - old builds without snapshot details cannot generate a screenshot and show a clear message

- While signed out:
  - click `Save Build`
- Expected:
  - the save attempt is blocked
  - the customer is redirected to `/account/login`

- With no selected parts:
  - click `Save Build`
- Expected:
  - no request is sent
  - a notice says at least one part must be selected

## Logging Checks

- After a successful save, confirm the `UCP PC Builder Logs` sheet gets:
  - `save_build_click`
  - `save_build_success`
- Confirm the same rows now populate:
  - `customerId`
  - `customerEmail`
  - `customerName`
  - `savedBuildId`
  - `savedBuildHandle`
  - `savedBuildName`
  - `saveBuildStatus`

- While signed out, confirm `save_build_blocked` is logged without customer identity fields.

## Current Limits

- No dedicated public saved-build page yet
- No duplicate or overwrite flow yet
