# Quote Image Layout Guide

This file documents the manual layout controls for `assets/ucp-pcb-quote-image.js`.

The quote image is generated with inline styles inside JavaScript because it is rendered off-screen and captured by `html2canvas`.

## Desktop / Mobile Layout Selection

PC Builder and My Builds now support two quote screenshot layout selectors:

- `quote_screenshot_mode`: desktop layout
- `quote_screenshot_mode_mobile`: mobile layout

The mobile selector accepts a safe fallback value:

- `same_as_desktop`

Selection rules:

- If code passes an explicit `mode`, that exact layout is used.
- Otherwise, viewport `max-width: 768px` is treated as mobile.
- On mobile, `quote_screenshot_mode_mobile` is used unless it is set to `same_as_desktop`.
- On desktop, `quote_screenshot_mode` is always used.

## Main Width Controls

Edit these near the top of `assets/ucp-pcb-quote-image.js`.

```js
const CARD_WIDTH = 1040;
const CLEAN_CARD_WIDTH = 780;
const COMPACT_MOBILE_CARD_WIDTH = 430;
const QUOTATION_CARD_WIDTH = 820;
const QUOTATION_MOBILE_CARD_WIDTH = 430;
const CARD_PADDING = 18;
const CLEAN_CONTENT_WIDTH = 700;
```

- `CARD_WIDTH` controls the exported image width for detailed and desktop compact quote modes.
- `CLEAN_CARD_WIDTH` controls the full exported image width for clean quote mode only.
- `COMPACT_MOBILE_CARD_WIDTH` controls the exported image width for the new `compact_mobile` mode.
- `QUOTATION_CARD_WIDTH` controls the exported image width for `quotation`.
- `QUOTATION_MOBILE_CARD_WIDTH` controls the exported image width for `quotation_mobile`.
- `CARD_PADDING` controls the white padding inside the outer quote image card.
- `CLEAN_CONTENT_WIDTH` controls the width of the clean quote content: quote info, item rows, totals, and footer.

Rule of thumb: keep `CLEAN_CARD_WIDTH` larger than `CLEAN_CONTENT_WIDTH`. A gap of about `60px` to `100px` usually gives a clean margin.

## Compact Quote Row Layout

The compact item row now has separate desktop and mobile controls near the top of `assets/ucp-pcb-quote-image.js`.

```js
const COMPACT_IMAGE_SIZE = 88;
const COMPACT_QTY_COL_WIDTH = 64;
const COMPACT_PRICE_COL_WIDTH = 132;
const COMPACT_ROW_GAP = 14;
const COMPACT_ROW_PADDING = 14;
const COMPACT_ROW_RADIUS = 18;

const COMPACT_MOBILE_IMAGE_SIZE = 64;
const COMPACT_MOBILE_QTY_COL_WIDTH = 34;
const COMPACT_MOBILE_PRICE_COL_WIDTH = 78;
const COMPACT_MOBILE_ROW_GAP = 8;
const COMPACT_MOBILE_ROW_PADDING = 10;
const COMPACT_MOBILE_ROW_RADIUS = 14;
```

- Desktop compact uses the first six constants.
- `compact_mobile` uses the mobile constants and the same compact visual style on a narrower card.
- The compact grid is:
  - Desktop: `image | info | qty | price`
  - Mobile: `image | info | qty | price`
- Increase `COMPACT_MOBILE_QTY_COL_WIDTH` or `COMPACT_MOBILE_PRICE_COL_WIDTH` if the right side feels cramped.
- Increase `COMPACT_MOBILE_IMAGE_SIZE` if you want a larger thumbnail.
- Increase `COMPACT_MOBILE_ROW_GAP` to create more breathing room between columns.
- Increase `COMPACT_MOBILE_ROW_PADDING` to add more space inside each item card.

`compact_mobile` also has dedicated header / totals / footer tuning constants:

```js
const COMPACT_MOBILE_HEADER_LOGO_MAX_WIDTH = 160;
const COMPACT_MOBILE_HEADER_LOGO_MAX_HEIGHT = 48;
const COMPACT_MOBILE_TOTALS_GAP = 4;
const COMPACT_MOBILE_TOTALS_PADDING_RIGHT = 4;
const COMPACT_MOBILE_SOCIAL_ICON_SIZE = 24;
const COMPACT_MOBILE_SOCIAL_GAP = 8;
```

- These only affect `compact_mobile`.
- Use them if the header, totals, or footer feel oversized on the 430px card.

## Clean Quote Row Layout

The clean item row uses CSS grid.

```js
grid-template-columns:${cleanImageSize}px minmax(0,560px) 1fr 30px 104px;
```

The columns are:

- `cleanImageSize`: product image column.
- `minmax(0,560px)`: product info column for component label, title, and variant.
- `1fr`: flexible middle spacer.
- `30px`: quantity column.
- `104px`: price column.

To make the middle space smaller, reduce `CLEAN_CONTENT_WIDTH` first. If you need finer control, reduce the product info max width or replace the `1fr` spacer with a fixed pixel value.

## Clean Row Padding

The clean row card padding is here:

```js
padding:8px 12px 8px 10px;
```

The order is:

```css
padding: top right bottom left;
```

- Increase the second value to move prices away from the right edge of the item box.
- Decrease the second value to move prices closer to the right edge.
- Increase the fourth value to move the product image/text away from the left edge.
- Decrease the fourth value to move product content closer to the left edge.

## Totals Alignment

The totals block is the part that shows:

- You saved
- Additional discount
- Subtotal

Its spacing is controlled here:

```js
margin-top:14px;display:flex;flex-direction:column;gap:6px;align-items:flex-end;padding-right:8px;
```

- `margin-top` controls space above the totals block.
- `gap` controls vertical spacing between the three totals lines.
- `padding-right` controls how far totals move inward from the clean content right edge.
- `align-items:flex-end` keeps totals aligned to the right.

If item prices and totals do not line up, adjust clean row right padding and totals `padding-right` together.

## Header And Footer

Logo size:

```js
const LOGO_MAX_WIDTH = 240;
const LOGO_MAX_HEIGHT = 70;
```

Social icons:

```js
const SOCIAL_ICON_SIZE = 28;
const SOCIAL_GAP = 10;
const SOCIAL_LINE_COLOR = "#111";
const SOCIAL_HANDLE = "Follow us @ Uncapped PC";
```

- `SOCIAL_ICON_SIZE` changes icon size.
- `SOCIAL_GAP` changes spacing between icons.
- `SOCIAL_LINE_COLOR` changes the divider line color.
- `SOCIAL_HANDLE` changes the footer text.

## Safe Editing Checklist

After any manual edit, run:

```powershell
node --check "D:\Prince\Shopify App\PC Builder 2\assets\ucp-pcb-quote-image.js"
```

Then generate a clean quote image and verify:

- Rows fit inside the rounded item boxes.
- Prices do not touch the right edge.
- Qty and price stay close together.
- Totals align with the item price column.
- The quote image has no red or black guide lines.
- Detailed, clean, compact, compact mobile, and quotation modes still look correct.
