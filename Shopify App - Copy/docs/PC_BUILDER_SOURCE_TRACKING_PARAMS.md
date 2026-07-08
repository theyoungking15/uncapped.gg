# PC Builder Source Tracking Params

Use this guide when creating tracked links for Facebook Marketplace, Facebook Page, website banners, ads, or promo campaigns.

The same tags now work on PC Builder, FPS Finder, bundle list, bundle pages, and price list pages.

## Basic Format

Add tracking params to the end of a tracked page URL.

```text
https://www.uncappedpc.com/pages/pc-builder-2?promo=7500f-ayw-gaming-wifi-bundle&src=fbm&campaign=payday_sale&content=image_a
```

If the URL already has a `?`, add new params with `&`.

```text
...?promo=7500f-ayw-gaming-wifi-bundle&src=fbm
```

If the URL has no `?`, start params with `?`.

```text
https://www.uncappedpc.com/pages/pc-builder-2?src=website
```

Tracked bundle list link:

```text
https://www.uncappedpc.com/pages/bundle-masterlist?src=fbm&campaign=payday_sale&content=listing_1
```

Tracked price list link:

```text
https://www.uncappedpc.com/pages/price-list?src=fb_page&campaign=monthly_pricelist&content=post_image_a
```

Tracked FPS Finder link:

```text
https://www.uncappedpc.com/pages/fps-finder?src=fbm&campaign=fps_public_launch&content=homepage_banner
```

## Supported Params

`src`

Primary traffic source. This is the most important tag.

Examples:

```text
src=fbm
src=fb_page
src=website
src=messenger
src=tiktok
src=google_business
```

Aliases also supported:

```text
source=fbm
ref=fbm
```

Recommended default: use `src`.

`campaign`

The sale, promo, or marketing push.

Examples:

```text
campaign=payday_sale
campaign=april_bundle
campaign=7500f_bundle_launch
campaign=9800x3d_push
```

Alias also supported:

```text
utm_campaign=payday_sale
```

`content`

The specific creative, caption, listing, or placement variant.

Examples:

```text
content=image_a
content=caption_b
content=listing_1
content=story_post
content=reel_link
```

Alias also supported:

```text
utm_content=image_a
```

`promo`

The PC Builder promo handle to load.

Example:

```text
promo=7500f-ayw-gaming-wifi-bundle
```

`quote` and `v`

Short quote restore link.

Example:

```text
quote=Q-ABCDE
v=12
```

## Naming Rules

Use lowercase and underscores.

Good:

```text
src=fbm
campaign=payday_sale
content=image_a
```

Avoid changing names for the same source.

These will be counted separately:

```text
src=fbm
src=fb_marketplace
src=facebook_marketplace
```

Pick one name and keep using it.

The code normalizes spaces and symbols into underscores, so this:

```text
src=Facebook Marketplace
```

logs as:

```text
fb_marketplace
```

## Example Links

Facebook Marketplace promo link:

```text
https://www.uncappedpc.com/pages/pc-builder-2?promo=7500f-ayw-gaming-wifi-bundle&src=fbm&campaign=payday_sale&content=listing_1
```

Facebook Page promo post:

```text
https://www.uncappedpc.com/pages/pc-builder-2?promo=7500f-ayw-gaming-wifi-bundle&src=fb_page&campaign=payday_sale&content=post_image_a
```

Website banner:

```text
https://www.uncappedpc.com/pages/pc-builder-2?promo=7500f-ayw-gaming-wifi-bundle&src=website&campaign=payday_sale&content=homepage_banner
```

FPS Finder public launch:

```text
https://www.uncappedpc.com/pages/fps-finder?src=fb_page&campaign=fps_public_launch&content=post_image_a
```

Quote link with tracking:

```text
https://www.uncappedpc.com/pages/pc-builder-2?quote=Q-ABCDE&v=12&src=fbm&campaign=payday_sale&content=listing_1
```

Promo quote link with tracking:

```text
https://www.uncappedpc.com/pages/pc-builder-2?quote=Q-ABCDE&v=12&promo=7500f-ayw-gaming-wifi-bundle&src=fbm&campaign=payday_sale&content=listing_1
```

## What Gets Logged

Tracked opens and clicks are written to `link_source_events`.

Event types:

```text
page_open
cta_click
pc_builder_open
link_open
```

`page_open` is logged when a tagged FPS Finder, bundle list, bundle page, price list, or PC Builder page opens.

`cta_click` is logged when a tracked CTA is clicked, such as a bundle card or Open in PC Builder.

`pc_builder_open` is logged when a tagged PC Builder URL opens.

`link_open` is the older PC Builder open event name and remains supported for older data.

Important columns:

```text
timestamp
date
event
openId
sourceTag
campaign
content
promoHandle
entryType
pageType
ctaName
targetUrl
pageUrl
quoteCode
quoteVersion
sessionId
customerId
customerEmail
deviceType
os
browser
referrerHost
referrerUrl
```

`openId` identifies one specific logged open.

`sessionId` identifies the same browser/device over time.

`sourceTag` comes from `src`, `source`, or `ref`.

`campaign` comes from `campaign` or `utm_campaign`.

`content` comes from `content` or `utm_content`.

`promoHandle` comes from the `promo` link param.

`pageType` identifies where the event happened, for example `fps_finder`, `bundle_list`, `bundle_page`, `price_list`, or `pc_builder`.

`ctaName` identifies the clicked CTA when the event is `cta_click`.

`targetUrl` stores where the CTA was sending the user when available.

## FPS Finder Funnel

FPS Finder uses the same `link_source_events` destination and no separate sheet or endpoint.

Count tagged FPS Finder visitors:

```text
event = page_open
pageType = fps_finder
```

Count FPS Finder clicks into PC Builder:

```text
event = cta_click
pageType = fps_finder
```

Count PC Builder opens that came from FPS Finder handoff links:

```text
event = pc_builder_open
sourceTag = fps_finder
```

FPS Finder builder handoff links set `src=fps_finder` and keep the incoming `campaign`/`utm_campaign` and `content`/`utm_content` values. This lets you measure the public launch funnel as:

```text
FPS Finder page_open by original source/campaign/content
FPS Finder cta_click by CTA name
PC Builder pc_builder_open where sourceTag=fps_finder
```

FPS Finder CTA names:

```text
fps_finder_single_pair_builder
fps_finder_compare_pair_builder
fps_finder_recommendation_builder
fps_finder_tier_builder
fps_finder_compare_card_builder
```

Tagged-only rule still applies. Opening FPS Finder without `src`, `source`, or `ref` does not log a `page_open`.

## Summary Tabs

`link_source_daily`

Shows daily counts by event, page type, and source.

```text
date
event
pageType
sourceTag
openCount
```

`link_source_campaign_daily`

Shows daily counts by event, page type, source, campaign, content, promo, CTA, and device type.

```text
date
event
pageType
sourceTag
campaign
content
promoHandle
ctaName
deviceType
openCount
```

## Counting Rule

The same exact tracked URL in the same browser tab/session has a 10-second cooldown.

This means:

```text
Open once = logs once
Refresh immediately = usually does not log again
Refresh after 10 seconds = logs again
Open in another tab = logs separately
```

## Recommended Starting Tags

Use these first so the sheet stays clean.

```text
src=fbm
src=fb_page
src=website
src=my_builds_share
src=messenger
src=tiktok
src=google_business
```

Campaign examples:

```text
campaign=payday_sale
campaign=monthly_bundle
campaign=fps_public_launch
campaign=7500f_bundle_launch
campaign=9800x3d_bundle_launch
```

Content examples:

```text
content=image_a
content=image_b
content=caption_a
content=listing_1
content=homepage_banner
```
