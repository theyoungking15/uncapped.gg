/* File: assets/ucp-pcb-quote-image.js */
(() => {
  const BTN_SEL = "#ucp-pcb-quote-image";
  const NOTICE_ID = "ucp-pcb-quoteimg-notice";

  // Quote screenshot layout adjustables.
  // Detailed mode uses CARD_WIDTH. Clean, compact mobile, and quotation modes use dedicated widths.
  // See ../QUOTE_IMAGE_LAYOUT.md before changing these values manually.
  const CARD_WIDTH = 1040;
  const CLEAN_CARD_WIDTH = 780;
  const COMPACT_MOBILE_CARD_WIDTH = 430;
  const SOCIALS_COMPACT_CARD_WIDTH = 1080;
  const SOCIALS_COMPACT_CARD_HEIGHT = 1350;
  const SOCIALS_COMPACT_MOBILE_CARD_WIDTH = 540;
  const SOCIALS_COMPACT_MOBILE_CARD_HEIGHT = 675;
  const SOCIALS_COMPACT_ROWS_PER_PAGE = 6;
  const SOCIALS_COMPACT_MOBILE_ROWS_PER_PAGE = 4;
  const QUOTATION_CARD_WIDTH = 820;
  const QUOTATION_MOBILE_CARD_WIDTH = 430;
  const CARD_PADDING = 18;
  const CLEAN_CONTENT_WIDTH = 700;
  const COMPACT_IMAGE_SIZE = 88;
  const COMPACT_QTY_COL_WIDTH = 64;
  const COMPACT_PRICE_COL_WIDTH = 132;
  const COMPACT_ROW_GAP = 14;
  const COMPACT_ROW_PADDING = 18;
  const COMPACT_ROW_RADIUS = 18;
  const COMPACT_MOBILE_IMAGE_SIZE = 64;
  const COMPACT_MOBILE_QTY_COL_WIDTH = 34;
  const COMPACT_MOBILE_PRICE_COL_WIDTH = 78;
  const COMPACT_MOBILE_ROW_GAP = 8;
  const COMPACT_MOBILE_ROW_PADDING = 10;
  const COMPACT_MOBILE_ROW_RADIUS = 14;
  const COMPACT_MOBILE_HEADER_LOGO_MAX_WIDTH = 160;
  const COMPACT_MOBILE_HEADER_LOGO_MAX_HEIGHT = 48;
  const COMPACT_MOBILE_TOTALS_GAP = 4;
  const COMPACT_MOBILE_TOTALS_PADDING_RIGHT = 4;
  const COMPACT_MOBILE_SOCIAL_ICON_SIZE = 24;
  const COMPACT_MOBILE_SOCIAL_GAP = 8;
  const WRAP_RADIUS = 12;
  const WRAP_BORDER = "1px solid rgba(0,0,0,0.35)";
  const WRAP_SHADOW = "0 18px 40px rgba(0,0,0,0.12)";
  const LOGO_MAX_WIDTH = 240;
  const LOGO_MAX_HEIGHT = 70;
  const LABEL_COL_WIDTH = 110;
  const IMG_SIZE = 120;
  const PRICE_COL_WIDTH = 140;
  const ROW_GAP = 6;
  const ROW_PADDING = 10;
  const ROW_RADIUS = 12;
  const TITLE_MARGIN = 4;
  const SOCIAL_ICON_SIZE = 28;
  const SOCIAL_GAP = 10;
  const SOCIAL_LINE_COLOR = "#111";
  const SOCIAL_HANDLE = "Follow us @ Uncapped PC";
  const SOCIAL_CONTACT_LINE = "uncappedpc@gmail.com | 0921-287-1407 | uncappedpc.com";
  const INTER_FONT_STACK = "Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial";
  const ROBOTO_FONT_STACK = "Roboto,system-ui,-apple-system,Segoe UI,Arial";
  const SYSTEM_FONT_STACK = "system-ui,-apple-system,Segoe UI,Roboto,Arial";
  let ACTIVE_QUOTE_FONTS = {
    title: INTER_FONT_STACK,
    price: ROBOTO_FONT_STACK,
    base: SYSTEM_FONT_STACK
  };
  const SOCIAL_ICONS = [
    { label: "Facebook", url: "https://cdn.shopify.com/s/files/1/0681/3368/3337/files/FB.png?v=1769187883" },
    { label: "Instagram", url: "https://cdn.shopify.com/s/files/1/0681/3368/3337/files/IG.png?v=1769187884" },
    { label: "YouTube", url: "https://cdn.shopify.com/s/files/1/0681/3368/3337/files/youtube.png?v=1769187883" },
    { label: "TikTok", url: "https://cdn.shopify.com/s/files/1/0681/3368/3337/files/Tiktok.png?v=1769187884" }
  ];

  function showNotice(msg) {
    const old = document.getElementById(NOTICE_ID);
    if (old) old.remove();

    const el = document.createElement("div");
    el.id = NOTICE_ID;
    el.textContent = String(msg || "");
    el.style.cssText =
      "position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;" +
      "background:#111;color:#fff;padding:10px 12px;border-radius:12px;" +
      "font:600 12px/1.2 system-ui,-apple-system,Segoe UI,Roboto,Arial;" +
      "box-shadow:0 10px 30px rgba(0,0,0,.25);";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }

  function readConfig_() {
    try {
      const el = document.getElementById("ucp-pcb-config");
      if (!el || !el.textContent) return {};
      return JSON.parse(el.textContent);
    } catch (e) {
      return {};
    }
  }

  function getBrandLogo_(overrideUrl) {
    const explicit = String(overrideUrl || "").trim();
    if (explicit) return explicit;

    const cfg = readConfig_();
    const url = String(cfg.brand_logo || "").trim();
    return url || "";
  }

  function parseQuoteScreenshotMode_(value) {
    const mode = String(value || "").trim().toLowerCase();
    if (mode === "detailed") return "detailed";
    if (mode === "clean") return "clean";
    if (mode === "compact") return "compact";
    if (mode === "compact_mobile" || mode === "compact-mobile") return "compact_mobile";
    if (mode === "socials_compact" || mode === "socials-compact" || mode === "social_compact") {
      return "socials_compact";
    }
    if (
      mode === "socials_compact_mobile" ||
      mode === "socials-compact-mobile" ||
      mode === "social_compact_mobile" ||
      mode === "social-compact-mobile"
    ) {
      return "socials_compact_mobile";
    }
    if (mode === "quotation") return "quotation";
    if (mode === "quotation_mobile" || mode === "quotation-mobile") return "quotation_mobile";
    return "";
  }

  function normalizeQuoteScreenshotMode_(value) {
    return parseQuoteScreenshotMode_(value) || "detailed";
  }

  function normalizeResponsiveQuoteScreenshotMode_(value) {
    const mode = String(value || "").trim().toLowerCase();
    if (mode === "same_as_desktop" || mode === "same-as-desktop") return "same_as_desktop";
    return parseQuoteScreenshotMode_(value);
  }

  function isMobileQuoteViewport_() {
    try {
      return window.matchMedia("(max-width: 768px)").matches;
    } catch (e) {}
    try {
      const width = Number(window.innerWidth || document.documentElement?.clientWidth || 0);
      return Number.isFinite(width) && width > 0 ? width <= 768 : false;
    } catch (e) {}
    return false;
  }

  function resolveQuoteScreenshotMode_(options = {}) {
    const opts =
      options && typeof options === "object" && !Array.isArray(options)
        ? options
        : { mode: options };

    const explicitMode = parseQuoteScreenshotMode_(opts.mode);
    if (explicitMode) return explicitMode;

    const cfg = readConfig_();
    const desktopMode =
      parseQuoteScreenshotMode_(opts.desktopMode ?? opts.desktop_mode ?? cfg.quote_screenshot_mode) || "detailed";
    const mobileMode = normalizeResponsiveQuoteScreenshotMode_(
      opts.mobileMode ?? opts.mobile_mode ?? cfg.quote_screenshot_mode_mobile
    );

    if (isMobileQuoteViewport_() && mobileMode && mobileMode !== "same_as_desktop") {
      return mobileMode;
    }

    return desktopMode;
  }

  function getQuoteScreenshotMode_(overrideMode) {
    return resolveQuoteScreenshotMode_(overrideMode);
  }

  function getBaseFont_() {
    try {
      const f = getComputedStyle(document.body).fontFamily;
      return f || "system-ui,-apple-system,Segoe UI,Roboto,Arial";
    } catch (e) {
      return "system-ui,-apple-system,Segoe UI,Roboto,Arial";
    }
  }

  function normalizeQuoteFontPreset_(value) {
    const preset = String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
    if (preset === "all_inter") return "all_inter";
    if (preset === "roboto_inter") return "roboto_inter";
    if (preset === "theme") return "theme";
    if (preset === "system") return "system";
    return "inter_roboto";
  }

  function getQuoteFontPreset_(overridePreset) {
    if (overridePreset !== undefined && overridePreset !== null && String(overridePreset).trim()) {
      return normalizeQuoteFontPreset_(overridePreset);
    }

    const cfg = readConfig_();
    return normalizeQuoteFontPreset_(cfg.quote_font_preset);
  }

  function getQuoteFonts_(baseFont, overridePreset) {
    const preset = getQuoteFontPreset_(overridePreset);
    if (preset === "all_inter") {
      return { title: INTER_FONT_STACK, price: INTER_FONT_STACK, base: INTER_FONT_STACK };
    }
    if (preset === "roboto_inter") {
      return { title: ROBOTO_FONT_STACK, price: INTER_FONT_STACK, base: baseFont || SYSTEM_FONT_STACK };
    }
    if (preset === "theme") {
      const themeFont = baseFont || SYSTEM_FONT_STACK;
      return { title: themeFont, price: themeFont, base: themeFont };
    }
    if (preset === "system") {
      return { title: SYSTEM_FONT_STACK, price: SYSTEM_FONT_STACK, base: SYSTEM_FONT_STACK };
    }
    return { title: INTER_FONT_STACK, price: ROBOTO_FONT_STACK, base: baseFont || SYSTEM_FONT_STACK };
  }

  function quoteTitleFont_() {
    return ACTIVE_QUOTE_FONTS.title || INTER_FONT_STACK;
  }

  function quotePriceFont_() {
    return ACTIVE_QUOTE_FONTS.price || ROBOTO_FONT_STACK;
  }

  async function waitForApi(timeoutMs = 6000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (window.UCP_PCB_API && typeof window.UCP_PCB_API.getSnapshot === "function") return true;
      await new Promise((r) => setTimeout(r, 50));
    }
    return false;
  }

  function formatPhp(n) {
    const num = Number(n);
    if (!Number.isFinite(num)) return "";
    try {
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0
      }).format(num);
    } catch (e) {
      return `PHP ${Math.round(num)}`;
    }
  }

  function formatDateTime_() {
    const now = new Date();
    const date = now.toLocaleDateString("en-US", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit"
    });
    let time = now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
    time = String(time).replace("AM", "am").replace("PM", "pm");
    return { date, time };
  }

  function getQuoteCode_(overrideCode) {
    const explicit = String(overrideCode || "").trim();
    if (explicit) return explicit;

    try {
      const ctx = window.__UCP_PCB_QUOTE_CTX__ || null;
      if (ctx && ctx.quoteCode) return String(ctx.quoteCode).trim();
    } catch (e) {}
    return "";
  }

  function getQuoteVersion_(overrideVersion) {
    const explicit = String(overrideVersion || "").trim();
    if (explicit) return explicit;

    try {
      const ctx = window.__UCP_PCB_QUOTE_CTX__ || null;
      if (ctx && ctx.quoteVersion !== undefined && ctx.quoteVersion !== null) {
        return String(ctx.quoteVersion).trim();
      }
      if (ctx && ctx.version !== undefined && ctx.version !== null) {
        return String(ctx.version).trim();
      }
    } catch (e) {}
    return "";
  }

  function buildApprovalLink_(url) {
    if (!url) return "";
    try {
      const u = new URL(url, window.location.origin);
      u.searchParams.set("approved", "1");
      try {
        const cur = new URL(window.location.href);
        const dp = cur.searchParams.get("dp");
        if (dp !== null && dp !== "" && !u.searchParams.has("dp")) {
          u.searchParams.set("dp", dp);
        }
        const off = cur.searchParams.get("off");
        if (off !== null && off !== "" && !u.searchParams.has("off")) {
          u.searchParams.set("off", off);
        }
        const promo = cur.searchParams.get("promo");
        if (promo !== null && promo !== "" && !u.searchParams.has("promo")) {
          u.searchParams.set("promo", promo);
        }
      } catch (e) {}
      return u.toString();
    } catch (e) {
      return url;
    }
  }

  function buildApprovalQuoteLink_(quoteCode) {
    const code = String(quoteCode || "").trim();
    if (!code) return "";
    try {
      const u = new URL(window.location.origin + window.location.pathname);
      u.searchParams.set("quote", code);
      u.searchParams.set("approved", "1");
      try {
        const cur = new URL(window.location.href);
        const dp = cur.searchParams.get("dp");
        if (dp !== null && dp !== "" && !u.searchParams.has("dp")) {
          u.searchParams.set("dp", dp);
        }
        const off = cur.searchParams.get("off");
        if (off !== null && off !== "" && !u.searchParams.has("off")) {
          u.searchParams.set("off", off);
        }
        const promo = cur.searchParams.get("promo");
        if (promo !== null && promo !== "" && !u.searchParams.has("promo")) {
          u.searchParams.set("promo", promo);
        }
      } catch (e) {}
      return u.toString();
    } catch (e) {
      return "";
    }
  }

  function logQuoteScreenshot_(snapshot) {
    try {
      if (typeof window.UCP_PCB_LOG_EVENT !== "function") return;

      const quoteCode = getQuoteCode_();
      const quoteVersion = getQuoteVersion_();
      const safeQuoteVersion = Number(quoteVersion) > 0 ? Number(quoteVersion) : 1;
      let buildLink = "";
      try {
        const gen = window.UCP_PCB_BuildLink?.generateBuildLink;
        if (typeof gen === "function") {
          buildLink = String(gen(snapshot, { path: window.location.pathname }) || "").trim();
        }
      } catch (e) {}

      if (!buildLink) buildLink = window.location.href;

      const approvalLink = buildApprovalQuoteLink_(quoteCode) || buildApprovalLink_(buildLink);

      window.UCP_PCB_LOG_EVENT("quote_screenshot", {
        buildLink,
        approvalLink,
        quoteCode,
        quoteVersion: safeQuoteVersion
      });
    } catch (e) {}
  }

  function extractLineItems(snapshot) {
    const raw = snapshot && Array.isArray(snapshot.items) ? snapshot.items : [];

    function normalizeVariantTitle_(rawTitle) {
      const title = String(rawTitle || "").trim();
      if (!title) return "";
      if (title.toLowerCase() === "default title") return "";
      return title;
    }

    return raw
      .map((it) => ({
        key: String(it.key || "").trim(),
        componentLabel: String(it.label || it.key || "").trim(),
        title: String(it.title || "").trim(),
        variantTitle: normalizeVariantTitle_(it.variantTitle || it.variant_title || (it.variant && it.variant.title) || ""),
        image: String(
          it.variantImage ||
            it.variant_image ||
            it.variant_image_url ||
            it.variantImageUrl ||
            (it.variant && (it.variant.image || it.variant.image_url || it.variant.imageUrl)) ||
            it.image ||
            ""
        ).trim(),
        quick: String(it.quick_description || it.quickDescription || "").trim(),
        vendor: String(it.vendor || "").trim(),
        qty: Number(it.qty || 1),
        priceBase: Number(it.priceBase ?? it.price_base ?? ""),
        priceEffective: Number(it.priceEffective ?? it.price_effective ?? "")
      }))
      .filter((it) => it.title || it.componentLabel || it.image);
  }

  function buildSocialIcon_(url, label, size = SOCIAL_ICON_SIZE) {
    const icon = document.createElement("div");
    const fallbackFontSize = Math.max(10, Math.round(size * 0.39));
    icon.style.cssText =
      `width:${size}px;height:${size}px;border-radius:999px;` +
      "display:flex;align-items:center;justify-content:center;overflow:hidden;";

    if (url) {
      const img = document.createElement("img");
      img.src = url;
      img.alt = String(label || "");
      img.crossOrigin = "anonymous";
      img.style.cssText = "width:100%;height:100%;object-fit:contain;";
      icon.appendChild(img);
      return icon;
    }

    icon.textContent = String(label || "");
    icon.style.cssText =
      `width:${size}px;height:${size}px;border-radius:999px;` +
      "display:flex;align-items:center;justify-content:center;" +
      `font-size:${fallbackFontSize}px;font-weight:400;letter-spacing:0.02em;text-transform:uppercase;`;
    return icon;
  }

  function buildPriceCell_(it, baseFont, amountSize = "18px") {
    const price = document.createElement("div");
    price.style.textAlign = "right";
    price.style.fontFamily = quotePriceFont_();
    price.style.fontVariantNumeric = "tabular-nums";

    const base = it.priceBase;
    const eff = it.priceEffective;
    const hasDiscount = Number.isFinite(base) && Number.isFinite(eff) && eff < base;

    if (hasDiscount) {
      const oldPrice = document.createElement("div");
      oldPrice.style.cssText = "color:#777;text-decoration:line-through;font-weight:400;";
      oldPrice.textContent = formatPhp(base);
      price.appendChild(oldPrice);

      const newPrice = document.createElement("div");
      newPrice.style.cssText = `font-size:${amountSize};font-weight:400;`;
      newPrice.textContent = formatPhp(eff);
      price.appendChild(newPrice);
    } else if (Number.isFinite(eff)) {
      const currentPrice = document.createElement("div");
      currentPrice.style.cssText = `font-size:${amountSize};font-weight:400;`;
      currentPrice.textContent = formatPhp(eff);
      price.appendChild(currentPrice);
    } else if (Number.isFinite(base)) {
      const basePrice = document.createElement("div");
      basePrice.style.cssText = `font-size:${amountSize};font-weight:400;`;
      basePrice.textContent = formatPhp(base);
      price.appendChild(basePrice);
    }

    return price;
  }

  function buildProductImageBox_(it, size) {
    const imgBox = document.createElement("div");
    imgBox.style.cssText =
      `width:${size}px;height:${size}px;border-radius:12px;background:#f6f6f6;` +
      "overflow:hidden;display:flex;align-items:center;justify-content:center;border:1px solid rgba(0,0,0,0.05);";

    if (it.image) {
      const im = document.createElement("img");
      im.src = it.image;
      im.alt = it.title || "";
      im.crossOrigin = "anonymous";
      im.style.cssText = "width:100%;height:100%;object-fit:contain;background:#fff;";
      imgBox.appendChild(im);
    }

    return imgBox;
  }

  function cleanContentStyle_(mode) {
    return mode === "clean"
      ? `width:${CLEAN_CONTENT_WIDTH}px;max-width:100%;margin-left:auto;margin-right:auto;`
      : "";
  }

  function isCompactMobileMode_(mode) {
    return mode === "compact_mobile" || mode === "socials_compact_mobile";
  }

  function isSocialsCompactMode_(mode) {
    return mode === "socials_compact" || mode === "socials_compact_mobile";
  }

  function getSocialsCompactHeight_(mode) {
    if (mode === "socials_compact") return SOCIALS_COMPACT_CARD_HEIGHT;
    if (mode === "socials_compact_mobile") return SOCIALS_COMPACT_MOBILE_CARD_HEIGHT;
    return 0;
  }

  function getSocialsCompactRowsPerPage_(mode) {
    if (mode === "socials_compact") return SOCIALS_COMPACT_ROWS_PER_PAGE;
    if (mode === "socials_compact_mobile") return SOCIALS_COMPACT_MOBILE_ROWS_PER_PAGE;
    return 0;
  }

  function buildQuoteHeader_(wrap, snapshot, options = {}, mode = "detailed") {
    const isCompactMobile = isCompactMobileMode_(mode);
    const pageNumber = Number(options.pageNumber || 0);
    const pageCount = Number(options.pageCount || 0);
    const header = document.createElement("div");
    header.style.cssText =
      `display:flex;flex-direction:column;align-items:center;gap:${isCompactMobile ? 6 : 8}px;` +
      `margin-bottom:${isCompactMobile ? 10 : 12}px;text-align:center;`;

    const logoUrl = getBrandLogo_(options.brandLogo);
    if (logoUrl) {
      const logo = document.createElement("img");
      logo.src = logoUrl;
      logo.alt = "Uncapped PC";
      logo.crossOrigin = "anonymous";
      logo.style.cssText =
        `max-width:${isCompactMobile ? COMPACT_MOBILE_HEADER_LOGO_MAX_WIDTH : LOGO_MAX_WIDTH}px;` +
        `max-height:${isCompactMobile ? COMPACT_MOBILE_HEADER_LOGO_MAX_HEIGHT : LOGO_MAX_HEIGHT}px;` +
        "object-fit:contain;display:block;";
      header.appendChild(logo);
    }

    const info = document.createElement("div");
    info.style.cssText =
      `${mode === "clean" ? cleanContentStyle_(mode) : "width:100%;"}display:grid;gap:${isCompactMobile ? 3 : 4}px;` +
      "justify-items:start;text-align:left;";

    const promoTitle = getQuotePromoTitle_(snapshot, options);
    if (promoTitle) {
      const promoEl = document.createElement("div");
      promoEl.style.cssText =
        `font-family:${quoteTitleFont_()};font-size:${isCompactMobile ? 12 : 14}px;font-weight:700;line-height:1.2;` +
        "white-space:normal;overflow-wrap:anywhere;";
      promoEl.textContent = promoTitle;
      info.appendChild(promoEl);
    }

    const metaRow = document.createElement("div");
    metaRow.style.cssText =
      `display:grid;grid-template-columns:minmax(0,1fr) auto;gap:${isCompactMobile ? 8 : 16}px;align-items:start;width:100%;`;

    const left = document.createElement("div");
    left.style.cssText = `display:grid;gap:${isCompactMobile ? 3 : 4}px;min-width:0;`;

    const quoteCode = getQuoteCode_(options.quoteCode);
    const code = document.createElement("div");
    code.style.cssText = `font-weight:800;${isCompactMobile ? "font-size:11px;" : ""}`;
    code.textContent = `Quote Code: ${quoteCode || "-"}`;
    left.appendChild(code);

    const quoteVersion = getQuoteVersion_(options.quoteVersion);
    if (quoteVersion) {
      const versionEl = document.createElement("div");
      versionEl.style.cssText = `font-size:${isCompactMobile ? 11 : 12}px;color:#333;`;
      versionEl.textContent = `Version: v${quoteVersion}`;
      left.appendChild(versionEl);
    }

    if (pageCount > 1 && pageNumber > 0) {
      const pageEl = document.createElement("div");
      pageEl.style.cssText = `font-size:${isCompactMobile ? 11 : 12}px;color:#333;`;
      pageEl.textContent = `Page ${pageNumber} of ${pageCount}`;
      left.appendChild(pageEl);
    }

    const dt = formatDateTime_();
    const dateEl = document.createElement("div");
    dateEl.style.cssText = `font-size:${isCompactMobile ? 11 : 12}px;color:#333;text-align:right;white-space:nowrap;`;
    dateEl.textContent = `Date: ${dt.date}`;
    metaRow.appendChild(left);
    metaRow.appendChild(dateEl);
    info.appendChild(metaRow);

    header.appendChild(info);
    wrap.appendChild(header);
  }

  function buildDetailedLineRow_(it, baseFont) {
    const qty = Number.isFinite(it.qty) && it.qty > 0 ? it.qty : 1;
    const qtyLabel = qty > 1 ? ` x${qty}` : "";
    const quick = it.quick || it.vendor || "No quick description.";

    const row = document.createElement("div");
    row.style.cssText =
      `display:grid;grid-template-columns:${LABEL_COL_WIDTH}px ${IMG_SIZE}px 1fr ${PRICE_COL_WIDTH}px;` +
      `gap:${ROW_GAP}px;align-items:start;padding:${ROW_PADDING}px;border:1px solid #eee;` +
      `border-radius:${ROW_RADIUS}px;`;

    const component = document.createElement("div");
    component.style.cssText = "font-weight:400;color:#0b3a5a;";
    component.textContent = it.componentLabel || it.key || "";

    const info = document.createElement("div");

    const title = document.createElement("div");
    title.style.cssText = `font-family:${quoteTitleFont_()};font-weight:500;margin-bottom:${TITLE_MARGIN}px;`;
    title.textContent = `${it.title || ""}${qtyLabel}`;
    info.appendChild(title);

    if (it.variantTitle) {
      const variant = document.createElement("div");
      variant.style.cssText = "font-size:11px;color:#666;margin-bottom:4px;";
      variant.textContent = it.variantTitle;
      info.appendChild(variant);
    }

    const quickText = document.createElement("div");
    quickText.style.cssText = "white-space:pre-line;color:#333;font-size:12px;";
    quickText.textContent = quick;
    info.appendChild(quickText);

    row.appendChild(component);
    row.appendChild(buildProductImageBox_(it, IMG_SIZE));
    row.appendChild(info);
    row.appendChild(buildPriceCell_(it, baseFont));
    return row;
  }

  function buildCleanLineRow_(it, baseFont) {
    const qty = Number.isFinite(it.qty) && it.qty > 0 ? it.qty : 1;
    const cleanImageSize = 66;

    const row = document.createElement("div");
    // Clean row columns: image | product info | flexible spacer | qty | price.
    // The spacer is what controls the empty middle gap between product info and pricing.
    row.style.cssText =
      `display:grid;grid-template-columns:${cleanImageSize}px minmax(0,560px) 1fr 30px 104px;` +
      "gap:4px;align-items:start;padding:8px 12px 8px 10px;border:1px solid rgba(0,0,0,0.08);" +
      "border-radius:20px;background:linear-gradient(180deg,#ffffff 0%,#fbfbfb 100%);";

    const info = document.createElement("div");
    info.style.cssText = "display:grid;gap:4px;min-width:0;";

    const component = document.createElement("div");
    component.style.cssText =
      "font-size:11px;font-weight:400;letter-spacing:0.04em;text-transform:uppercase;" +
      "color:rgba(0,0,0,0.52);";
    component.textContent = it.componentLabel || it.key || "";
    info.appendChild(component);

    const title = document.createElement("div");
    title.style.cssText = `font-family:${quoteTitleFont_()};font-size:16px;font-weight:500;line-height:1.3;`;
    title.textContent = it.title || "";
    info.appendChild(title);

    if (it.variantTitle) {
      const variant = document.createElement("div");
      variant.style.cssText = "font-size:11px;color:rgba(0,0,0,0.58);line-height:1.3;";
      variant.textContent = it.variantTitle;
      info.appendChild(variant);
    }

    const qtyBox = document.createElement("div");
    qtyBox.style.cssText = "display:grid;gap:2px;justify-items:center;text-align:center;";

    const qtyLabel = document.createElement("div");
    qtyLabel.style.cssText =
      "font-size:11px;font-weight:400;letter-spacing:0.04em;text-transform:uppercase;opacity:0.58;";
    qtyLabel.textContent = "Qty";
    qtyBox.appendChild(qtyLabel);

    const qtyValue = document.createElement("div");
    qtyValue.style.cssText = "font-size:17px;font-weight:400;";
    qtyValue.textContent = String(qty);
    qtyBox.appendChild(qtyValue);

    row.appendChild(buildProductImageBox_(it, cleanImageSize));
    row.appendChild(info);
    row.appendChild(document.createElement("div"));
    row.appendChild(qtyBox);
    row.appendChild(buildPriceCell_(it, baseFont, "18px"));
    return row;
  }

  function buildCompactLineRow_(it, baseFont, mode = "compact") {
    const isCompactMobile = isCompactMobileMode_(mode);
    const qty = Number.isFinite(it.qty) && it.qty > 0 ? it.qty : 1;
    const compactImageSize = isCompactMobile ? COMPACT_MOBILE_IMAGE_SIZE : COMPACT_IMAGE_SIZE;
    const quick = it.quick || it.vendor || "";

    const row = document.createElement("div");
    row.style.cssText =
      `display:grid;grid-template-columns:${compactImageSize}px minmax(0,1fr) ` +
      `${isCompactMobile ? COMPACT_MOBILE_QTY_COL_WIDTH : COMPACT_QTY_COL_WIDTH}px ` +
      `${isCompactMobile ? COMPACT_MOBILE_PRICE_COL_WIDTH : COMPACT_PRICE_COL_WIDTH}px;` +
      `gap:${isCompactMobile ? COMPACT_MOBILE_ROW_GAP : COMPACT_ROW_GAP}px;align-items:center;` +
      `padding:${isCompactMobile ? COMPACT_MOBILE_ROW_PADDING : COMPACT_ROW_PADDING}px;` +
      "border:1px solid rgba(51,51,51,0.12);" +
      `border-radius:${isCompactMobile ? COMPACT_MOBILE_ROW_RADIUS : COMPACT_ROW_RADIUS}px;background:#fff;`;

    const info = document.createElement("div");
    info.style.cssText =
      `display:grid;gap:${isCompactMobile ? 3 : 2}px;min-width:0;` +
      (isCompactMobile ? "" : "align-self:start;padding-top:0;");

    const component = document.createElement("div");
    component.style.cssText =
      `display:block;margin-bottom:${isCompactMobile ? 1 : 0}px;color:#5f5f5f;` +
      `font-size:${isCompactMobile ? 10 : 12}px;font-weight:800;letter-spacing:${isCompactMobile ? "0.06em" : "0.08em"};` +
      "text-transform:uppercase;" +
      (isCompactMobile
        ? "line-height:1.2;padding:1px 0;white-space:nowrap;overflow:visible;"
        : "line-height:18px;padding:3px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;");
    component.textContent = it.componentLabel || it.key || "";
    info.appendChild(component);

    const title = document.createElement("div");
    title.style.cssText =
      `font-family:${quoteTitleFont_()};font-size:${isCompactMobile ? 13 : 18}px;font-weight:700;line-height:${isCompactMobile ? 1.45 : "28px"};` +
      (isCompactMobile
        ? "white-space:normal;overflow-wrap:anywhere;"
        : "display:block;padding:4px 0 5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;");
    title.textContent = it.title || "";
    info.appendChild(title);

    if (it.variantTitle) {
      const variant = document.createElement("div");
      variant.style.cssText =
        `margin-top:0;color:#666;font-size:${isCompactMobile ? 10 : 12}px;line-height:${isCompactMobile ? 1.45 : "22px"};` +
        (isCompactMobile
          ? "white-space:normal;overflow-wrap:anywhere;"
          : "display:block;padding:3px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;");
      variant.textContent = it.variantTitle;
      info.appendChild(variant);
    }

    if (quick && !isCompactMobile) {
      const quickText = document.createElement("div");
      quickText.style.cssText =
        `margin-top:0;color:#5f5f5f;font-size:${isCompactMobile ? 10 : 12}px;line-height:${isCompactMobile ? 1.45 : "22px"};` +
        (isCompactMobile
          ? "white-space:normal;overflow-wrap:anywhere;"
          : "display:block;padding:3px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;");
      quickText.textContent = quick;
      info.appendChild(quickText);
    }

    const qtyBox = document.createElement("div");
    qtyBox.style.cssText = `display:grid;gap:${isCompactMobile ? 2 : 4}px;justify-items:center;text-align:center;`;

    const qtyLabel = document.createElement("div");
    qtyLabel.style.cssText =
      `color:#5f5f5f;font-size:${isCompactMobile ? 10 : 11}px;font-weight:800;letter-spacing:${isCompactMobile ? "0.06em" : "0.08em"};text-transform:uppercase;`;
    qtyLabel.textContent = "Qty";
    qtyBox.appendChild(qtyLabel);

    const qtyValue = document.createElement("div");
    qtyValue.style.cssText = `font-size:${isCompactMobile ? 14 : 16}px;font-weight:800;`;
    qtyValue.textContent = String(qty);
    qtyBox.appendChild(qtyValue);

    row.appendChild(buildProductImageBox_(it, compactImageSize));
    row.appendChild(info);
    row.appendChild(qtyBox);
    row.appendChild(buildPriceCell_(it, baseFont, isCompactMobile ? "14px" : "16px"));
    return row;
  }

  function isQuotationMode_(mode) {
    return mode === "quotation" || mode === "quotation_mobile";
  }

  function itemLineTotal_(it) {
    const eff = Number(it && it.priceEffective);
    if (Number.isFinite(eff)) return eff;
    const base = Number(it && it.priceBase);
    return Number.isFinite(base) ? base : 0;
  }

  function getQuotePromoTitle_(snapshot, options = {}) {
    const explicit = String(options.promoLabel || "").trim();
    if (explicit) return explicit;

    const meta = snapshot && snapshot.meta && typeof snapshot.meta === "object" ? snapshot.meta : {};
    return String(meta.promoLabel || meta.promoBadgeLabel || "").trim();
  }

  function getQuotationTitle_(snapshot, options = {}) {
    const explicit = String(options.buildTitle || options.title || "").trim();
    if (explicit) return explicit;

    const meta = snapshot && snapshot.meta && typeof snapshot.meta === "object" ? snapshot.meta : {};
    const promo = String(meta.promoLabel || meta.promoBadgeLabel || "").trim();
    if (promo) return promo;

    return "Custom PC Build";
  }

  function buildQuotationHeader_(wrap, snapshot, options = {}, mode = "quotation") {
    const isMobile = mode === "quotation_mobile";
    const header = document.createElement("div");
    header.style.cssText =
      `display:grid;gap:${isMobile ? 8 : 10}px;margin-bottom:${isMobile ? 10 : 14}px;`;

    const logoRow = document.createElement("div");
    logoRow.style.cssText = "display:flex;align-items:center;justify-content:center;min-width:0;";

    const logoUrl = getBrandLogo_(options.brandLogo);
    if (logoUrl) {
      const logo = document.createElement("img");
      logo.src = logoUrl;
      logo.alt = "Uncapped PC";
      logo.crossOrigin = "anonymous";
      logo.style.cssText =
        `max-width:${isMobile ? 112 : 150}px;max-height:${isMobile ? 40 : 52}px;object-fit:contain;display:block;`;
      logoRow.appendChild(logo);
    }
    header.appendChild(logoRow);

    const location = document.createElement("div");
    location.style.cssText =
      `font-size:${isMobile ? 9 : 11}px;color:rgba(0,0,0,0.58);text-align:center;line-height:1.2;`;
    location.textContent = "Location: Binondo, Manila";
    header.appendChild(location);

    const metaWrap = document.createElement("div");
    metaWrap.style.cssText =
      `display:grid;grid-template-columns:minmax(0,1fr) auto;gap:${isMobile ? 8 : 16}px;align-items:start;`;

    const left = document.createElement("div");
    left.style.cssText = `display:grid;gap:${isMobile ? 3 : 4}px;min-width:0;`;

    const title = document.createElement("div");
    title.style.cssText =
      `font-family:${quoteTitleFont_()};font-size:${isMobile ? 12 : 15}px;font-weight:800;line-height:1.2;` +
      "white-space:normal;overflow-wrap:anywhere;";
    title.textContent = getQuotationTitle_(snapshot, options);
    left.appendChild(title);

    const quoteCode = getQuoteCode_(options.quoteCode);
    const version = getQuoteVersion_(options.quoteVersion);
    [
      ["Quote Code", quoteCode || "-"],
      version ? ["Version", `v${version}`] : null
    ]
      .filter(Boolean)
      .forEach(([label, value]) => {
        const row = document.createElement("div");
        row.style.cssText =
          `display:flex;gap:5px;align-items:baseline;font-size:${isMobile ? 9 : 11}px;color:#333;`;
        const strong = document.createElement("strong");
        strong.textContent = `${label}:`;
        const span = document.createElement("span");
        span.textContent = value;
        row.appendChild(strong);
        row.appendChild(span);
        left.appendChild(row);
      });

    const dt = formatDateTime_();
    const date = document.createElement("div");
    date.style.cssText =
      `font-size:${isMobile ? 9 : 11}px;color:#333;text-align:right;white-space:nowrap;padding-top:${isMobile ? 1 : 2}px;`;
    date.textContent = dt.date;

    metaWrap.appendChild(left);
    metaWrap.appendChild(date);
    header.appendChild(metaWrap);
    wrap.appendChild(header);
  }

  function buildQuotationTable_(items, mode = "quotation") {
    const isMobile = mode === "quotation_mobile";
    const columns = isMobile ? "minmax(0,1fr) 24px 74px" : "minmax(0,1fr) 42px 118px";
    const table = document.createElement("div");
    table.style.cssText =
      `font-size:${isMobile ? 10 : 12}px;line-height:1.2;`;

    const header = document.createElement("div");
    header.style.cssText =
      `display:grid;grid-template-columns:${columns};` +
      "background:#f7f7f7;border-bottom:1px solid rgba(0,0,0,0.05);font-weight:800;text-transform:uppercase;";

    ["Description", "Qty", "Total"].forEach((label, idx) => {
      const cell = document.createElement("div");
      cell.style.cssText =
        `padding:${isMobile ? "6px 4px" : "7px 8px"};` +
        (idx >= 1 ? "text-align:right;" : "");
      cell.textContent = label;
      header.appendChild(cell);
    });
    table.appendChild(header);

    items.forEach((it) => {
      const qty = Number.isFinite(it.qty) && it.qty > 0 ? it.qty : 1;
      const lineTotal = itemLineTotal_(it);
      const row = document.createElement("div");
      row.style.cssText =
        `display:grid;grid-template-columns:${columns};` +
        "border-bottom:1px solid rgba(0,0,0,0.05);";

      const desc = document.createElement("div");
      desc.style.cssText =
        `padding:${isMobile ? "6px 4px" : "7px 8px"};min-width:0;overflow-wrap:anywhere;`;

      const component = document.createElement("div");
      component.style.cssText =
        `font-size:${isMobile ? 7 : 9}px;font-weight:650;letter-spacing:0.025em;text-transform:uppercase;color:rgba(0,0,0,0.48);`;
      component.textContent = it.componentLabel || it.key || "";

      const title = document.createElement("div");
      title.style.cssText =
        `font-family:${quoteTitleFont_()};font-size:${isMobile ? 10 : 13}px;font-weight:800;line-height:1.22;`;
      title.textContent = it.title || "";

      desc.appendChild(component);
      desc.appendChild(title);

      if (it.variantTitle) {
        const variant = document.createElement("div");
        variant.style.cssText = `font-size:${isMobile ? 8 : 10}px;color:#666;margin-top:2px;`;
        variant.textContent = it.variantTitle;
        desc.appendChild(variant);
      }

      const qtyCell = document.createElement("div");
      qtyCell.style.cssText = `padding:${isMobile ? "6px 4px" : "7px 8px"};text-align:right;`;
      qtyCell.textContent = String(qty);

      const totalCell = document.createElement("div");
      totalCell.style.cssText =
        `padding:${isMobile ? "6px 4px" : "7px 8px"};text-align:right;font-family:${quotePriceFont_()};` +
        "font-variant-numeric:tabular-nums;";
      totalCell.textContent = formatPhp(lineTotal);

      row.appendChild(desc);
      row.appendChild(qtyCell);
      row.appendChild(totalCell);
      table.appendChild(row);
    });

    return table;
  }

  function buildQuotationTotals_(wrap, snapshot, mode = "quotation") {
    const isMobile = mode === "quotation_mobile";
    const totals = snapshot && snapshot.totals ? snapshot.totals : {};
    const meta = snapshot && snapshot.meta ? snapshot.meta : {};
    const total = Number(totals.total ?? totals.payableSubtotal ?? totals.subtotal ?? "");
    const savings = Number(totals.savings ?? "");
    const promoDiscount = Number(totals.promoDiscount ?? "");
    const promoLabel = String(meta.promoLabel || totals.promoLabel || "Promo discount").trim();
    const addonRows = Array.isArray(totals.addonDiscountRows) ? totals.addonDiscountRows : [];
    const manualOff = Number(totals.manualOff ?? "");

    const box = document.createElement("div");
    box.style.cssText =
      `margin-top:${isMobile ? 6 : 8}px;margin-left:auto;width:${isMobile ? "82%" : "42%"};` +
      `display:grid;gap:${isMobile ? 0 : 3}px;`;

    function addRow(label, value, strong = false) {
      const row = document.createElement("div");
      row.style.cssText =
        `display:grid;grid-template-columns:minmax(0,1fr) ${isMobile ? "92px" : "128px"};` +
        `gap:${isMobile ? 4 : 6}px;padding:${strong ? (isMobile ? "10px 0 0" : "10px 0 0") : (isMobile ? "0 0 5px" : "2px 0")};` +
        `${strong ? "border-top:1px solid rgba(0,0,0,0.12);" : ""}align-items:center;`;
      const labelEl = document.createElement("div");
      labelEl.style.cssText =
        `font-size:${strong ? (isMobile ? 10 : 12) : (isMobile ? 9 : 11)}px;` +
        `${strong ? "font-weight:800;text-transform:uppercase;color:#111;" : "font-weight:500;color:rgba(0,0,0,0.52);"}`;
      labelEl.textContent = label;
      const valueEl = document.createElement("div");
      valueEl.style.cssText =
        `font-family:${quotePriceFont_()};font-size:${strong ? (isMobile ? 13 : 16) : (isMobile ? 10 : 12)}px;` +
        `font-weight:${strong ? 800 : 500};font-variant-numeric:tabular-nums;text-align:right;` +
        `${strong ? "color:#111;" : "color:rgba(0,0,0,0.58);"}`;
      valueEl.textContent = value;
      row.appendChild(labelEl);
      row.appendChild(valueEl);
      box.appendChild(row);
    }

    if (Number.isFinite(savings) && savings > 0) addRow("Bundle Discount", `-${formatPhp(savings)}`);
    if (Number.isFinite(promoDiscount) && promoDiscount > 0) addRow(promoLabel, `-${formatPhp(promoDiscount)}`);
    addonRows.forEach((row) => {
      const amount = Number(row?.discountAmount || 0);
      const label = String(row?.label || "Add-on discount").trim() || "Add-on discount";
      if (Number.isFinite(amount) && amount > 0) addRow(label, `-${formatPhp(amount)}`);
    });
    if (Number.isFinite(manualOff) && manualOff > 0) addRow("Additional Discount", `-${formatPhp(manualOff)}`);
    if (Number.isFinite(total)) addRow("Subtotal", formatPhp(total), true);

    wrap.appendChild(box);
  }

  function buildQuoteTable_(items, mode, baseFont) {
    const table = document.createElement("div");
    table.style.cssText =
      `display:flex;flex-direction:column;gap:${mode === "detailed" ? 10 : isCompactMobileMode_(mode) ? 10 : 12}px;` +
      cleanContentStyle_(mode);

    items.forEach((it) => {
      const row =
        mode === "clean"
          ? buildCleanLineRow_(it, baseFont)
          : mode === "compact" || mode === "compact_mobile" || isSocialsCompactMode_(mode)
            ? buildCompactLineRow_(it, baseFont, mode)
            : buildDetailedLineRow_(it, baseFont);
      table.appendChild(row);
    });

    return table;
  }

  function buildQuoteTotals_(wrap, snapshot, baseFont, mode = "detailed") {
    const isCompactMobile = isCompactMobileMode_(mode);
    const totals = snapshot && snapshot.totals ? snapshot.totals : {};
    const meta = snapshot && snapshot.meta ? snapshot.meta : {};
    const total = Number(totals.total ?? totals.subtotal ?? "");
    const savings = Number(totals.savings ?? "");
    const promoDiscount = Number(totals.promoDiscount ?? "");
    const promoLabel = String(meta.promoLabel || totals.promoLabel || "Promo discount").trim();
    const addonRows = Array.isArray(totals.addonDiscountRows) ? totals.addonDiscountRows : [];
    const manualOff = Number(totals.manualOff ?? "");

    const foot = document.createElement("div");
    foot.style.cssText =
      `margin-top:${isCompactMobile ? 12 : 14}px;display:flex;flex-direction:column;` +
      `gap:${isCompactMobile ? COMPACT_MOBILE_TOTALS_GAP : 6}px;align-items:flex-end;` +
      `padding-right:${isCompactMobile ? COMPACT_MOBILE_TOTALS_PADDING_RIGHT : 8}px;` +
      cleanContentStyle_(mode);

    if (Number.isFinite(savings) && savings > 0) {
      const saved = document.createElement("div");
      saved.style.cssText =
        `font-size:${isCompactMobile ? 12 : 13}px;font-weight:400;color:#0b3a5a;text-align:right;max-width:100%;overflow-wrap:anywhere;`;
      saved.style.fontFamily = baseFont;
      saved.style.fontVariantNumeric = "tabular-nums";
      saved.textContent = `Bundle Discount -${formatPhp(savings)}`;
      foot.appendChild(saved);
    }

    if (Number.isFinite(promoDiscount) && promoDiscount > 0) {
      const promo = document.createElement("div");
      promo.style.cssText =
        `font-size:${isCompactMobile ? 12 : 13}px;font-weight:400;color:#0b3a5a;text-align:right;max-width:100%;overflow-wrap:anywhere;`;
      promo.style.fontFamily = baseFont;
      promo.style.fontVariantNumeric = "tabular-nums";
      promo.textContent = `${promoLabel} -${formatPhp(promoDiscount)}`;
      foot.appendChild(promo);
    }

    addonRows.forEach((row) => {
      const amount = Number(row?.discountAmount || 0);
      if (!(Number.isFinite(amount) && amount > 0)) return;
      const label = String(row?.label || "Add-on discount").trim() || "Add-on discount";
      const addon = document.createElement("div");
      addon.style.cssText =
        `font-size:${isCompactMobile ? 12 : 13}px;font-weight:400;color:#0b3a5a;text-align:right;max-width:100%;overflow-wrap:anywhere;`;
      addon.style.fontFamily = baseFont;
      addon.style.fontVariantNumeric = "tabular-nums";
      addon.textContent = `${label} -${formatPhp(amount)}`;
      foot.appendChild(addon);
    });

    if (Number.isFinite(manualOff) && manualOff > 0) {
      const added = document.createElement("div");
      added.style.cssText =
        `font-size:${isCompactMobile ? 12 : 13}px;font-weight:400;color:#0b3a5a;text-align:right;max-width:100%;overflow-wrap:anywhere;`;
      added.style.fontFamily = baseFont;
      added.style.fontVariantNumeric = "tabular-nums";
      added.textContent = `Additional Discount -${formatPhp(manualOff)}`;
      foot.appendChild(added);
    }

    if (Number.isFinite(total)) {
      const subtotal = document.createElement("div");
      subtotal.style.cssText = `font-size:${isCompactMobile ? 16 : 18}px;font-weight:600;text-align:right;max-width:100%;`;
      subtotal.style.fontFamily = quotePriceFont_();
      subtotal.style.fontVariantNumeric = "tabular-nums";
      subtotal.textContent = `Subtotal: ${formatPhp(total)}`;
      foot.appendChild(subtotal);
    }

    wrap.appendChild(foot);
  }

  function buildQuoteSocials_(wrap, mode = "detailed") {
    const isCompactMobile = isCompactMobileMode_(mode);
    const isSocials = isSocialsCompactMode_(mode);
    const socials = document.createElement("div");
    socials.style.cssText =
      `${isSocials ? `margin-top:auto;padding-top:${isCompactMobile ? 8 : 12}px;` : `margin-top:${isCompactMobile ? 12 : 16}px;`}` +
      "display:flex;flex-direction:column;" +
      `gap:${isCompactMobile ? 6 : 8}px;align-items:center;` +
      cleanContentStyle_(mode);

    const icons = document.createElement("div");
    icons.style.cssText =
      `display:flex;gap:${isCompactMobile ? COMPACT_MOBILE_SOCIAL_GAP : SOCIAL_GAP}px;align-items:center;justify-content:center;`;

    SOCIAL_ICONS.forEach((icon) => {
      icons.appendChild(buildSocialIcon_(icon.url, icon.label, isCompactMobile ? COMPACT_MOBILE_SOCIAL_ICON_SIZE : SOCIAL_ICON_SIZE));
    });

    const line = document.createElement("div");
    line.style.cssText = `width:${isCompactMobile ? 34 : 30}%;height:1px;background:${SOCIAL_LINE_COLOR};`;

    const handle = document.createElement("div");
    handle.style.cssText = `font-size:${isCompactMobile ? 11 : 12}px;font-weight:400;letter-spacing:0.02em;`;
    handle.textContent = SOCIAL_HANDLE;

    const contact = document.createElement("div");
    contact.style.cssText =
      `font-size:${isCompactMobile ? 10 : 11}px;font-weight:400;color:rgba(0,0,0,.62);` +
      "line-height:1.35;text-align:center;max-width:100%;white-space:normal;overflow-wrap:anywhere;";
    contact.textContent = SOCIAL_CONTACT_LINE;

    socials.appendChild(icons);
    socials.appendChild(line);
    socials.appendChild(handle);
    socials.appendChild(contact);
    wrap.appendChild(socials);
  }

  function buildQuoteCard(snapshot, options = {}) {
    const baseFont = getBaseFont_();
    ACTIVE_QUOTE_FONTS = getQuoteFonts_(baseFont, options.fontPreset);
    const mode = resolveQuoteScreenshotMode_(options);
    const socialHeight = getSocialsCompactHeight_(mode);
    const cardWidth =
      mode === "clean"
        ? CLEAN_CARD_WIDTH
        : mode === "socials_compact"
          ? SOCIALS_COMPACT_CARD_WIDTH
        : mode === "socials_compact_mobile"
          ? SOCIALS_COMPACT_MOBILE_CARD_WIDTH
        : mode === "compact_mobile"
          ? COMPACT_MOBILE_CARD_WIDTH
        : mode === "quotation"
          ? QUOTATION_CARD_WIDTH
          : mode === "quotation_mobile"
            ? QUOTATION_MOBILE_CARD_WIDTH
            : CARD_WIDTH;

    const wrap = document.createElement("div");
    wrap.id = "ucp-pcb-quoteimg-wrap";
    wrap.style.cssText =
      `position:fixed;left:-99999px;top:0;width:${cardWidth}px;` +
      (socialHeight ? `height:${socialHeight}px;box-sizing:border-box;display:flex;flex-direction:column;` : "") +
      `background:#fff;color:#111;padding:${isQuotationMode_(mode) ? (mode === "quotation_mobile" ? 12 : 18) : CARD_PADDING}px;` +
      `border:${WRAP_BORDER};border-radius:${isQuotationMode_(mode) ? 4 : WRAP_RADIUS}px;` +
      `box-shadow:${isQuotationMode_(mode) ? "none" : WRAP_SHADOW};overflow:hidden;`;
    wrap.style.fontFamily = ACTIVE_QUOTE_FONTS.base || baseFont;
    wrap.style.fontSize = isQuotationMode_(mode) ? (mode === "quotation_mobile" ? "11px" : "12px") : isCompactMobileMode_(mode) ? "13px" : "14px";
    wrap.style.lineHeight = "1.3";

    const allItems = extractLineItems(snapshot);
    const items = Array.isArray(options.items) ? options.items : allItems;
    const isFinalPage = !isSocialsCompactMode_(mode) || options.isFinalPage !== false;
    if (isQuotationMode_(mode)) {
      buildQuotationHeader_(wrap, snapshot, options, mode);
      wrap.appendChild(buildQuotationTable_(items, mode));
      buildQuotationTotals_(wrap, snapshot, mode);
    } else {
      buildQuoteHeader_(wrap, snapshot, options, mode);
      wrap.appendChild(buildQuoteTable_(items, mode, baseFont));
      if (isFinalPage) buildQuoteTotals_(wrap, snapshot, baseFont, mode);
    }
    if (isFinalPage) buildQuoteSocials_(wrap, mode);

    document.body.appendChild(wrap);
    return { wrap, itemsCount: allItems.length, mode };
  }

  async function waitImages(container, timeoutMs = 3500) {
    const imgs = Array.from(container.querySelectorAll("img"));
    const start = Date.now();

    for (const im of imgs) {
      if (im.complete && im.naturalWidth > 0) continue;
      const left = Math.max(0, timeoutMs - (Date.now() - start));
      try {
        await Promise.race([
          im.decode(),
          new Promise((_, rej) => setTimeout(() => rej(new Error("img timeout")), left))
        ]);
      } catch (e) {}
    }
  }

  async function downloadPng(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function isRestrictedInAppBrowser_() {
    const ua = String(navigator.userAgent || "");
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    if (!isMobile) return false;

    const isFacebookBrowser = /FB_IAB|FBAN|FBAV|FB4A|FBIOS|FBSS|Messenger/i.test(ua);
    const isOtherInAppBrowser = /Instagram|Line|TikTok/i.test(ua);
    const isAndroidWebView = /; wv\)/i.test(ua);
    return isFacebookBrowser || isOtherInAppBrowser || isAndroidWebView;
  }

  function quoteImageFile_(blob, filename) {
    try {
      return new File([blob], filename, { type: "image/png" });
    } catch (e) {
      return null;
    }
  }

  async function sharePng_(blob, filename) {
    if (!navigator.share || !navigator.canShare) return { method: "" };

    const file = quoteImageFile_(blob, filename);
    if (!file) return { method: "" };

    const shareData = {
      files: [file],
      title: "Uncapped PC Quote",
      text: "Uncapped PC quote screenshot"
    };

    try {
      if (!navigator.canShare({ files: [file] })) return { method: "" };
    } catch (e) {
      return { method: "" };
    }

    try {
      await navigator.share(shareData);
      return { method: "shared" };
    } catch (err) {
      const name = String(err && err.name ? err.name : "");
      if (name === "AbortError") return { method: "cancelled" };
      return { method: "" };
    }
  }

  async function sharePngFiles_(pages) {
    if (!navigator.share || !navigator.canShare) return { method: "" };

    const files = pages
      .map((page) => quoteImageFile_(page.blob, page.filename))
      .filter(Boolean);
    if (!files.length || files.length !== pages.length) return { method: "" };

    const shareData = {
      files,
      title: "Uncapped PC Quote",
      text: "Uncapped PC quote screenshots"
    };

    try {
      if (!navigator.canShare({ files })) return { method: "" };
    } catch (e) {
      return { method: "" };
    }

    try {
      await navigator.share(shareData);
      return { method: "shared" };
    } catch (err) {
      const name = String(err && err.name ? err.name : "");
      if (name === "AbortError") return { method: "cancelled" };
      return { method: "" };
    }
  }

  function closePreview_(overlay, url) {
    if (overlay && overlay.parentNode) overlay.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function showImagePreview_(blob, filename) {
    return showImagePreviewGallery_([{ blob, filename }]);
  }

  function showImagePreviewGallery_(pages) {
    const old = document.getElementById("ucp-pcb-quoteimg-preview");
    if (old) old.remove();

    const urls = pages.map((page) => ({
      url: URL.createObjectURL(page.blob),
      filename: page.filename
    }));
    const overlay = document.createElement("div");
    overlay.id = "ucp-pcb-quoteimg-preview";
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.82);" +
      "display:flex;align-items:center;justify-content:center;padding:14px;";

    const card = document.createElement("div");
    card.style.cssText =
      "width:min(100%,520px);max-height:96vh;background:#fff;border-radius:18px;" +
      "box-shadow:0 20px 60px rgba(0,0,0,.35);overflow:hidden;display:flex;flex-direction:column;";

    const head = document.createElement("div");
    head.style.cssText =
      "display:flex;align-items:flex-start;justify-content:space-between;gap:12px;" +
      "padding:12px 14px;border-bottom:1px solid rgba(0,0,0,.1);";

    const copy = document.createElement("div");
    copy.style.cssText = "display:grid;gap:3px;min-width:0;";

    const title = document.createElement("div");
    title.style.cssText = "font:800 14px/1.25 system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#111;";
    title.textContent = "Quote image ready";

    const hint = document.createElement("div");
    hint.style.cssText = "font:500 12px/1.35 system-ui,-apple-system,Segoe UI,Roboto,Arial;color:rgba(0,0,0,.66);";
    hint.textContent =
      pages.length > 1
        ? "Messenger may block downloads. Long-press each page to save or share it."
        : "Messenger may block downloads. Long-press the image to save or share it.";

    copy.appendChild(title);
    copy.appendChild(hint);

    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "Close";
    close.style.cssText =
      "border:1px solid rgba(0,0,0,.14);background:#fff;border-radius:999px;" +
      "padding:7px 10px;font:700 12px/1 system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#111;";

    head.appendChild(copy);
    head.appendChild(close);

    const imgWrap = document.createElement("div");
    imgWrap.style.cssText =
      "overflow:auto;background:#f4f4f4;padding:10px;flex:1 1 auto;min-height:0;display:grid;gap:12px;";

    urls.forEach((item, index) => {
      const page = document.createElement("div");
      page.style.cssText = "display:grid;gap:6px;";

      if (urls.length > 1) {
        const pageLabel = document.createElement("div");
        pageLabel.style.cssText = "font:800 12px/1 system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#333;";
        pageLabel.textContent = `Page ${index + 1} of ${urls.length}`;
        page.appendChild(pageLabel);
      }

      const img = document.createElement("img");
      img.src = item.url;
      img.alt = item.filename;
      img.style.cssText =
        "display:block;width:100%;height:auto;margin:0 auto;border-radius:10px;" +
        "box-shadow:0 0 0 1px rgba(0,0,0,.1);";
      page.appendChild(img);
      imgWrap.appendChild(page);
    });

    const actions = document.createElement("div");
    actions.style.cssText =
      "display:flex;justify-content:flex-end;gap:8px;padding:10px 14px;border-top:1px solid rgba(0,0,0,.1);";

    const open = document.createElement("button");
    open.type = "button";
    open.textContent = "Open image";
    open.style.cssText =
      "border:1px solid #111;background:#111;color:#fff;border-radius:999px;" +
      "padding:9px 12px;font:800 12px/1 system-ui,-apple-system,Segoe UI,Roboto,Arial;";

    actions.appendChild(open);

    card.appendChild(head);
    card.appendChild(imgWrap);
    card.appendChild(actions);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const closeGallery = () => {
      if (overlay && overlay.parentNode) overlay.remove();
      urls.forEach((item) => setTimeout(() => URL.revokeObjectURL(item.url), 1000));
    };

    close.addEventListener("click", closeGallery);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeGallery();
    });
    open.addEventListener("click", () => {
      const first = urls[0] && urls[0].url;
      if (!first) return;
      const win = window.open(first, "_blank", "noopener");
      if (!win) window.location.href = first;
    });

    return { method: "preview" };
  }

  async function savePng_(blob, filename, options = {}) {
    const forcePreview = options.forcePreview === true;
    const useInAppFallback = forcePreview || isRestrictedInAppBrowser_();

    if (useInAppFallback) {
      const shared = await sharePng_(blob, filename);
      if (shared.method) return shared;
      return showImagePreview_(blob, filename);
    }

    await downloadPng(blob, filename);
    return { method: "downloaded" };
  }

  async function savePngPages_(pages, options = {}) {
    const forcePreview = options.forcePreview === true;
    const useInAppFallback = forcePreview || isRestrictedInAppBrowser_();

    if (useInAppFallback) {
      const shared = await sharePngFiles_(pages);
      if (shared.method) return shared;
      return showImagePreviewGallery_(pages);
    }

    for (const page of pages) {
      await downloadPng(page.blob, page.filename);
      await new Promise((res) => setTimeout(res, 120));
    }
    return { method: "downloaded" };
  }

  function screenshotResultMessage_(result, label = "Quote screenshot") {
    const method = String(result && result.method ? result.method : "downloaded");
    const pageCount = Number(result && result.pageCount ? result.pageCount : 0);
    const multi = pageCount > 1;
    const outputLabel = multi ? `${label}s (${pageCount} pages)` : label;
    if (method === "shared") return `${outputLabel} shared.`;
    if (method === "preview") return `${outputLabel} opened. Long-press the image${multi ? "s" : ""} to save.`;
    if (method === "cancelled") return "Screenshot sharing cancelled.";
    return `${outputLabel} downloaded.`;
  }

  function quoteImageFilename_(quoteCode, pageNumber = 0, pageCount = 0) {
    const safeCode = String(quoteCode || "build")
      .trim()
      .replace(/[^a-z0-9_-]+/gi, "-")
      .replace(/^-+|-+$/g, "");
    const suffix = pageCount > 1 && pageNumber > 0 ? `-page-${pageNumber}` : "";
    return `uncapped-quote-${safeCode || "build"}${suffix}.png`;
  }

  function getSocialsCompactPages_(items, mode) {
    const rowsPerPage = getSocialsCompactRowsPerPage_(mode);
    if (!rowsPerPage || rowsPerPage < 1) return [items];

    const pages = [];
    for (let i = 0; i < items.length; i += rowsPerPage) {
      pages.push(items.slice(i, i + rowsPerPage));
    }
    return pages.length ? pages : [[]];
  }

  async function renderQuoteCardToBlob_(wrap, mode, options = {}) {
    await waitImages(wrap, Number(options.imageTimeoutMs) || 3500);

    const canvas = await window.html2canvas(wrap, {
      backgroundColor: "#ffffff",
      scale: Number(options.scale) || (mode === "socials_compact" ? 1 : 2),
      useCORS: true
    });

    const blob = await new Promise((res) => canvas.toBlob(res, "image/png", 1));
    if (!blob) throw new Error("toBlob failed");
    return blob;
  }

  async function downloadQuoteImage_(snapshot, options = {}) {
    if (!window.html2canvas) {
      throw new Error("html2canvas is missing. Add html2canvas.min.js to assets and include it.");
    }

    const mode = resolveQuoteScreenshotMode_(options);
    const items = extractLineItems(snapshot);
    if (!items.length) {
      throw new Error("No items selected yet.");
    }

    if (isSocialsCompactMode_(mode)) {
      const pages = getSocialsCompactPages_(items, mode);
      const qc = getQuoteCode_(options.quoteCode) || "build";
      const pageFiles = [];

      for (let index = 0; index < pages.length; index += 1) {
        const pageNumber = index + 1;
        const pageCount = pages.length;
        const pageOptions = {
          ...options,
          mode,
          items: pages[index],
          pageNumber,
          pageCount,
          isFinalPage: pageNumber === pageCount
        };
        const { wrap } = buildQuoteCard(snapshot, pageOptions);

        try {
          const blob = await renderQuoteCardToBlob_(wrap, mode, options);
          const filename = quoteImageFilename_(qc, pageNumber, pageCount);
          pageFiles.push({ blob, filename });
        } finally {
          wrap.remove();
        }
      }

      const saveResult = await savePngPages_(pageFiles, options);
      const lastFile = pageFiles[pageFiles.length - 1] || {};

      if (saveResult.method === "cancelled") {
        return {
          ok: false,
          cancelled: true,
          method: "cancelled",
          itemsCount: items.length,
          pageCount: pages.length,
          filename: lastFile.filename || quoteImageFilename_(qc, pages.length, pages.length)
        };
      }

      if (options.log !== false) {
        logQuoteScreenshot_(snapshot);
      }

      return {
        ok: true,
        cancelled: false,
        method: saveResult.method || "downloaded",
        itemsCount: items.length,
        pageCount: pages.length,
        filename: lastFile.filename || quoteImageFilename_(qc, pages.length, pages.length)
      };
    }

    const { wrap, itemsCount } = buildQuoteCard(snapshot, options);

    try {
      const blob = await renderQuoteCardToBlob_(wrap, mode, options);
      const qc = getQuoteCode_(options.quoteCode) || "build";
      const filename = String(options.filename || "").trim() || quoteImageFilename_(qc);
      const saveResult = await savePng_(blob, filename, options);

      if (options.log !== false && saveResult.method !== "cancelled") {
        logQuoteScreenshot_(snapshot);
      }

      return {
        ok: saveResult.method !== "cancelled",
        cancelled: saveResult.method === "cancelled",
        method: saveResult.method,
        itemsCount,
        filename
      };
    } finally {
      wrap.remove();
    }
  }

  async function onClick(e) {
    const btn = e.target.closest(BTN_SEL);
    if (!btn) return;
    e.preventDefault();

    if (!window.html2canvas) {
      showNotice("html2canvas is missing. Add html2canvas.min.js to assets and include it.");
      return;
    }

    const ok = await waitForApi(6000);
    if (!ok) {
      showNotice("Builder not ready. Refresh and try again.");
      return;
    }

    let snap;
    try {
      snap = window.UCP_PCB_API.getSnapshot();
    } catch (e) {
      showNotice("Unable to read build snapshot.");
      return;
    }

    const oldText = btn.textContent;
    btn.textContent = "Generating...";
    btn.disabled = true;

    try {
      const result = await downloadQuoteImage_(snap);
      showNotice(screenshotResultMessage_(result, "Quote screenshot"));
    } catch (err) {
      showNotice(err && err.message ? err.message : "Screenshot failed. Check console for details.");
      try { console.error(err); } catch (e) {}
    } finally {
      btn.textContent = oldText;
      btn.disabled = false;
    }
  }

  window.UCP_PCB_QuoteImage = window.UCP_PCB_QuoteImage || {};
  window.UCP_PCB_QuoteImage.download = downloadQuoteImage_;
  window.UCP_PCB_QuoteImage.buildQuoteCard = buildQuoteCard;
  window.UCP_PCB_QuoteImage.resultMessage = screenshotResultMessage_;
  window.UCP_PCB_QuoteImage.normalizeMode = normalizeQuoteScreenshotMode_;
  window.UCP_PCB_QuoteImage.resolveMode = resolveQuoteScreenshotMode_;

  document.addEventListener("click", (e) => {
    onClick(e).catch(() => {});
  });
})();
