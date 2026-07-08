# Uncapped PC Website Marketing Intelligence Brief

## 1. Executive Summary

Uncapped PC should be marketed as a guided PC quotation and build-planning website, not as a normal ecommerce checkout site yet.

The strongest customer-facing value is simple: customers can choose PC parts, open ready-made bundle links, generate a clean quote image, request approval, and save builds to their account. This makes Uncapped PC feel more consultative than a standard product catalog.

The current website is best positioned around:

- “Build first, review before buying.”
- “Transparent PC bundle pricing.”
- “Shareable quote images for easy approval.”
- “Saved builds for logged-in customers.”
- “Promo links that prefill recommended builds.”

Important limitation: checkout should not be marketed as a finished self-checkout purchase flow yet. The current flow is better described as build, quote, review, and approval.

## 2. Main Customer Journey

The main journey starts from a campaign or bundle link and ends with a quote-ready build.

Example campaign links:

- `https://www.uncappedpc.com/pages/pc-builder-2?promo=9800x3d-bundle&src=fb&content=cm`
- `https://www.uncappedpc.com/pages/pc-builder-2?promo=7500f-ayw-gaming-wifi-bundle&src=fb&content=cm`
- `https://www.uncappedpc.com/pages/bundle-masterlist`

Recommended customer journey:

1. Customer sees a Facebook Marketplace, Facebook Page, Discord, or website promo.
2. Customer opens a tracked promo or bundle link.
3. PC Builder preloads or highlights the relevant build/promo.
4. Customer edits parts if needed.
5. Customer generates a quote image or shareable quote link.
6. Customer requests approval or saves the build if logged in.
7. Staff reviews the quote/build before final purchase/payment.

This should be marketed as a safer PC-buying experience because customers are not forced to understand every compatibility/pricing detail alone.

## 3. Feature Breakdown

### PC Builder

The PC Builder is the main conversion tool.

Relevant files:

- `PC Builder 2/sections/ucp-pc-builder.liquid`
- `PC Builder 2/assets/ucp-pc-builder.js`
- `PC Builder 2/assets/ucp-pc-builder.css`

What it does:

- Lets customers pick parts by category: CPU, motherboard, RAM, GPU, cooler, SSD, PSU, case, fans, and other items.
- Shows a build summary and subtotal.
- Applies CPU + motherboard bundle discounts.
- Supports promo links using `promo=`.
- Supports add-on discounts, such as cooler discounts unlocked by eligible bundles/promos.
- Generates quote codes and share links.
- Generates downloadable quote images.
- Supports approval/request quote modal.
- Supports mobile-specific summary actions.

Marketing angle:

The PC Builder should be described as a guided quote builder for custom PCs, especially for customers who want a price-ready build without manually messaging every part.

### Promo Links

Promo links allow marketing to send users directly into a specific build or promo.

Example:

`/pages/pc-builder-2?promo=9800x3d-bundle&src=fb&content=cm`

Relevant files:

- `PC Builder 2/templates/page.ucp-pcb-promos-json.liquid`
- `PC Builder 2/sections/ucp-pc-builder.liquid`
- `PC Builder 2/assets/ucp-pc-builder.js`

What it does:

- Reads active promo metaobjects.
- Can prefill required promo components.
- Can apply a manual promo discount.
- Can stack or not stack with bundle discounts depending on promo setup.
- Can be tracked using `src`, `campaign`, and `content`.

Marketing angle:

Each promo can become its own campaign landing link instead of manually explaining the build in every post.

### Bundle Pages

Bundle pages show CPU + motherboard bundle options.

Relevant files:

- `Bundle Page/Sections/ucp-bundle-page.liquid`
- `Bundle Page/Sections/ucp-bundle-hub.liquid`
- `Bundle Page/templates/page.ucp-bundle-hub.json`

What it does:

- Displays bundle options by CPU.
- Shows motherboard choices and bundle prices.
- Sorts options by lowest price first.
- Provides a button that sends the selected bundle to PC Builder.
- Supports screenshot generation for social media bundle price-list images.

Marketing angle:

Bundle pages are strong for price-led posts because they are easier to understand than a full custom PC builder.

### Quote Images

Quote images are a key social and sales asset.

Relevant file:

- `PC Builder 2/assets/ucp-pcb-quote-image.js`

What it does:

- Creates downloadable quote screenshots.
- Supports multiple layouts such as detailed, clean, compact, compact mobile, quotation, and quotation mobile.
- Supports desktop and mobile-specific layout selection.
- Shows build parts, prices, discounts, quote code, date, and subtotal.

Marketing angle:

The quote image is useful for customers who want to send a build to family, compare options, or save a quote before deciding.

### My Builds

My Builds is the logged-in customer account feature.

Relevant files:

- `My Builds/sections/my-builds-page.liquid`
- `My Builds/README.md`
- `Upgrade Assist/app/src/server.js`
- `Upgrade Assist/app/src/lib/shopify-admin.js`

What it does:

- Saves builds to Shopify `saved_build` metaobjects.
- Requires customer login.
- Lists saved builds by customer.
- Supports rename, share, archive, unarchive, delete, open build, and screenshot.
- Stores quote code, quote version, build payload, and optional build snapshot.

Marketing angle:

This gives customers a reason to create an account: they can save and return to their PC builds later.

### Source Tracking

Marketing links can be tracked.

Relevant files:

- `Apps Script/PC Builder Data/PC Builder Data Saver`
- `docs/PC_BUILDER_SOURCE_TRACKING_PARAMS.md`
- `PC Builder 2/assets/ucp-pc-builder.js`

What it does:

- Logs link opens.
- Tracks source, campaign, content, promo handle, quote code, session ID, device, browser, and page URL.
- Supports source links such as `src=fb`, `src=fb_marketplace`, `src=discord`, or custom source names.

Marketing angle:

This allows Uncapped PC to compare which channels and promo links are actually being opened.

## 4. Bundle System Explanation

There are three related discount systems.

### CPU + Motherboard Bundle Discount

This is the base bundle discount system.

Relevant metaobject:

- `cpu_motherboard_bundle`

What it does:

- Matches selected CPU and motherboard combinations.
- Applies bundle savings when the selected parts match a defined rule.
- Powers both the PC Builder bundle discount and bundle pages.

Best marketing use:

Use this for simple “CPU + motherboard bundle starts at...” campaigns.

### PC Builder Promo

This is the primary campaign promo system.

Relevant metaobject:

- `pc_builder_promo`

What it does:

- Uses a promo handle like `9800x3d-bundle`.
- Can prefill required parts.
- Can apply a fixed promo discount.
- Can decide whether to stack with the existing CPU + motherboard bundle discount.

Best marketing use:

Use this for larger campaigns, featured builds, limited offers, or posts where the link should open a preloaded build.

### Add-On Discount

This is the newest layered discount system.

Relevant metaobject:

- `pc_builder_addon_discount`

What it does:

- Unlocks extra item discounts after a customer qualifies through a bundle or promo.
- Example: customer selects an eligible CPU + motherboard bundle, then gets an extra discount on selected CPU coolers.
- Displays add-on savings in the product price cell and totals.

Best marketing use:

Use this for upsells:

- “Add a better cooler and save more.”
- “Bundle buyers get exclusive cooler discounts.”
- “Upgrade your cooling for less.”

## 5. PC Builder Value Proposition

The PC Builder is not just a product picker. It reduces decision friction.

Core value propositions:

- It gives customers a clearer build path than browsing products one by one.
- It shows pricing and discounts in one place.
- It creates shareable quote images.
- It supports ready-made promo links.
- It lets logged-in customers save builds.
- It gives staff better context through logs and quote codes.

Best simple statement:

“Build your PC, see the price clearly, save or share your quote, then let Uncapped PC review it before you buy.”

## 6. Marketing Angles

Recommended angles:

- Price clarity: “See your full build price before messaging.”
- Bundle savings: “CPU + motherboard bundles with visible savings.”
- Guided buying: “Not sure what parts to choose? Start from a ready-made promo build.”
- Shareable quote: “Generate a clean quote image you can send or save.”
- Account value: “Save your builds and come back later.”
- Upgrade upsell: “Eligible bundles unlock add-on discounts.”
- Local trust: “Binondo, Manila PC build support.”

Avoid these claims for now:

- Do not say “instant checkout” unless the checkout/payment flow is confirmed.
- Do not say “automatic compatibility guarantee” unless compatibility rules are fully implemented.
- Do not say “live stock guaranteed” unless inventory accuracy is confirmed.
- Do not say “final price guaranteed” unless staff approval rules are finalized.

## 7. Campaign Assets We Should Create

High-priority assets:

- Promo link posts for each major bundle.
- Bundle price-list screenshots.
- Quote image examples.
- Short “how to use PC Builder” video.
- Before/after posts showing normal price vs bundle/promo price.
- Facebook Marketplace descriptions using tracked links.
- Facebook Page carousel posts for each CPU bundle.
- Discord announcement format for promos.

Suggested campaign link format:

`https://www.uncappedpc.com/pages/pc-builder-2?promo=PROMO_HANDLE&src=CHANNEL&campaign=CAMPAIGN_NAME&content=CREATIVE_NAME`

Examples:

- `?promo=9800x3d-bundle&src=fb_marketplace&campaign=may_9800x3d&content=main_post`
- `?promo=7500f-ayw-gaming-wifi-bundle&src=fb_page&campaign=may_7500f&content=image_v1`
- `?promo=7500f-ayw-gaming-wifi-bundle&src=discord&campaign=may_7500f&content=announcement`

## 8. Suggested Campaign Structure

### Campaign 1: CPU Bundle Landing Links

Goal:

Drive traffic to bundle pages and PC Builder.

Assets:

- Bundle screenshot.
- Short caption.
- Tracked link.

CTA:

“Open this bundle in PC Builder.”

### Campaign 2: Ready-Made Promo Builds

Goal:

Let customers open a preloaded build without manually selecting parts.

Assets:

- Quote screenshot.
- PC Builder promo link.
- Clear savings callout.

CTA:

“Open the build and adjust parts.”

### Campaign 3: Cooler Add-On Discount

Goal:

Increase average order value by encouraging better coolers.

Assets:

- Build screenshot with add-on discount.
- Cooler options list.

CTA:

“Choose an eligible bundle and unlock cooler savings.”

### Campaign 4: Save Your Build

Goal:

Encourage account creation.

Assets:

- Short demo video.
- Screenshot of My Builds page.

CTA:

“Log in and save your PC build.”

## 9. Risks, Confusion Points, and Fixes

### Risk: Customers may think checkout is complete

Current state:

The site has add-to-cart and approval/payment helpers, but the safest public message is still build, review, and quote.

Fix:

Use language like “request approval” and “review before payment.”

### Risk: Promo links may confuse customers if the build changes

Current state:

Promo discounts depend on matching required components. If the customer changes required promo parts, the promo may no longer apply.

Fix:

Use clear labels in PC Builder: “Promo applies when required parts remain selected.”

### Risk: Too many discount types may feel complicated

Current state:

There are bundle discounts, promo discounts, manual-off discounts, and add-on discounts.

Fix:

Marketing should simplify the message:

- Bundle discount = CPU + motherboard savings.
- Promo discount = campaign offer.
- Add-on discount = extra savings after qualifying.

### Risk: Source tracking only matters if links are used consistently

Current state:

The code supports `src`, `campaign`, and `content`, but the team must use them consistently.

Fix:

Create a link naming rule for every campaign.

Example:

`src=fb_marketplace&campaign=may_7500f&content=post_1`

### Risk: Some features need confirmation

Needs confirmation:

- Final payment/checkout flow.
- Whether stock and pricing are always live.
- Whether FPS Finder is publicly deployed.
- Whether public saved-build share pages are planned or only PC Builder quote links are used.

## 10. Final Output for ChatGPT

Use this prompt when asking ChatGPT or a marketing lead to create campaign ideas:

```text
We are Uncapped PC, a PC parts and custom build store in Binondo, Manila.

Our Shopify website has a PC Builder that lets customers choose parts, see bundle/promo discounts, generate quote images, save builds to their account, and request build approval. It is not positioned as a finished instant checkout flow yet. The current customer journey is build, review, quote, and approval.

Key website features:
- PC Builder page: customers choose CPU, motherboard, RAM, GPU, cooler, SSD, PSU, case, fans, and other parts.
- CPU + motherboard bundle discounts.
- Promo links using promo handles, for example /pages/pc-builder-2?promo=9800x3d-bundle.
- Add-on discounts, for example cooler discounts unlocked by eligible bundles or promos.
- Quote images customers can download and share.
- My Builds page for logged-in customers to save, rename, share, archive, delete, and reopen builds.
- Source tracking using URL params like src, campaign, and content.
- Bundle pages that show CPU + motherboard bundle options and can redirect into PC Builder.

Marketing positioning:
- Build your PC first, review before buying.
- Transparent PC bundle pricing.
- Shareable quote images.
- Save your builds and come back later.
- Eligible bundles unlock extra add-on discounts.

Please create a practical marketing plan for Facebook Marketplace, Facebook Page, Discord, and website traffic. Include campaign angles, captions, tracked link examples, visual asset ideas, and a 30-day campaign structure. Avoid claiming instant checkout, guaranteed compatibility, or final payment unless reviewed by staff.
```

