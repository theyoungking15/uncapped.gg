# My Builds Changelog

## 2026-04-24

- Added optional `build_snapshot` JSON storage for `saved_build` metaobjects so new saves can keep component names, variants, images, quantities, prices, totals, and quote metadata alongside the existing restore payload.
- Updated the app proxy save/list flow to accept, sanitize, store, parse, and return `buildSnapshot` while keeping old saved builds compatible.
- Updated PC Builder `Save Build` to send the rich snapshot in addition to the existing compact `build_payload`, without changing builder selection, quote restore, share, screenshot, or cart behavior.
- Reworked the `My Builds` page into a two-column master/detail layout with a build list on the left and selected build details on the right.
- Added component detail rows, product links when available, fallback messaging for older builds without snapshots, and a My Builds `Screenshot` action powered by the saved snapshot.
- Refactored the PC Builder quote screenshot renderer into a reusable `window.UCP_PCB_QuoteImage.download(...)` helper and updated My Builds screenshots to use the same detailed/clean quote-image layouts through a section setting.
- Added a third `Compact My Builds-style layout` quote screenshot mode with image, item info, quantity, and price columns plus a single-line quick-description row.

## 2026-04-23

- Added a real Shopify-backed saved-build list helper in [shopify-admin.js](D:/Prince%20Shopify%20App/Upgrade%20Assist/app/src/lib/shopify-admin.js).
- Added `SHOPIFY_SAVED_BUILD_TYPE` config support in [config.js](D:/Prince%20Shopify%20App/Upgrade%20Assist/app/src/config.js) and [.env.example](D:/Prince%20Shopify%20App/Upgrade%20Assist/app/.env.example).
- Added the proxied list route `${APP_PROXY_BASE_PATH}/my-builds/list` in [server.js](D:/Prince%20Shopify%20App/Upgrade%20Assist/app/src/server.js).
- Added the first `My Builds` storefront page shell in [my-builds-page.liquid](D:/Prince%20Shopify%20App/My%20Builds/sections/my-builds-page.liquid).
- Added the first `My Builds` page template in [page.my-builds.json](D:/Prince%20Shopify%20App/My%20Builds/templates/page.my-builds.json).
- The page now supports these runtime states:
  - loading
  - signed out
  - empty saved-build list
  - loaded saved-build list
- Added saved-build create support in [server.js](D:/Prince%20Shopify%20App/Upgrade%20Assist/app/src/server.js) and [shopify-admin.js](D:/Prince%20Shopify%20App/Upgrade%20Assist/app/src/lib/shopify-admin.js).
- Added `Save Build` buttons to the current PC Builder action surfaces in [ucp-pc-builder.liquid](D:/Prince%20Shopify%20App/PC%20Builder%202/sections/ucp-pc-builder.liquid) and [ucp-pc-builder.css](D:/Prince%20Shopify%20App/PC%20Builder%202/assets/ucp-pc-builder.css).
- Wired the additive save flow in [ucp-pc-builder.js](D:/Prince%20Shopify%20App/PC%20Builder%202/assets/ucp-pc-builder.js) by reusing the existing builder share payload, prompting for a build name, saving through the app proxy, and leaving the existing share/quote/cart flows untouched.
- Extended the Apps Script sheet schema in [PC Builder Data Saver](D:/Prince%20Shopify%20App/Apps%20Script/PC%20Builder%20Data/PC%20Builder%20Data%20Saver) so PC Builder logs can now capture logged-in customer identity plus saved-build IDs/handles/status.
- Moved the saved-build card summary to the top of the `My Builds` card and replaced the old payload-state row with a real item count by deriving a readable summary from the stored build payload in [my-builds-page.liquid](D:/Prince%20Shopify%20App/My%20Builds/sections/my-builds-page.liquid) and [shopify-admin.js](D:/Prince%20Shopify%20App/Upgrade%20Assist/app/src/lib/shopify-admin.js).
- Added `Open build` on the `My Builds` cards by returning a builder-compatible encoded payload from [shopify-admin.js](D:/Prince%20Shopify%20App/Upgrade%20Assist/app/src/lib/shopify-admin.js) and wiring the card action in [my-builds-page.liquid](D:/Prince%20Shopify%20App/My%20Builds/sections/my-builds-page.liquid).
- Updated `Open build` to prefer the short builder URL format `?quote=...` whenever a saved build has a quote code, falling back to the long `build=` payload only when no quote code exists, in [my-builds-page.liquid](D:/Prince%20Shopify%20App/My%20Builds/sections/my-builds-page.liquid).
- Added saved-build lifecycle routes for `Rename`, `Archive`, `Unarchive`, `Share`, and hard `Delete` in [server.js](D:/Prince%20Shopify%20App/Upgrade%20Assist/app/src/server.js) and [shopify-admin.js](D:/Prince%20Shopify%20App/Upgrade%20Assist/app/src/lib/shopify-admin.js).
- Upgraded the `My Builds` page into separate active and archived sections, added card-level `Share`, `Rename`, `Archive`, `Unarchive`, and `Delete` actions, and kept share/open links short by reusing the quote URL whenever a saved build already has a quote code, in [my-builds-page.liquid](D:/Prince%20Shopify%20App/My%20Builds/sections/my-builds-page.liquid).
