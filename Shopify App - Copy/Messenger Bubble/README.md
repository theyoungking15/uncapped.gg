# UCP Messenger Bubble

This adds a Messenger-style floating launcher for Shopify storefront pages. It opens the store's Facebook Page Messenger thread through an `m.me` link.

## Files

- `sections/ucp-messenger-bubble.liquid`

## Install

1. Upload `sections/ucp-messenger-bubble.liquid` to the Shopify theme's `sections` folder.
2. In the Shopify theme editor, add the `UCP Messenger bubble` section to the page template or footer/global section group where you want it to appear.
3. Keep the default Page username `UncappedPC`, or set a full Messenger URL override.
4. If this is replacing Shopify Inbox, turn off the Shopify Inbox app embed so the two bubbles do not overlap.

## Behavior

- Default link: `https://m.me/UncappedPC?ref=website_bubble`
- The customer sends the message from Messenger, so it lands in the Facebook Page inbox.
- This does not send website chat messages as the customer's Facebook account.
