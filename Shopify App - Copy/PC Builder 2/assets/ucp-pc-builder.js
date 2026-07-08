  /* File: assets/ucp-pc-builder.js */

  /*
    Variant UI hooks (safe to style later in CSS):
    - .ucp-pcb__variantStrip
    - .ucp-pcb__variantLine
    - .ucp-pcb__variantLabel
    - .ucp-pcb__variantPills
    - .ucp-pcb__varPill (and .is-active)
    - .ucp-pcb__variantSwatches
    - .ucp-pcb__varSwatch (and .is-active)
    - .ucp-pcb__card (mobile)
    - .ucp-pcb__cardTop, .ucp-pcb__cardSpecs, .ucp-pcb__cardBottom
  */

  (() => {
    const root = document.querySelector("[data-ucp-pcb]");
    if (!root) return;

    // Prefer the builder's share handler to avoid double-binding with build-link.js.
    try {
      window.__UCP_PCB_SHARE_HANDLER__ = "builder";
    } catch (e) {}

    // Legacy quote script guard: handle quote flow inside this file to avoid double-binding.
    try {
      window.__UCP_PCB_QUOTE_BOOT__ = true;
    } catch (e) {}

    // ---------- Helpers ----------
    function escapeHtml(str) {
      return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function safeSetHidden(el, hidden) {
      if (!el) return;
      el.hidden = !!hidden;
    }

    function safeSetText(el, text) {
      if (!el) return;
      el.textContent = String(text ?? "");
    }

    function safeInnerHtml(el, html) {
      if (!el) return;
      el.innerHTML = String(html ?? "");
    }

    function isElementFullyInViewport_(el) {
      if (!el) return true;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight || 0;
      if (rect.width <= 0 || rect.height <= 0) return true;
      return rect.top >= 0 && rect.bottom <= vh;
    }

    let builderNoticeTimer = null;
    function showBuilderNotice(msg) {
      const text = String(msg || "").trim();
      if (!text) return;

      let el = document.getElementById("ucp-pcb-builder-notice");
      if (!el) {
        el = document.createElement("div");
        el.id = "ucp-pcb-builder-notice";
        el.style.cssText =
          "position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;" +
          "background:#111;color:#fff;padding:10px 12px;border-radius:12px;" +
          "font:600 12px/1.35 system-ui,-apple-system,Segoe UI,Roboto,Arial;" +
          "box-shadow:0 10px 30px rgba(0,0,0,.25);";
        document.body.appendChild(el);
      }

      el.textContent = text;
      if (builderNoticeTimer) clearTimeout(builderNoticeTimer);
      builderNoticeTimer = setTimeout(() => {
        if (el && el.parentNode) el.remove();
      }, 3200);
    }

    function ucpCreateRestoreLoadingController_() {
      let activeToken = 0;
      let timeoutTimer = null;

      function normalizeSource_(source) {
        const s = String(source || "").trim().toLowerCase();
        if (s === "promo" || s === "quote" || s === "build" || s === "approval") return s;
        return "";
      }

      function isEnabledForSource_(source) {
        const key = normalizeSource_(source);
        const loadingCfg = cfg && cfg.loading_modals && typeof cfg.loading_modals === "object" ? cfg.loading_modals : null;
        if (!key || !loadingCfg) return true;
        if (!(key in loadingCfg)) return true;
        return ucpAsBool_(loadingCfg[key], true);
      }

      function clearTimer_() {
        if (!timeoutTimer) return;
        clearTimeout(timeoutTimer);
        timeoutTimer = null;
      }

      function ensureStyle_() {
        if (document.getElementById("ucp-pcb-restore-loading-style")) return;
        const style = document.createElement("style");
        style.id = "ucp-pcb-restore-loading-style";
        style.textContent =
          "@keyframes ucpPcbRestoreSpin{to{transform:rotate(360deg);}}" +
          ".ucp-pcb__restoreLoadingSpinner{width:26px;height:26px;border-radius:999px;border:3px solid #ddd;border-top-color:#111;animation:ucpPcbRestoreSpin .9s linear infinite;}" +
          ".ucp-pcb__restoreLoadingLogo{max-width:120px;max-height:40px;object-fit:contain;display:block;margin:0 auto 8px;}";
        document.head.appendChild(style);
      }

      function ensureOverlay_() {
        let overlay = document.getElementById("ucp-pcb-restore-loading");
        if (overlay) return overlay;

        ensureStyle_();

        overlay = document.createElement("div");
        overlay.id = "ucp-pcb-restore-loading";
        overlay.style.cssText =
          "position:fixed;inset:0;z-index:2493;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;";

        const box = document.createElement("div");
        box.id = "ucp-pcb-restore-loading-box";
        box.style.cssText =
          "background:#fff;border-radius:14px;padding:14px 16px;box-shadow:0 20px 60px rgba(0,0,0,.2);font:600 13px/1.3 system-ui,-apple-system,Segoe UI,Roboto,Arial;display:flex;flex-direction:column;gap:8px;align-items:center;min-width:180px;";

        const logoUrl = cfg && cfg.brand_logo ? String(cfg.brand_logo || "").trim() : "";
        if (logoUrl) {
          const logo = document.createElement("img");
          logo.className = "ucp-pcb__restoreLoadingLogo";
          logo.src = logoUrl;
          logo.alt = "Brand logo";
          box.appendChild(logo);
        }

        const spinner = document.createElement("div");
        spinner.className = "ucp-pcb__restoreLoadingSpinner";

        const text = document.createElement("div");
        text.id = "ucp-pcb-restore-loading-text";
        text.textContent = "Loading build...";

        box.appendChild(spinner);
        box.appendChild(text);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        return overlay;
      }

      function setText_(text) {
        const el = document.getElementById("ucp-pcb-restore-loading-text");
        if (el) el.textContent = String(text || "Loading build...");
      }

      function show(source) {
        activeToken += 1;
        clearTimer_();
        if (!isEnabledForSource_(source)) {
          document.getElementById("ucp-pcb-restore-loading")?.remove();
          return activeToken;
        }
        ensureOverlay_();
        setText_("Loading build...");
        return activeToken;
      }

      function hide(token) {
        if (token && token !== activeToken) return;
        clearTimer_();
        document.getElementById("ucp-pcb-restore-loading")?.remove();
      }

      function notify(message) {
        showBuilderNotice(message);
      }

      function track(promise, opts = {}) {
        if (!promise || typeof promise.then !== "function") return promise;

        const token = show(opts.source || "");
        const timeoutMs = Number(opts.timeoutMs);
        const safeTimeoutMs = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 15000;
        let timedOut = false;

        timeoutTimer = setTimeout(() => {
          if (token !== activeToken) return;
          timedOut = true;
          hide(token);
          if (opts.timeoutMessage) notify(opts.timeoutMessage);
        }, safeTimeoutMs);

        Promise.resolve(promise).then(
          (result) => {
            if (timedOut || token !== activeToken) return result;
            hide(token);
            const success = typeof opts.successTest === "function" ? !!opts.successTest(result) : true;
            if (!success && opts.failureMessage) notify(opts.failureMessage);
            return result;
          },
          (error) => {
            if (!timedOut && token === activeToken) {
              hide(token);
              if (opts.failureMessage) notify(opts.failureMessage);
            }
            return error;
          }
        );

        return promise;
      }

      return { show, hide, track, notify };
    }

    try {
      window.UCP_PCB_RESTORE_LOADING = window.UCP_PCB_RESTORE_LOADING || ucpCreateRestoreLoadingController_();
      window.UCP_PCB_SHOW_NOTICE = window.UCP_PCB_SHOW_NOTICE || showBuilderNotice;
    } catch (e) {}

    function ucpReadManualOffParam_() {
      try {
        const sp = new URLSearchParams(window.location.search);
        const raw = sp.get("off");
        if (raw === null || raw === undefined || raw === "") return 0;
        const n = Number(raw);
        if (!Number.isFinite(n)) return 0;
        return Math.max(0, n);
      } catch (e) {}
      return 0;
    }

    function ucpNormalizePromoHandle_(value) {
      return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    function ucpReadPromoParam_() {
      try {
        const sp = new URLSearchParams(window.location.search);
        return ucpNormalizePromoHandle_(sp.get("promo"));
      } catch (e) {}
      return "";
    }

    function ucpAsBool_(value, fallback = false) {
      if (value === true || value === false) return value;
      if (value === null || value === undefined || value === "") return !!fallback;
      const s = String(value).trim().toLowerCase();
      if (["true", "1", "yes", "y", "on"].includes(s)) return true;
      if (["false", "0", "no", "n", "off"].includes(s)) return false;
      return !!fallback;
    }

    function getEventTargetElement(e) {
      if (!e) return null;
      const t = e.target;
      if (t instanceof Element) return t;
      if (t && t.parentElement) return t.parentElement;
      return null;
    }

    // ---------- ID normalization (prevents GID vs numeric mismatch) ----------
    function normId(x) {
      if (x === null || x === undefined) return "";
      const s = String(x).trim();
      if (!s) return "";
      if (s.includes("gid://")) {
        const parts = s.split("/");
        return parts[parts.length - 1] || s;
      }
      return s;
    }

    // ---------- Config ----------
    const cfgEl = root.querySelector("#ucp-pcb-config");
    const cfg = cfgEl ? JSON.parse(cfgEl.textContent) : { endpoints: {} };

  const PERF_ENABLED = cfg.perf_preview_enabled !== false;
    const AVAILABILITY_FILTER_ENABLED = cfg.availability_filter_enabled !== false;

  // [PASTE START] Availability Tier toggle + Liquid override
  // [UCP][AVAIL_TIER] Toggle. Set to false to hide lead time labels everywhere in the builder.
  // [UCP][AVAIL_TIER] Liquid override (later). Add data-ucp-pcb-show-leadtime="0" on the root [data-ucp-pcb] element.
  let UCP_PCB_SHOW_LEADTIME_LABEL = true;

  // [UCP][AVAIL_TIER] Optional overrides (safe if absent).
  try {
    const attr = root.getAttribute("data-ucp-pcb-show-leadtime");
    if (attr !== null) {
      const s = String(attr).trim().toLowerCase();
      UCP_PCB_SHOW_LEADTIME_LABEL = !(s === "0" || s === "false" || s === "no");
    } else if (typeof cfg?.show_lead_time_label === "boolean") {
      UCP_PCB_SHOW_LEADTIME_LABEL = cfg.show_lead_time_label;
    } else if (typeof cfg?.lead_time_label_enabled === "boolean") {
      UCP_PCB_SHOW_LEADTIME_LABEL = cfg.lead_time_label_enabled;
    }
  } catch (e) {}
  // [PASTE END]



    cfg.endpoints = cfg.endpoints || {};

    cfg.storefront_api_version =
      (cfg.storefront_api_version ? String(cfg.storefront_api_version).trim() : "") || "2024-10";

    cfg.storefront_token = cfg.storefront_token ? String(cfg.storefront_token).trim() : "";

    // Perf config (MVP endpoint first, Storefront token later)
    cfg.perf_preview_endpoint = cfg.perf_preview_endpoint ? String(cfg.perf_preview_endpoint).trim() : "";
    cfg.perf_storefront_token = cfg.perf_storefront_token ? String(cfg.perf_storefront_token).trim() : "";
    cfg.perf_metaobject_type = cfg.perf_metaobject_type ? String(cfg.perf_metaobject_type).trim() : "benchmark_entry";

    // MVP fallback. Uses your view template: templates/page.ucp-pcb-perf-preview.liquid
    // If your PAGE handle is different, change /pages/ucp-pcb-perf-preview below.
    if (!cfg.perf_preview_endpoint) {
      cfg.perf_preview_endpoint = "/pages/ucp-pcb-perf-preview?view=ucp-pcb-perf-preview";
    }

    const MESSENGER_URL =
      (cfg && typeof cfg.messenger_url === "string" ? cfg.messenger_url.trim() : "") ||
      "https://www.facebook.com/UncappedPC";
    const MY_BUILDS_PROXY_BASE_PATH = (() => {
      const raw = String(cfg && cfg.my_builds_proxy_base_path ? cfg.my_builds_proxy_base_path : "").trim();
      if (!raw) return "/apps/upgrade-assist";
      return raw.startsWith("/") ? raw.replace(/\/+$/, "") : `/${raw}`.replace(/\/+$/, "");
    })();
    const MY_BUILDS_SAVE_ENDPOINT = `${MY_BUILDS_PROXY_BASE_PATH}/my-builds/save`;
    const MY_BUILDS_PAGE_URL =
      String(cfg && cfg.my_builds_page_url ? cfg.my_builds_page_url : "").trim() || "/pages/my-builds";
    const SHOPIFY_CUSTOMER = (() => {
      const customer = cfg && cfg.customer && typeof cfg.customer === "object" ? cfg.customer : null;
      if (!customer) return null;

      const id = String(customer.id || "").trim();
      if (!id) return null;

      const email = String(customer.email || "").trim();
      const firstName = String(customer.first_name || customer.firstName || "").replace(/\s+/g, " ").trim();
      const lastName = String(customer.last_name || customer.lastName || "").replace(/\s+/g, " ").trim();
      const name = `${firstName} ${lastName}`.replace(/\s+/g, " ").trim();

      return {
        id,
        email,
        firstName,
        lastName,
        name
      };
    })();

    const rulesEl = root.querySelector("#ucp-pcb-bundle-rules");
    let bundleRules = rulesEl ? JSON.parse(rulesEl.textContent || "[]") : [];
    const promoRulesEl = root.querySelector("#ucp-pcb-promo-rules");
    let promoRules = [];
    try {
      promoRules = promoRulesEl ? JSON.parse(promoRulesEl.textContent || "[]") : [];
    } catch (e) {
      promoRules = [];
    }
    const addonRulesEl = root.querySelector("#ucp-pcb-addon-rules");
    let addonDiscountRules = [];
    try {
      addonDiscountRules = addonRulesEl ? JSON.parse(addonRulesEl.textContent || "[]") : [];
    } catch (e) {
      addonDiscountRules = [];
    }

    const $tabs = Array.from(root.querySelectorAll(".ucp-pcb__tab"));
    const $head = root.querySelector("#ucp-pcb-head");
    const $body = root.querySelector("#ucp-pcb-body");

    // Controls (wraps)
    const $brandWrap = root.querySelector("#ucp-pcb-brand-wrap");
    const $socketWrap = root.querySelector("#ucp-pcb-socket-wrap");
    const $chipsetWrap = root.querySelector("#ucp-pcb-chipset-wrap");
    const $gpuBrandWrap = root.querySelector("#ucp-pcb-gpu-brand-wrap");
    const $boardPartnerWrap = root.querySelector("#ucp-pcb-boardpartner-wrap");
    const $formFactorWrap = root.querySelector("#ucp-pcb-formfactor-wrap");
    const $wattsWrap = root.querySelector("#ucp-pcb-watts-wrap");
    const $coolerTypeWrap = root.querySelector("#ucp-pcb-coolertype-wrap");
    const $caseFfWrap = root.querySelector("#ucp-pcb-caseff-wrap");
    const $priceWrap = root.querySelector("#ucp-pcb-price-wrap");

    // Controls (inputs)
    const $brand = root.querySelector("#ucp-pcb-brand");
    const $socket = root.querySelector("#ucp-pcb-socket");
    const $chipset = root.querySelector("#ucp-pcb-chipset");
    const $chipsetLabel = root.querySelector("#ucp-pcb-chipset-label");
    const $gpuBrand = root.querySelector("#ucp-pcb-gpu-brand");
    const $boardPartner = root.querySelector("#ucp-pcb-boardpartner");
    const $formFactor = root.querySelector("#ucp-pcb-formfactor");
    const $watts = root.querySelector("#ucp-pcb-watts");
    const $coolerType = root.querySelector("#ucp-pcb-coolertype");
    const $caseFf = root.querySelector("#ucp-pcb-caseff");
    const $price = root.querySelector("#ucp-pcb-price");
    const $priceOut = root.querySelector("#ucp-pcb-price-out");
    const $availableOnlyWrap = root.querySelector("#ucp-pcb-availableonly-wrap");
    const $availableOnly = root.querySelector("#ucp-pcb-available-only");

    const $picked = root.querySelector("#ucp-pcb-picked");
    const $subtotalRaw = root.querySelector("#ucp-pcb-subtotal-raw");
    const $subtotal = root.querySelector("#ucp-pcb-subtotal");
    const $manualOffRow = root.querySelector("[data-ucp-pcb-manual-off-row]");
    const $manualOff = root.querySelector("#ucp-pcb-manual-off");
    const $promoRow = root.querySelector("[data-ucp-pcb-promo-row]");
    const $promoLabel = root.querySelector("#ucp-pcb-promo-label");
    const $promoSavings = root.querySelector("#ucp-pcb-promo-savings");
    const $addonRowsWrap = root.querySelector("[data-ucp-pcb-addon-rows]");
    const $savings = root.querySelector("#ucp-pcb-savings");
    const $removeAll = root.querySelector("#ucp-pcb-remove-all");
    const $share = root.querySelector("#ucp-pcb-share");
    const $saveBuild = root.querySelector("#ucp-pcb-save-build");
    const $quoteImage = root.querySelector("#ucp-pcb-quote-image");
    const $desktopDock = root.querySelector("#ucp-pcb-desktop-dock");
    const $desktopDockSource = root.querySelector("[data-ucp-pcb-dock-source]");
    const $desktopDockSubtotal = root.querySelector("#ucp-pcb-desktop-dock-subtotal");
    const $desktopDockShare = root.querySelector("#ucp-pcb-desktop-dock-share");
    const $desktopDockSaveBuild = root.querySelector("#ucp-pcb-desktop-dock-save-build");
    const $desktopDockQuoteImage = root.querySelector("#ucp-pcb-desktop-dock-quote-image");
    const $desktopDockRequestQuote = root.querySelector("#ucp-pcb-desktop-dock-request-quote");
    const $desktopDockAddToCart = root.querySelector("#ucp-pcb-desktop-dock-add-to-cart");

    // Request Quote button (supports multiple possible IDs)
    const $requestQuote =
      root.querySelector("#ucp-pcb-request-quote") ||
      root.querySelector("#ucp-pcb-requestquote") ||
      root.querySelector("#ucp-pcb-quote") ||
      root.querySelector("[data-ucp-pcb-request-quote]");

    const $pdf = root.querySelector("#ucp-pcb-pdf");

    // Quote modal elements
    const $quoteModal = root.querySelector("#ucp-pcb-quote-modal");
    const $quoteBackdrop =
      root.querySelector("#ucp-pcb-quote-backdrop") || root.querySelector("#ucp-pcb-quote-overlay");
    const $quoteClose = root.querySelector("#ucp-pcb-quote-close");
    const $quoteCodeField =
      root.querySelector("#ucp-pcb-quote-code") || root.querySelector("[data-ucp-pcb-quote-code]");
    const $quoteCopyBtn =
      root.querySelector("#ucp-pcb-quote-copy") || root.querySelector("#ucp-pcb-quote-copy-code");
    const $quoteLinkField = root.querySelector("#ucp-pcb-quote-link");
    const $quoteCopyLinkBtn = root.querySelector("#ucp-pcb-quote-copy-link");
    const $quoteApprovalLinkField = root.querySelector("#ucp-pcb-quote-approval-link");
    const $quoteVersion = root.querySelector("#ucp-pcb-quote-version");
    const $quoteMessengerBtn =
      root.querySelector("#ucp-pcb-quote-messenger") || root.querySelector("#ucp-pcb-quote-chat");


    // Add-to-cart buttons
    const $addToCart = root.querySelector("#ucp-pcb-add-to-cart");

    // Mobile sticky bar and drawer
    const $overlay = root.querySelector("#ucp-pcb-overlay");
    const $mobileOpen = root.querySelector("#ucp-pcb-mobilebar-open");
    const $mobileCount = root.querySelector("#ucp-pcb-mobilebar-count");
    const $mobileSubtotal = root.querySelector("#ucp-pcb-mobilebar-subtotal");
    const $mobileSavings = root.querySelector("#ucp-pcb-mobilebar-savings");
    const $mobileRemove = root.querySelector("#ucp-pcb-mobilebar-remove");
    const $mobileShare = root.querySelector("#ucp-pcb-mobilebar-share");
    const $mobileScreenshot = root.querySelector("#ucp-pcb-mobilebar-screenshot");
    const $mobileSaveBuild = root.querySelector("#ucp-pcb-mobilebar-save");

    const $mobileRequestQuote =
      root.querySelector("#ucp-pcb-mobilebar-request-quote") ||
      root.querySelector("#ucp-pcb-mobilebar-requestquote") ||
      root.querySelector("#ucp-pcb-mobilebar-quote") ||
      root.querySelector("[data-ucp-pcb-mobile-request-quote]");

    const $mobilePdf = root.querySelector("#ucp-pcb-mobilebar-pdf");

    const $mobileCart = root.querySelector("#ucp-pcb-mobilebar-cart");
    const $drawerClose = root.querySelector("#ucp-pcb-summary-close");

    // Hard fail if core containers are missing
    if (!$body) {
      console.warn("[UCP PCB] Missing #ucp-pcb-body. Script aborted.");
      return;
    }
    if (!$head) {
      console.warn("[UCP PCB] Missing #ucp-pcb-head. Script will run without header rendering.");
    }
    if (!$picked) {
      console.warn("[UCP PCB] Missing #ucp-pcb-picked. Script will run but summary will not render.");
    }

    const state = {
      tab: root.dataset.defaultTab || "processor",
      cache: new Map(),
      picked: {},
      priceMaxByTab: {},
      sortModeByTab: {},
      pendingPickByTab: null,
      availableOnly: AVAILABILITY_FILTER_ENABLED && !!cfg.availability_filter_default_on
    };

    const MANUAL_OFF_RAW = ucpReadManualOffParam_();
    try {
      window.__UCP_PCB_MANUAL_OFF__ = MANUAL_OFF_RAW;
    } catch (e) {}

    const ACTIVE_PROMO_HANDLE = ucpReadPromoParam_();
    try {
      window.__UCP_PCB_PROMO_HANDLE__ = ACTIVE_PROMO_HANDLE;
    } catch (e) {}

    const PROMO_DISCOVERY_MODAL_ENABLED = cfg.promo_discovery_modal_enabled !== false;
    const PROMO_DISCOVERY_VISIBILITY_MODE = (() => {
      const mode = String(cfg.promo_discovery_visibility_mode || "cooldown").trim().toLowerCase();
      if (mode === "session" || mode === "cooldown" || mode === "always") return mode;
      return "cooldown";
    })();
    const PROMO_DISCOVERY_COOLDOWN_DAYS = (() => {
      const n = Number(cfg.promo_discovery_cooldown_days);
      return Number.isFinite(n) && n > 0 ? Math.max(1, Math.round(n)) : 7;
    })();

    // ---------- Multi-pick tabs (RAM, Case Fans, Other) ----------
    const MULTI_TABS = new Set(["memory", "casefans", "other"]);

    function isMultiTab(tab) {
      return MULTI_TABS.has(String(tab || "").trim());
    }

    function ucpCountRestorePayloadLines_(payload) {
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) return 0;

      let count = 0;
      Object.values(payload).forEach((value) => {
        if (!value) return;
        if (Array.isArray(value)) {
          count += value.filter(Boolean).length;
          return;
        }
        if (typeof value === "object") count += 1;
      });

      return count;
    }

    function ucpReadPositiveInt_(candidates, fallback = null) {
      for (const candidate of candidates) {
        const raw = typeof candidate === "object" && candidate && "value" in candidate ? candidate.value : candidate;
        const n = Number(raw);
        if (Number.isFinite(n) && n > 0) return Math.round(n);
      }
      return fallback;
    }

    function ucpProductAvailableNow_(p, activeVariant) {
      return ucpEffectiveAvailTierInt_(p, activeVariant) === 1;
    }

    function ucpApplyAvailableOnlyFilter_(products) {
      if (!state.availableOnly) return products.slice();
      return products.filter((p) => ucpProductAvailableNow_(p, getActiveVariant(state.tab, p)));
    }

    function ucpRamModuleCountForItem_(item) {
      return ucpReadPositiveInt_(
        [
          item?.specs?.ram_module_count,
          item?.ram_module_count,
          item?.ramModuleCount,
          item?.metafields?.ram?.module_count,
          item?.metafields?.ram?.module_count?.value
        ],
        1
      );
    }

    function ucpMotherboardRamSlots_(moboOverride = state.picked?.motherboard) {
      const mobo = moboOverride || null;
      if (!mobo) return null;
      return ucpReadPositiveInt_(
        [
          mobo?.specs?.ram_slots,
          mobo?.ram_slots,
          mobo?.ramSlots,
          mobo?.metafields?.custom?.ram_slots,
          mobo?.metafields?.custom?.ram_slots?.value
        ],
        null
      );
    }

    function ucpTotalRamModules_(selectionOverride = state.picked?.memory) {
      const list = Array.isArray(selectionOverride)
        ? selectionOverride
        : selectionOverride
          ? [selectionOverride]
          : [];

      return list.reduce((sum, item) => {
        const qty = Math.max(0, Number(item?.qty || 1) || 0);
        return sum + ucpRamModuleCountForItem_(item) * qty;
      }, 0);
    }

    function ucpCanAddMemoryItem_(item, qty = 1) {
      const mobo = state.picked?.motherboard || null;
      if (mobo && !isRamCompatibleWithMobo(item, mobo)) {
        return { ok: false, reason: "compat" };
      }

      const slots = ucpMotherboardRamSlots_(mobo);
      if (!(slots > 0)) return { ok: true, slots: null };

      const addQty = Math.max(1, Number(qty || 1) || 1);
      const nextModules = ucpTotalRamModules_() + ucpRamModuleCountForItem_(item) * addQty;
      if (nextModules > slots) {
        return { ok: false, reason: "slot_cap", slots, nextModules };
      }

      return { ok: true, slots, nextModules };
    }

    function ucpMemorySelectionFitsSlots_(selection, moboOverride = state.picked?.motherboard) {
      const slots = ucpMotherboardRamSlots_(moboOverride);
      if (!(slots > 0)) return true;
      return ucpTotalRamModules_(selection) <= slots;
    }

    function pickedList(tab) {
      const v = state.picked?.[tab];
      if (!v) return [];
      return Array.isArray(v) ? v : [v];
    }

    function clearPicked(tab) {
      if (!state.picked) state.picked = {};
      const had = !!state.picked[tab];
      delete state.picked[tab];
      if (had) ucpHandleBuildChanged_();
    }

    function samePickedItem_(a, b) {
      if (!a || !b) return false;
      return (
        normId(a.productId) === normId(b.productId) &&
        normId(a.variantId) === normId(b.variantId) &&
        Number(a.qty || 1) === Number(b.qty || 1)
      );
    }

    function addOrIncPicked(tab, item, qty = 1) {
      if (!state.picked) state.picked = {};

      if (!isMultiTab(tab)) {
        const prev = state.picked[tab];
        state.picked[tab] = item;
        if (!samePickedItem_(prev, item)) ucpHandleBuildChanged_();
        return true;
      }

      const qRaw = Number(qty || 1);
      const q = Number.isFinite(qRaw) && qRaw > 0 ? qRaw : 1;

      if (tab === "memory") {
        const canAdd = ucpCanAddMemoryItem_(item, q);
        if (!canAdd.ok) {
          if (canAdd.reason === "compat") {
            showBuilderNotice("This RAM is not compatible with the selected motherboard memory type.");
          } else if (canAdd.reason === "slot_cap") {
            showBuilderNotice(`This motherboard only supports ${canAdd.slots} RAM slots.`);
          }
          return false;
        }
      }

      const list = Array.isArray(state.picked[tab]) ? state.picked[tab].slice() : [];
      const pid = normId(item?.productId);
      const vid = normId(item?.variantId);

      const hit = list.find((x) => normId(x?.productId) === pid && normId(x?.variantId) === vid);

      if (hit) {
        const prevQty = Number(hit.qty || 1);
        hit.qty = prevQty + q;
        if (hit.qty !== prevQty) ucpHandleBuildChanged_();
      } else {
        list.push({ ...item, qty: q });
        ucpHandleBuildChanged_();
      }

      state.picked[tab] = list;
      return true;
    }

    function removePickedAt(tab, idx) {
      if (!isMultiTab(tab)) {
        delete state.picked[tab];
        return;
      }

      const list = pickedList(tab).slice();
      const i = Number(idx);

      if (!Number.isFinite(i) || i < 0 || i >= list.length) return;

      list.splice(i, 1);

      if (list.length) state.picked[tab] = list;
      else delete state.picked[tab];

      ucpHandleBuildChanged_();
    }

    function pickedSubtotalBase() {
      let subtotalBase = 0;

      for (const v of Object.values(state.picked || {})) {
        if (!v) continue;

        if (Array.isArray(v)) {
          v.forEach((it) => {
            subtotalBase += Number(it?.price || 0) * Number(it?.qty || 1);
          });
        } else {
          subtotalBase += Number(v?.price || 0);
        }
      }

      return subtotalBase;
    }

    function pickedLineCount() {
      let count = 0;

      for (const v of Object.values(state.picked || {})) {
        if (!v) continue;
        count += Array.isArray(v) ? v.length : 1;
      }

      return count;
    }

    function ucpTotalQtyForTab_(tab) {
      const v = state.picked?.[tab];
      if (!v) return 0;
      if (!Array.isArray(v)) return 1;
      return v.reduce((sum, it) => sum + Math.max(0, Number(it?.qty || 1)), 0);
    }

    // ---------- Build logging (Google Apps Script) ----------
    const UCP_BUILD_LOG_ENDPOINT =
      "https://script.google.com/macros/s/AKfycbysHP_LKSCNjTczUQZr0OT5pMY37htXnWk_MowJ9mRTqTeCA9Gy49JprHDbkWOCYM-2/exec";
    const UCP_BUILD_LOG_SECRET = "pc builder data saver";

    function ucpGetSessionId() {
      try {
        const k = "ucp_pcb_session_id";
        let v = localStorage.getItem(k);
        if (!v) {
          v = crypto?.randomUUID?.() || String(Date.now()) + "_" + Math.random().toString(16).slice(2);
          localStorage.setItem(k, v);
        }
        return v;
      } catch (e) {
        return String(Date.now()) + "_" + Math.random().toString(16).slice(2);
      }
    }

    function ucpGetCustomerSnapshot_() {
      return SHOPIFY_CUSTOMER
        ? {
            id: SHOPIFY_CUSTOMER.id,
            email: SHOPIFY_CUSTOMER.email,
            firstName: SHOPIFY_CUSTOMER.firstName,
            lastName: SHOPIFY_CUSTOMER.lastName,
            name: SHOPIFY_CUSTOMER.name
          }
        : null;
    }

    function ucpGetCustomerNameSnapshot_() {
      const customer = ucpGetCustomerSnapshot_();
      return customer ? String(customer.name || "").trim() : "";
    }

    function ucpSummarizeSaveBuildError_(value) {
      const text = String(value || "").replace(/\s+/g, " ").trim();
      if (!text) return "Save build failed.";
      if (text === "not_logged_in") return "Sign in to save builds.";
      if (text === "invalid_build_payload") return "This build could not be saved yet.";
      if (/^save_build_request_failed_/i.test(text)) return "Save build failed. Please try again.";
      if (text.length <= 140) return text;
      return `${text.slice(0, 137)}...`;
    }

    function ucpPartShape(part) {
      if (!part) return null;
      const p = Array.isArray(part) ? part[0] : part;
      if (!p) return null;

      return {
        title: p.title || "",
        handle: p.handle || "",
        productId: p.productId || "",
        variantId: p.variantId || "",
        vendor: p.vendor || "",
        price: p.price ?? null
      };
    }

    function ucpSummaryTextFromPicked() {
      const order = [
        ["processor", "CPU"],
        ["motherboard", "Motherboard"],
        ["memory", "Memory"],
        ["gpu", "GPU"],
        ["cpucooler", "CPU Cooler"],
        ["ssd", "SSD"],
        ["powersupply", "Power Supply"],
        ["case", "Case"],
        ["casefans", "Case Fans"],
        ["other", "Other"]
      ];

      const lines = [];

      for (const [k, label] of order) {
        const v = state.picked?.[k];
        if (!v) continue;

        if (Array.isArray(v)) {
          if (!v.length) continue;
          const joined = v
            .filter(Boolean)
            .map((it) => {
              const q = Number(it?.qty || 1);
              return `${it?.title || ""}${q > 1 ? ` x${q}` : ""}`;
            })
            .filter(Boolean)
            .join(", ");

          if (joined) lines.push(`${label}: ${joined}`);
          continue;
        }

        lines.push(`${label}: ${v.title || ""}`);
      }

      return lines.join("\n");
    }

    function ucpComputedTotal() {
      return ucpComputeTotals_().payableSubtotal;
    }

    function ucpComputeTotals_() {
      const rawSubtotal = pickedSubtotalBase();
      const rawBundleDiscount = currentBundleDiscount();
      const promo = ucpCurrentPromoState_();
      const rawAddon = ucpCurrentAddonDiscountState_(rawBundleDiscount, promo);
      const bundleDiscountSuppressedByPromo = promo.valid && !promo.stackWithBundleDiscount;
      const bundleDiscountSuppressedByAddon = !!rawAddon.suppressBundleDiscount;
      const bundleDiscount = bundleDiscountSuppressedByPromo || bundleDiscountSuppressedByAddon ? 0 : rawBundleDiscount;
      const maxPromoDiscount = Math.max(0, rawSubtotal - bundleDiscount);
      const promoDiscountRaw = rawAddon.suppressPrimaryPromo ? 0 : Math.max(0, promo.discountAmount || 0);
      const promoDiscount = Math.min(promoDiscountRaw, maxPromoDiscount);
      const maxAddonDiscount = Math.max(0, rawSubtotal - bundleDiscount - promoDiscount);
      const addonApplied = ucpClampAddonDiscountRows_(rawAddon.rows, maxAddonDiscount);
      const addonDiscountTotal = addonApplied.total;
      const maxOff = Math.max(0, rawSubtotal - bundleDiscount - promoDiscount - addonDiscountTotal);
      const manualOff = Math.min(Math.max(0, MANUAL_OFF_RAW || 0), maxOff);
      const payableSubtotal = Math.max(0, rawSubtotal - bundleDiscount - promoDiscount - addonDiscountTotal - manualOff);

      return {
        rawSubtotal,
        rawBundleDiscount,
        bundleDiscount,
        promoDiscount,
        promoHandle: promo.handle,
        promoLabel: promo.label,
        promoBadgeLabel: promo.badgeLabel,
        promoActive: promo.active,
        promoValid: promo.valid,
        promoStackWithBundleDiscount: promo.stackWithBundleDiscount,
        promoSuppressedByAddon: !!rawAddon.suppressPrimaryPromo,
        promoMissingCount: promo.missingCount,
        addonDiscountTotal,
        addonDiscountRows: addonApplied.rows,
        addonDiscountCount: addonApplied.rows.length,
        addonRuleHandles: rawAddon.ruleHandles,
        addonRuleLabels: rawAddon.ruleLabels,
        addonSuppressesBundleDiscount: !!rawAddon.suppressBundleDiscount,
        addonSuppressesPrimaryPromo: !!rawAddon.suppressPrimaryPromo,
        manualOff,
        discountTotal: bundleDiscount + promoDiscount + addonDiscountTotal,
        payableSubtotal
      };
    }

    function ucpRenderAddonDiscountRows_(rows) {
      if (!$addonRowsWrap) return;
      const safeRows = Array.isArray(rows) ? rows : [];
      if (!safeRows.length) {
        safeInnerHtml($addonRowsWrap, "");
        safeSetHidden($addonRowsWrap, true);
        return;
      }

      safeInnerHtml(
        $addonRowsWrap,
        safeRows
          .map((row) => {
            const label = String(row?.label || "Add-on discount").trim() || "Add-on discount";
            const amount = Number(row?.discountAmount || 0);
            return `
              <div class="ucp-pcb__totalsRow" data-ucp-pcb-addon-row>
                <span>${escapeHtml(label)}</span>
                <strong>${escapeHtml(moneyPHP(amount))}</strong>
              </div>
            `.trim();
          })
          .join("")
      );
      safeSetHidden($addonRowsWrap, false);
    }

    function getDeviceInfo_() {
      const ua = navigator.userAgent || "";
      const uach = navigator.userAgentData || null;

      const mobileHint = !!uach?.mobile;
      const platformHint = (uach?.platform || navigator.platform || "").toString();

      let deviceType = "desktop";

      const isiPadLike = /iPad/i.test(ua) || (ua.includes("Macintosh") && "ontouchend" in document);

      if (isiPadLike) deviceType = "tablet";
      else if (/Tablet|Nexus 7|Nexus 10|SM-T|Tab/i.test(ua)) deviceType = "tablet";
      else if (/Mobi|Android|iPhone|iPod/i.test(ua) || mobileHint) deviceType = "mobile";

      let os = "Unknown";
      if (/Android/i.test(ua)) os = "Android";
      else if (/iPhone|iPad|iPod/i.test(ua) || isiPadLike) os = "iOS";
      else if (/Windows NT/i.test(ua)) os = "Windows";
      else if (/CrOS/i.test(ua)) os = "ChromeOS";
      else if (/Macintosh|Mac OS X/i.test(ua)) os = "macOS";
      else if (/Linux/i.test(ua)) os = "Linux";

      let browser = "Unknown";
      if (/Edg\//i.test(ua)) browser = "Edge";
      else if (/OPR\//i.test(ua)) browser = "Opera";
      else if (/Firefox\//i.test(ua)) browser = "Firefox";
      else if (/CriOS\//i.test(ua)) browser = "Chrome (iOS)";
      else if (/Chrome\//i.test(ua)) browser = "Chrome";
      else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua) && !/CriOS\//i.test(ua)) browser = "Safari";

      return {
        deviceType,
        os,
        browser,
        uaPlatform: platformHint,
        uaMobileHint: mobileHint
      };
    }

    function ucpTryBuildLink_() {
      try {
        const snap = window.UCP_PCB_API?.getSnapshot?.();
        const gen = window.UCP_PCB_BuildLink?.generateBuildLink;
        if (snap && typeof gen === "function") {
          return String(gen(snap) || "").trim();
        }
      } catch (e) {}
      return "";
    }

    function ucpComputeBaseBuildLink_(snap) {
      try {
        const gen = window.UCP_PCB_BuildLink?.generateBuildLink;
        if (typeof gen === "function") {
          const link = gen(snap || window.UCP_PCB_API?.getSnapshot?.(), { path: window.location.pathname });
          if (link) return String(link).trim();
        }
      } catch (e) {}
      return ucpTryBuildLink_() || ucpTryBuildLinkFallback_() || window.location.href;
    }

    function ucpTryQuoteCode_() {
      try {
        if (ACTIVE_QUOTE_CODE) return String(ACTIVE_QUOTE_CODE).trim();
      } catch (e) {}
      try {
        const w = window.UCP_PCB_LAST_QUOTE_CODE;
        if (w) return String(w).trim();
      } catch (e) {}

      const el =
        root.querySelector("#ucp-pcb-quote-code") ||
        root.querySelector("[data-ucp-pcb-quote-code]") ||
        document.querySelector("#ucp-pcb-quote-code") ||
        document.querySelector("[data-ucp-pcb-quote-code]");

      if (el) {
        const v = (el.value !== undefined ? el.value : el.textContent) || "";
        return String(v).trim();
      }

      return "";
    }

    function ucpTryQuoteVersion_() {
      try {
        const activeVersion = Number(ACTIVE_QUOTE_VERSION);
        if (activeVersion > 0) return activeVersion;
      } catch (e) {}

      try {
        const ctx = window.__UCP_PCB_QUOTE_CTX__;
        const ctxVersion = Number(ctx && ctx.quoteVersion);
        if (ctxVersion > 0) return ctxVersion;
      } catch (e) {}

      const el =
        root.querySelector("#ucp-pcb-quote-version") ||
        root.querySelector("[data-ucp-pcb-quote-version]") ||
        document.querySelector("#ucp-pcb-quote-version") ||
        document.querySelector("[data-ucp-pcb-quote-version]");

      const raw = el ? (el.value !== undefined ? el.value : el.textContent) || "" : "";
      const match = String(raw).match(/(\d+)/);
      return match ? Number(match[1]) || 0 : 0;
    }

    function ucpGetMessengerUrl_() {
      return (MESSENGER_URL || "").trim() || "https://m.me/uncappedpc";
    }

    function ucpRandInt_(max) {
      const n = Number(max);
      if (!Number.isFinite(n) || n <= 0) return 0;

      try {
        if (typeof crypto !== "undefined" && crypto.getRandomValues) {
          const arr = new Uint32Array(1);
          crypto.getRandomValues(arr);
          return Number(arr[0] % n);
        }
      } catch (e) {}

      return Math.floor(Math.random() * n);
    }

    function ucpGenerateQuoteCode(len = 5) {
      const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
      const count = Math.min(6, Math.max(5, Number(len) || 5));
      let out = "Q-";
      for (let i = 0; i < count; i += 1) out += alphabet[ucpRandInt_(alphabet.length)];
      return out;
    }

    const QUOTE_FP_ORDER = [
      "processor",
      "motherboard",
      "memory",
      "gpu",
      "cpucooler",
      "ssd",
      "powersupply",
      "case",
      "casefans",
      "other"
    ];

    function ucpQuoteFingerprint_() {
      if (!pickedLineCount()) return "";
      try {
        const payload = buildSharePayload() || {};
        const normalized = {};

        QUOTE_FP_ORDER.forEach((k) => {
          if (payload[k]) normalized[k] = payload[k];
        });

        Object.keys(payload)
          .filter((k) => !QUOTE_FP_ORDER.includes(k))
          .sort()
          .forEach((k) => {
            normalized[k] = payload[k];
          });

        return base64UrlEncode(JSON.stringify(normalized));
      } catch (e) {
        return "";
      }
    }

    function ucpBuildSelectedVariantMap_() {
      try {
        const snap = window.UCP_PCB_API?.getSnapshot?.();
        const sel = snap && typeof snap.selected === "object" ? snap.selected : null;
        if (sel) {
          return {
            cpu: sel.cpu ?? null,
            mb: sel.mb ?? sel.motherboard ?? null,
            ram: sel.ram ?? sel.memory ?? null,
            gpu: sel.gpu ?? null,
            ssd: sel.ssd ?? null,
            cooler: sel.cooler ?? sel.cpucooler ?? null,
            psu: sel.psu ?? sel.powersupply ?? null,
            case: sel.case ?? null
          };
        }
      } catch (e) {}

      const getOne = (tab) => {
        const v = state.picked?.[tab];
        if (!v || Array.isArray(v)) return null;
        return normId(v.variantId);
      };

      return {
        cpu: getOne("processor"),
        mb: getOne("motherboard"),
        ram: getOne("memory"),
        gpu: getOne("gpu"),
        ssd: getOne("ssd"),
        cooler: getOne("cpucooler"),
        psu: getOne("powersupply"),
        case: getOne("case")
      };
    }

    function ucpBuildPayload(eventName, extra = {}) {
      const dev = getDeviceInfo_();
      const totals = ucpComputeTotals_();
      const customer = ucpGetCustomerSnapshot_();

      const quoteState = ucpGetActiveQuoteState_() || {};

      const buildLink = String(extra.buildLink || ucpTryBuildLink_() || ucpTryBuildLinkFallback_() || "").trim();
      const quoteCode = String(extra.quoteCode || ucpTryQuoteCode_() || quoteState.quoteCode || "").trim();
      const quoteVersion = extra.quoteVersion ?? quoteState.quoteVersion ?? "";
      const quoteLink = String(
        extra.quoteLink ||
          ucpBuildQuoteLookupLink_(quoteCode, quoteVersion, {
            promoHandle: extra.promoHandle ?? totals.promoHandle,
            manualOff: extra.manualOff ?? totals.manualOff
          }) ||
          ""
      ).trim();
      const approvalLinkRaw = String(extra.approvalLink || "").trim();
      const approvalLink =
        approvalLinkRaw ||
        ucpBuildQuoteApprovalLink_(quoteCode, quoteVersion) ||
        (buildLink ? ucpAppendApprovalToUrl_(buildLink) : "");
      let sharePayload = null;
      try {
        sharePayload = buildSharePayload();
      } catch (e) {}
      const selected = ucpBuildSelectedVariantMap_();

      return {
        event: eventName,
        sessionId: ucpGetSessionId(),
        buildId: quoteCode || ucpGetSessionId(),
        currency: "PHP",
        locale: document.documentElement.lang || navigator.language || "en",
        total: totals.payableSubtotal,
        subtotalBase: totals.rawSubtotal,
        rawBundleDiscount: totals.rawBundleDiscount,
        bundleDiscount: totals.bundleDiscount,
        promoHandle: String(extra.promoHandle ?? totals.promoHandle ?? "").trim(),
        promoLabel: totals.promoLabel,
        promoDiscount: totals.promoDiscount,
        promoActive: totals.promoActive,
        promoValid: totals.promoValid,
        promoStackWithBundleDiscount: totals.promoStackWithBundleDiscount,
        promoSuppressedByAddon: totals.promoSuppressedByAddon,
        promoMissingCount: totals.promoMissingCount,
        addonRuleHandles: Array.isArray(totals.addonRuleHandles) ? totals.addonRuleHandles.join(" | ") : "",
        addonRuleLabels: Array.isArray(totals.addonRuleLabels) ? totals.addonRuleLabels.join(" | ") : "",
        addonDiscountLabels: Array.isArray(totals.addonDiscountRows)
          ? totals.addonDiscountRows
              .map((row) => String(row?.label || "").trim())
              .filter(Boolean)
              .join(" | ")
          : "",
        addonDiscountCount: totals.addonDiscountCount,
        addonDiscountTotal: totals.addonDiscountTotal,
        addonSuppressesBundleDiscount: totals.addonSuppressesBundleDiscount,
        addonSuppressesPrimaryPromo: totals.addonSuppressesPrimaryPromo,
        manualOff: totals.manualOff,
        payableSubtotal: totals.payableSubtotal,

        deviceType: dev.deviceType,
        os: dev.os,
        browser: dev.browser,
        uaPlatform: dev.uaPlatform,
        uaMobileHint: dev.uaMobileHint,

        cpu: ucpPartShape(state.picked?.processor),
        motherboard: ucpPartShape(state.picked?.motherboard),
        ram: ucpPartShape(state.picked?.memory),
        gpu: ucpPartShape(state.picked?.gpu),
        cooler: ucpPartShape(state.picked?.cpucooler),
        ssd: ucpPartShape(state.picked?.ssd),
        psu: ucpPartShape(state.picked?.powersupply),
        case: ucpPartShape(state.picked?.case),
        casefans: ucpPartShape(state.picked?.casefans),

        summaryText: ucpSummaryTextFromPicked(),

        // Prefer the explicitly supplied page URL for analytics. Otherwise use the
        // shareable build link in Sheets, then the current page URL.
        pageUrl: String(extra.pageUrl || buildLink || location.href || "").trim(),
        userAgent: String(extra.userAgent || navigator.userAgent || "").trim(),
        openId: String(extra.openId || "").trim(),
        sourceTag: String(extra.sourceTag || "").trim(),
        campaign: String(extra.campaign || "").trim(),
        content: String(extra.content || "").trim(),
        referrerHost: String(extra.referrerHost || "").trim(),
        referrerUrl: String(extra.referrerUrl || "").trim(),
        entryType: String(extra.entryType || "").trim(),
        pageType: String(extra.pageType || "").trim(),
        ctaName: String(extra.ctaName || "").trim(),
        targetUrl: String(extra.targetUrl || "").trim(),
        customerId: customer ? String(customer.id || "").trim() : "",
        customerEmail: customer ? String(customer.email || "").trim() : "",
        customerName: customer ? String(customer.name || "").trim() : "",

        // New fields for Sheets
        buildLink,
        quoteLink,
        quoteCode,
        quoteVersion,
        approvalLink,
        savedBuildId: String(extra.savedBuildId || "").trim(),
        savedBuildHandle: String(extra.savedBuildHandle || "").trim(),
        savedBuildName: String(extra.savedBuildName || extra.buildName || "").replace(/\s+/g, " ").trim(),
        saveBuildStatus: String(extra.saveBuildStatus || "").trim(),

        selected,
        build: sharePayload || {},
        memory_items: Array.isArray(sharePayload?.memory) ? sharePayload.memory : [],
        ram_items: Array.isArray(sharePayload?.memory) ? sharePayload.memory : [],
        casefans_items: Array.isArray(sharePayload?.casefans) ? sharePayload.casefans : [],
        other_items: Array.isArray(sharePayload?.other) ? sharePayload.other : [],
        memory_qty_total: ucpTotalQtyForTab_("memory"),
        ram_qty_total: ucpTotalQtyForTab_("memory"),
        casefans_qty_total: ucpTotalQtyForTab_("casefans"),
        other_qty_total: ucpTotalQtyForTab_("other")
      };
    }


    function ucpLogBuildEvent(eventName, extra = {}) {
      const body = {
        secret: UCP_BUILD_LOG_SECRET,
        payload: ucpBuildPayload(eventName, extra)
      };

      try {
        const ok = navigator.sendBeacon(
          UCP_BUILD_LOG_ENDPOINT,
          new Blob([JSON.stringify(body)], { type: "text/plain;charset=UTF-8" })
        );
        if (ok) return;
      } catch (e) {}

      try {
        const data = encodeURIComponent(JSON.stringify(body));
        fetch(UCP_BUILD_LOG_ENDPOINT, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
          body: "data=" + data
        }).catch(() => {});
      } catch (e) {}
    }

    // Expose logger for other modules (approval, etc.)
    try {
      window.UCP_PCB_LOG_EVENT = function (eventName, extra) {
        ucpLogBuildEvent(eventName, extra || {});
      };
    } catch (e) {}

    function ucpNormalizeSourceTag_(value) {
      return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "_")
        .replace(/^_+|_+$/g, "");
    }

    function ucpReadEntrySourceTag_() {
      try {
        const sp = new URLSearchParams(window.location.search || "");
        return ucpNormalizeSourceTag_(sp.get("src") || sp.get("source") || sp.get("ref"));
      } catch (e) {}
      return "";
    }

    function ucpReadSourceCampaign_() {
      try {
        const sp = new URLSearchParams(window.location.search || "");
        return ucpNormalizeSourceTag_(sp.get("campaign") || sp.get("utm_campaign"));
      } catch (e) {}
      return "";
    }

    function ucpReadSourceContent_() {
      try {
        const sp = new URLSearchParams(window.location.search || "");
        return ucpNormalizeSourceTag_(sp.get("content") || sp.get("utm_content"));
      } catch (e) {}
      return "";
    }

    function ucpReadReferrerSnapshot_() {
      const referrerUrl = String(document.referrer || "").trim();
      if (!referrerUrl) {
        return { referrerUrl: "", referrerHost: "" };
      }

      try {
        const url = new URL(referrerUrl);
        return {
          referrerUrl,
          referrerHost: String(url.hostname || "").trim().toLowerCase()
        };
      } catch (e) {
        return { referrerUrl, referrerHost: "" };
      }
    }

    function ucpGetSourceEntryType_() {
      try {
        const sp = new URLSearchParams(window.location.search || "");
        if (sp.get("quote")) return "quote";
        if (sp.get("build")) return "build";
        if (sp.get("promo")) return "promo";
      } catch (e) {}
      return "direct";
    }

    function ucpGetSourceOpenFingerprint_() {
      try {
        const url = new URL(window.location.href);
        url.hash = "";
        return url.toString();
      } catch (e) {}
      return String(window.location.href || "").trim();
    }

    function ucpGetSourceOpenStorageKey_(fingerprint) {
      return `ucp_pcb_source_open_v1:${encodeURIComponent(String(fingerprint || ""))}`;
    }

    function ucpGenerateOpenId_() {
      try {
        return crypto?.randomUUID?.() || "";
      } catch (e) {}
      return `open_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    }

    function ucpHasLoggedSourceOpen_(fingerprint) {
      const key = ucpGetSourceOpenStorageKey_(fingerprint);
      if (!key) return false;
      try {
        const lastLoggedAt = Number(sessionStorage.getItem(key) || 0);
        return Number.isFinite(lastLoggedAt) && Date.now() - lastLoggedAt < 10000;
      } catch (e) {}
      return false;
    }

    function ucpMarkSourceOpenLogged_(fingerprint) {
      const key = ucpGetSourceOpenStorageKey_(fingerprint);
      if (!key) return;
      try {
        sessionStorage.setItem(key, String(Date.now()));
      } catch (e) {}
    }

    function ucpMaybeLogSourceOpen_() {
      const sourceTag = ucpReadEntrySourceTag_();
      if (!sourceTag) return;

      const fingerprint = ucpGetSourceOpenFingerprint_();
      if (ucpHasLoggedSourceOpen_(fingerprint)) return;

      const referrer = ucpReadReferrerSnapshot_();

      ucpMarkSourceOpenLogged_(fingerprint);
      ucpLogBuildEvent("pc_builder_open", {
        openId: ucpGenerateOpenId_(),
        sourceTag,
        campaign: ucpReadSourceCampaign_(),
        content: ucpReadSourceContent_(),
        referrerHost: referrer.referrerHost,
        referrerUrl: referrer.referrerUrl,
        entryType: ucpGetSourceEntryType_(),
        pageType: "pc_builder",
        pageUrl: window.location.href,
        promoHandle: ucpReadPromoParam_(),
        quoteCode: ucpTryQuoteCode_(),
        quoteVersion: ucpTryQuoteVersion_()
      });
    }

    // ---------- Quote code logging (waits for real code, de-duped) ----------
    let __UCP_PCB_LAST_LOGGED_QUOTE_CODE = "";
    const QUOTE_SESSION_CODE_KEY = "ucp_pcb_last_quote_code";
    const QUOTE_SESSION_FP_KEY = "ucp_pcb_last_quote_fingerprint";

    function ucpReadStoredQuote_() {
      try {
        return {
          code: sessionStorage.getItem(QUOTE_SESSION_CODE_KEY) || "",
          fingerprint: sessionStorage.getItem(QUOTE_SESSION_FP_KEY) || ""
        };
      } catch (e) {
        return { code: "", fingerprint: "" };
      }
    }

    function ucpStoreQuote_(code, fingerprint) {
      try {
        if (code) sessionStorage.setItem(QUOTE_SESSION_CODE_KEY, code);
        if (fingerprint) sessionStorage.setItem(QUOTE_SESSION_FP_KEY, fingerprint);
      } catch (e) {}
    }

    function ucpNormalizeQuoteCode_(raw) {
      const s = String(raw || "").trim();
      if (!s) return "";

      const up = s.toUpperCase();

      // Normalize "Q-xxxxx". Do not hard-reject other formats.
      if (up.startsWith("Q-")) {
        const tail = up.slice(2).trim();
        if (!tail) return "";
        if (/^[X]+$/.test(tail)) return ""; // placeholder like Q-XXXXX
        return `Q-${tail}`;
      }

      // Also accept "Q 12345" or "Q - 12345"
      const m = up.match(/^Q[\s\-]+(.+)$/);
      if (m && m[1]) {
        const tail = String(m[1]).trim();
        if (!tail || /^[X]+$/.test(tail)) return "";
        return `Q-${tail}`;
      }

      return up;
    }

    // Read only from the DOM element, not from window cache.
    function ucpReadQuoteCodeFromDom_() {
      const el =
        root.querySelector("#ucp-pcb-quote-code") ||
        root.querySelector("[data-ucp-pcb-quote-code]") ||
        document.querySelector("#ucp-pcb-quote-code") ||
        document.querySelector("[data-ucp-pcb-quote-code]");

      if (!el) return "";

      const v = (el.value !== undefined ? el.value : el.textContent) || "";
      return String(v).trim();
    }

    function ucpSetLastQuoteCode_(raw) {
      const code = ucpNormalizeQuoteCode_(raw);
      if (!code) return "";
      try {
        window.UCP_PCB_LAST_QUOTE_CODE = code;
      } catch (e) {}
      return code;
    }

    function ucpClearLastQuoteCode_() {
      try {
        window.UCP_PCB_LAST_QUOTE_CODE = "";
      } catch (e) {}
    }

    function ucpClearStoredQuote_() {
      try {
        sessionStorage.removeItem(QUOTE_SESSION_CODE_KEY);
        sessionStorage.removeItem(QUOTE_SESSION_FP_KEY);
      } catch (e) {}
      ucpClearLastQuoteCode_();
      __UCP_PCB_LAST_LOGGED_QUOTE_CODE = "";
    }

    // Guaranteed share-link fallback using the existing build= encoder in this file.
    function ucpTryBuildLinkFallback_() {
      try {
        if (typeof buildSharePayload === "function" && typeof setBuildInUrl === "function") {
          return String(setBuildInUrl(buildSharePayload()) || "").trim();
        }
      } catch (e) {}
      return "";
    }

    function ucpAppendQuoteToUrl_(url, code, version) {
      if (!url) return "";
      try {
        const u = new URL(url, window.location.origin);
        if (code) u.searchParams.set("quote", code);
        if (version) u.searchParams.set("v", String(version));
        return u.toString();
      } catch (e) {
        return url;
      }
    }

    function ucpResolveQuoteLinkPromoHandle_(options = {}) {
      const direct = String(options.promoHandle || "").trim();
      if (direct) return direct;

      const snapshot = options.snapshot;
      const meta = snapshot && snapshot.meta && typeof snapshot.meta === "object" ? snapshot.meta : null;
      const metaHandle = String(meta && (meta.promoHandle || meta.promo_handle) ? meta.promoHandle || meta.promo_handle : "").trim();
      if (metaHandle) return metaHandle;

      try {
        const cur = new URL(window.location.href);
        return String(cur.searchParams.get("promo") || "").trim();
      } catch (e) {
        return "";
      }
    }

    function ucpResolveQuoteLinkManualOff_(options = {}) {
      const explicit = Number(options.manualOff);
      if (Number.isFinite(explicit) && explicit > 0) return explicit;

      const snapshot = options.snapshot;
      const totals = snapshot && snapshot.totals && typeof snapshot.totals === "object" ? snapshot.totals : null;
      const snapshotOff = Number(totals && (totals.manualOff ?? totals.manual_off));
      if (Number.isFinite(snapshotOff) && snapshotOff > 0) return snapshotOff;

      try {
        const cur = new URL(window.location.href);
        const off = Number(cur.searchParams.get("off"));
        return Number.isFinite(off) && off > 0 ? off : 0;
      } catch (e) {
        return 0;
      }
    }

    function ucpBuildQuoteLookupLink_(code, version, options = {}) {
      if (!code) return "";
      try {
        const base = options.baseUrl || (window.location.origin + window.location.pathname);
        const u = new URL(base, window.location.origin);
        u.searchParams.delete("build");
        u.searchParams.delete("approved");
        u.searchParams.delete("approve");
        u.searchParams.set("quote", code);
        if (version) u.searchParams.set("v", String(version));
        const promoHandle = ucpResolveQuoteLinkPromoHandle_(options);
        if (promoHandle) u.searchParams.set("promo", promoHandle);
        else u.searchParams.delete("promo");
        const manualOff = ucpResolveQuoteLinkManualOff_(options);
        if (Number.isFinite(manualOff) && manualOff > 0) u.searchParams.set("off", String(Math.round(manualOff)));
        else u.searchParams.delete("off");
        return u.toString();
      } catch (e) {
        return "";
      }
    }

    function ucpBuildQuoteApprovalLink_(code, version) {
      const base = ucpBuildQuoteLookupLink_(code, version);
      if (!base) return "";
      return ucpAppendApprovalToUrl_(base);
    }

    function ucpAppendApprovalToUrl_(url) {
      if (!url) return "";
      try {
        const u = new URL(url, window.location.origin);
        u.searchParams.delete("approved");
        u.searchParams.delete("approve");
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

    const QUOTE_THREAD_PREFIX = "ucp_pcb_quote_thread_v1:";
    const QUOTE_DRAFT_PREFIX = "ucp_pcb_quote_draft_v1:";
    const QUOTE_PAGE_INSTANCE_KEY = "ucp_pcb_page_instance_v1";

    let QUOTE_MODE = "draft"; // "linked" | "draft"
    let QUOTE_PAGE_INSTANCE_ID = "";
    let ACTIVE_QUOTE_CODE = "";
    let ACTIVE_QUOTE_VERSION = 0;

    function ucpUpdateQuoteCtx_(code, version) {
      ACTIVE_QUOTE_CODE = code || "";
      ACTIVE_QUOTE_VERSION = Number(version) || 0;
      try {
        window.__UCP_PCB_QUOTE_CTX__ = { quoteCode: ACTIVE_QUOTE_CODE, quoteVersion: ACTIVE_QUOTE_VERSION };
      } catch (e) {}
    }

    function ucpGetActiveQuoteState_() {
      return {
        quoteCode: ACTIVE_QUOTE_CODE,
        quoteVersion: ACTIVE_QUOTE_VERSION,
        mode: QUOTE_MODE
      };
    }

    function ucpNewPageInstanceId_() {
      try {
        return crypto.randomUUID();
      } catch (e) {
        return "draft_" + String(Date.now()) + "_" + Math.random().toString(16).slice(2);
      }
    }

    function ucpInitQuoteContext_() {
      const sp = new URLSearchParams(window.location.search);
      const q = ucpNormalizeQuoteCode_(sp.get("quote"));
      const vRaw = sp.get("v");
      const vNum = Number(vRaw);

      if (q) {
        QUOTE_MODE = "linked";
        ACTIVE_QUOTE_CODE = q;
        ACTIVE_QUOTE_VERSION = Number.isFinite(vNum) && vNum > 0 ? vNum : 1;
        ucpUpdateQuoteCtx_(ACTIVE_QUOTE_CODE, ACTIVE_QUOTE_VERSION);
        return;
      }

      QUOTE_MODE = "draft";
      QUOTE_PAGE_INSTANCE_ID = ucpNewPageInstanceId_();
      try {
        sessionStorage.setItem(QUOTE_PAGE_INSTANCE_KEY, QUOTE_PAGE_INSTANCE_ID);
      } catch (e) {}
      ucpUpdateQuoteCtx_("", 0);
    }

    function ucpEnsureDraftQuoteCode_() {
      if (QUOTE_MODE === "linked") return;

      if (!QUOTE_PAGE_INSTANCE_ID) {
        QUOTE_PAGE_INSTANCE_ID = ucpNewPageInstanceId_();
        try {
          sessionStorage.setItem(QUOTE_PAGE_INSTANCE_KEY, QUOTE_PAGE_INSTANCE_ID);
        } catch (e) {}
      }

      const draft = ucpReadDraftState_() || {};
      let code = ucpNormalizeQuoteCode_(draft.quoteCode);
      if (!code) {
        code = ucpGenerateQuoteCode();
        const next = {
          quoteCode: code,
          lastBuildHash: draft.lastBuildHash ? String(draft.lastBuildHash) : "",
          lastVersion: Number(draft.lastVersion) || 0
        };
        ucpWriteDraftState_(next);
      }

      if (code) {
        ucpUpdateQuoteCtx_(code, Number(draft.lastVersion) || 0);
      }
    }

    function ucpThreadKey_(code) {
      return `${QUOTE_THREAD_PREFIX}${code}`;
    }

    function ucpDraftKey_() {
      if (!QUOTE_PAGE_INSTANCE_ID) return "";
      return `${QUOTE_DRAFT_PREFIX}${QUOTE_PAGE_INSTANCE_ID}`;
    }

    function ucpReadThreadState_(code) {
      if (!code) return null;
      try {
        const raw = localStorage.getItem(ucpThreadKey_(code));
        if (!raw) return null;
        const obj = JSON.parse(raw);
        if (!obj || typeof obj !== "object") return null;
        return {
          lastBuildHash: obj.lastBuildHash ? String(obj.lastBuildHash) : "",
          lastVersion: Number(obj.lastVersion) || 0
        };
      } catch (e) {
        return null;
      }
    }

    function ucpWriteThreadState_(code, state) {
      if (!code) return;
      try {
        localStorage.setItem(ucpThreadKey_(code), JSON.stringify(state || {}));
      } catch (e) {}
    }

    function ucpReadDraftState_() {
      const key = ucpDraftKey_();
      if (!key) return null;
      try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const obj = JSON.parse(raw);
        if (!obj || typeof obj !== "object") return null;
        return {
          quoteCode: obj.quoteCode ? String(obj.quoteCode) : "",
          lastBuildHash: obj.lastBuildHash ? String(obj.lastBuildHash) : "",
          lastVersion: Number(obj.lastVersion) || 0
        };
      } catch (e) {
        return null;
      }
    }

    function ucpWriteDraftState_(state) {
      const key = ucpDraftKey_();
      if (!key) return;
      try {
        sessionStorage.setItem(key, JSON.stringify(state || {}));
      } catch (e) {}
    }

    function ucpSetQuoteCodeInDom_(code) {
      if ($quoteCodeField) {
        if ("value" in $quoteCodeField) $quoteCodeField.value = code;
        else $quoteCodeField.textContent = code;
        try {
          $quoteCodeField.setAttribute("data-ucp-pcb-quote-code", code);
        } catch (e) {}
      }
      ucpSetLastQuoteCode_(code);
    }

    function ucpSetQuoteVersionInDom_(version) {
      if ($quoteVersion) {
        const v = Number(version) || 0;
        $quoteVersion.textContent = v ? `Version: v${v}` : "";
      }
    }

    function ucpSetQuoteLinkInDom_(link) {
      if (!$quoteLinkField) return;
      try {
        if ("value" in $quoteLinkField) $quoteLinkField.value = link;
        else $quoteLinkField.textContent = link;
      } catch (e) {}
    }

    function ucpSetApprovalLinkInDom_(link) {
      if (!$quoteApprovalLinkField) return;
      try {
        if ("value" in $quoteApprovalLinkField) $quoteApprovalLinkField.value = link;
        else $quoteApprovalLinkField.textContent = link;
      } catch (e) {}
    }

    function ucpBuildHashFromSnapshot_(snap) {
      try {
        const payload = buildSharePayload() || {};
        const normalized = {};

        QUOTE_FP_ORDER.forEach((k) => {
          if (payload[k]) normalized[k] = payload[k];
        });

        Object.keys(payload)
          .filter((k) => !QUOTE_FP_ORDER.includes(k))
          .sort()
          .forEach((k) => {
            normalized[k] = payload[k];
          });

        if (Object.keys(normalized).length) return base64UrlEncode(JSON.stringify(normalized));
      } catch (e) {}

      const sel = (snap && snap.selected) || {};
      const order = ["cpu", "motherboard", "ram", "gpu", "cooler", "ssd", "psu", "case", "casefans", "other"];

      function valFor(key) {
        const candidates = [key];
        if (key === "motherboard") candidates.push("mb");
        if (key === "cooler") candidates.push("cpucooler");
        if (key === "psu") candidates.push("powersupply");
        if (key === "casefans") candidates.push("fans");
        for (const c of candidates) {
          if (sel[c] !== undefined && sel[c] !== null && sel[c] !== "") return sel[c];
        }
        return "";
      }

      return order
        .map((k) => `${k}=${valFor(k) ? String(valFor(k)).trim() : ""}`)
        .join("|");
    }

    function ucpEnsureQuoteStateForSnapshot_(snap) {
      const hash = ucpBuildHashFromSnapshot_(snap);

      if (QUOTE_MODE === "linked" && ACTIVE_QUOTE_CODE) {
        const stored = ucpReadThreadState_(ACTIVE_QUOTE_CODE) || {};
        const baseVersion = Math.max(Number(ACTIVE_QUOTE_VERSION) || 0, Number(stored.lastVersion) || 0, 0);
        const quoteVersion = baseVersion > 0 ? baseVersion + 1 : 1;

        ucpWriteThreadState_(ACTIVE_QUOTE_CODE, { lastBuildHash: hash, lastVersion: quoteVersion });
        ucpUpdateQuoteCtx_(ACTIVE_QUOTE_CODE, quoteVersion);

        return {
          quoteCode: ACTIVE_QUOTE_CODE,
          quoteVersion,
          lastBuildHash: hash,
          mode: QUOTE_MODE
        };
      }

      // Draft mode (no quote in URL). Page instance is regenerated every load.
      if (!QUOTE_PAGE_INSTANCE_ID) {
        QUOTE_PAGE_INSTANCE_ID = ucpNewPageInstanceId_();
        try {
          sessionStorage.setItem(QUOTE_PAGE_INSTANCE_KEY, QUOTE_PAGE_INSTANCE_ID);
        } catch (e) {}
      }

      const draft = ucpReadDraftState_() || {};
      let code = ucpNormalizeQuoteCode_(draft.quoteCode);
      if (!code) code = ucpGenerateQuoteCode();

      const baseVersion = Number(draft.lastVersion) || 0;
      const quoteVersion = baseVersion > 0 ? baseVersion + 1 : 1;

      const state = { quoteCode: code, lastBuildHash: hash, lastVersion: quoteVersion };
      ucpWriteDraftState_(state);
      ucpUpdateQuoteCtx_(code, quoteVersion);

      return {
        quoteCode: code,
        quoteVersion,
        lastBuildHash: hash,
        mode: QUOTE_MODE
      };
    }

    function ucpEnsureQuoteStateForShare_(snap) {
      const hash = ucpBuildHashFromSnapshot_(snap);

      if (QUOTE_MODE === "linked" && ACTIVE_QUOTE_CODE) {
        const stored = ucpReadThreadState_(ACTIVE_QUOTE_CODE) || {};
        const lastHash = String(stored.lastBuildHash || "");
        const lastVersion = Number(stored.lastVersion) || 0;
        const baseVersion = Math.max(Number(ACTIVE_QUOTE_VERSION) || 0, lastVersion || 0, 0);
        let quoteVersion = baseVersion > 0 ? baseVersion : 1;

        if (!lastHash || hash !== lastHash) {
          quoteVersion = baseVersion > 0 ? baseVersion + 1 : 1;
        }

        ucpWriteThreadState_(ACTIVE_QUOTE_CODE, { lastBuildHash: hash, lastVersion: quoteVersion });
        ucpUpdateQuoteCtx_(ACTIVE_QUOTE_CODE, quoteVersion);

        return {
          quoteCode: ACTIVE_QUOTE_CODE,
          quoteVersion,
          lastBuildHash: hash,
          mode: QUOTE_MODE
        };
      }

      if (!QUOTE_PAGE_INSTANCE_ID) {
        QUOTE_PAGE_INSTANCE_ID = ucpNewPageInstanceId_();
        try {
          sessionStorage.setItem(QUOTE_PAGE_INSTANCE_KEY, QUOTE_PAGE_INSTANCE_ID);
        } catch (e) {}
      }

      const draft = ucpReadDraftState_() || {};
      let code = ucpNormalizeQuoteCode_(draft.quoteCode);
      if (!code) code = ucpGenerateQuoteCode();

      const lastHash = String(draft.lastBuildHash || "");
      const lastVersion = Number(draft.lastVersion) || 0;
      let quoteVersion = lastVersion > 0 ? lastVersion : 1;

      if (!lastHash || hash !== lastHash) {
        quoteVersion = lastVersion > 0 ? lastVersion + 1 : 1;
      }

      const state = { quoteCode: code, lastBuildHash: hash, lastVersion: quoteVersion };
      ucpWriteDraftState_(state);
      ucpUpdateQuoteCtx_(code, quoteVersion);

      return {
        quoteCode: code,
        quoteVersion,
        lastBuildHash: hash,
        mode: QUOTE_MODE
      };
    }

    function ucpBuildLinksForQuote_(snap, code, version) {
      const base =
        ucpComputeBaseBuildLink_(snap) || ucpTryBuildLink_() || ucpTryBuildLinkFallback_() || location.href;
      if (!code) {
        return { baseLink: base, buildLink: base, quoteLink: "", approvalLink: "" };
      }
      const buyer = ucpAppendQuoteToUrl_(base, code, version);
      const quoteLink = ucpBuildQuoteLookupLink_(code, version, { snapshot: snap });
      const approval = ucpBuildQuoteApprovalLink_(code, version);
      return { baseLink: base, buildLink: buyer, quoteLink, approvalLink: approval };
    }

    function ucpBuildShareLinkForModal_(code, version, snap) {
      const links = ucpBuildLinksForQuote_(snap, code, version);
      return links.quoteLink || links.buildLink;
    }

    function ucpHandleBuildChanged_() {
      __UCP_PCB_LAST_LOGGED_QUOTE_CODE = "";
    }

    function ucpLogRequestQuoteOnce_(raw, meta = {}) {
      const code = ucpNormalizeQuoteCode_(raw);
      const version = Number(meta.quoteVersion) || 1;
      if (!code) return false;

      const dedupeKey = `${code}::v${version}`;
      if (__UCP_PCB_LAST_LOGGED_QUOTE_CODE === dedupeKey) return false;
      __UCP_PCB_LAST_LOGGED_QUOTE_CODE = dedupeKey;

      ucpSetLastQuoteCode_(code);

      const buildLink =
        meta.buildLink ||
        ucpAppendQuoteToUrl_(ucpTryBuildLink_() || ucpTryBuildLinkFallback_() || location.href, code, version);
      const quoteLink =
        meta.quoteLink || ucpBuildQuoteLookupLink_(code, version, { buildLink });
      const approvalLink =
        meta.approvalLink ||
        ucpBuildQuoteApprovalLink_(code, version) ||
        (buildLink ? ucpAppendApprovalToUrl_(buildLink) : "");

      ucpLogBuildEvent("request_quote", {
        buildLink,
        quoteLink,
        approvalLink,
        quoteCode: code,
        quoteVersion: version
      });

      return true;
    }

    async function ucpWaitForRealQuoteCode_({ timeoutMs = 6000, intervalMs = 120, previousCode = "" } = {}) {
      const started = Date.now();
      const prev = ucpNormalizeQuoteCode_(previousCode);

      while (Date.now() - started < timeoutMs) {
        // Prefer DOM so we pick up newly rendered codes even if window has stale data.
        const domCode = ucpNormalizeQuoteCode_(ucpReadQuoteCodeFromDom_());
        if (domCode && (!prev || domCode !== prev)) return domCode;

        // Fallback. Some implementations only set a window var via UCP_PCB_LOG_QUOTE.
        const winCode = ucpNormalizeQuoteCode_(ucpTryQuoteCode_());
        if (winCode && (!prev || winCode !== prev)) return winCode;

        await new Promise((r) => setTimeout(r, intervalMs));
      }

      return "";
    }

    // Public hook. Your quote modal should call this after it renders the final code.
    window.UCP_PCB_LOG_QUOTE = function (quoteCode) {
      ucpLogRequestQuoteOnce_(quoteCode);
    };




    // ---------------- Mobile breakpoint helper ----------------
    const MOBILE_MQ = window.matchMedia("(max-width: 768px)");
    const DESKTOP_DOCK_MQ = window.matchMedia("(min-width: 769px)");
    function isMobile() {
      return !!MOBILE_MQ.matches;
    }

    let desktopDockVisible = false;
    let desktopDockSyncRaf = null;
    let desktopDockObserver = null;

    function setDesktopDockVisible_(next) {
      const visible = !!next && !!$desktopDock && !!DESKTOP_DOCK_MQ.matches;
      if (desktopDockVisible === visible) return;
      desktopDockVisible = visible;
      safeSetHidden($desktopDock, !visible);
      root.classList.toggle("ucp-pcb--actionDockVisible", visible);
    }

    function syncDesktopDockVisibility_() {
      if (!$desktopDock || !$desktopDockSource) {
        setDesktopDockVisible_(false);
        return;
      }

      const rootRect = root.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight || 0;
      const builderInView = rootRect.bottom > 80 && rootRect.top < vh - 40;
      const sourceFullyVisible = isElementFullyInViewport_($desktopDockSource);
      setDesktopDockVisible_(builderInView && !sourceFullyVisible);
    }

    function queueDesktopDockSync_() {
      if (desktopDockSyncRaf) return;
      desktopDockSyncRaf = requestAnimationFrame(() => {
        desktopDockSyncRaf = null;
        syncDesktopDockVisibility_();
      });
    }

    function initDesktopActionDock_() {
      if (!$desktopDock || !$desktopDockSource) return;

      if (window.IntersectionObserver) {
        desktopDockObserver = new IntersectionObserver(
          () => {
            queueDesktopDockSync_();
          },
          { threshold: [0, 1] }
        );
        desktopDockObserver.observe($desktopDockSource);
      }

      window.addEventListener("scroll", queueDesktopDockSync_, { passive: true });
      window.addEventListener("resize", queueDesktopDockSync_, { passive: true });

      if (DESKTOP_DOCK_MQ.addEventListener) DESKTOP_DOCK_MQ.addEventListener("change", queueDesktopDockSync_);
      else DESKTOP_DOCK_MQ.addListener(queueDesktopDockSync_);

      queueDesktopDockSync_();
    }

    const SORT_MODES = {
      RECOMMENDED: "recommended",
      PRICE_ASC: "price_asc",
      PRICE_DESC: "price_desc"
    };

    function getSortMode(tab = state.tab) {
      return state.sortModeByTab[tab] || SORT_MODES.RECOMMENDED;
    }

    function cyclePriceSort(tab = state.tab) {
      const cur = getSortMode(tab);
      const next =
        cur === SORT_MODES.RECOMMENDED
          ? SORT_MODES.PRICE_ASC
          : cur === SORT_MODES.PRICE_ASC
            ? SORT_MODES.PRICE_DESC
            : SORT_MODES.RECOMMENDED;

      state.sortModeByTab[tab] = next;
      return next;
    }

    function priceSortIcon(mode) {
      if (mode === SORT_MODES.PRICE_ASC) return "↑";
      if (mode === SORT_MODES.PRICE_DESC) return "↓";
      return "↕";
    }

    function priceSortTitle(mode) {
      if (mode === SORT_MODES.PRICE_ASC) return "Sort by price: low to high. Click to sort high to low.";
      if (mode === SORT_MODES.PRICE_DESC) return "Sort by price: high to low. Click to return to recommended.";
      return "Recommended order. Click to sort low to high.";
    }

    const SPL_PSU_TIER_LIST_URL =
      "https://docs.google.com/spreadsheets/d/1akCHL7Vhzk_EhrpIGkz8zTEvYfLDcaSpZRB6Xt6JWkc/edit?gid=1719706335#gid=1719706335";

    const COLS = {
      processor: ["Product", "Processor Socket", "Cores / Threads", "Base / Boost Clock", "TDP", "Price"],
      motherboard: ["Product", "Chipset", "RAM Slots", "WiFi", "M.2 Slots", "Price"],
      gpu: ["Product", "Chipset", "VRAM", "Core / Boost Clock", "Length", "Price"],
      memory: ["Product", "Memory Technology", "Speed", "Modules", "CAS Latency", "Price"],
      ssd: ["Product", "Device Interface", "Read / Write", "Generation", "-", "Price"],
      powersupply: ["Product", "Watts", "Certification", "SPL PSU Tier List", "Modularity", "Price"],
      cpucooler: ["Product", "Radiator Size", "Cooler Height", "Temps (Full Load)", "-", "Price"],
      case: ["Product", "Supported Motherboards", "GPU Support", "-", "-", "Price"],
      casefans: ["Product", "-", "-", "-", "-", "Price"],
      other: ["Product", "-", "-", "-", "-", "Price"]
    };

    const FILTERS_BY_TAB = {
      processor: { brand: true, socket: true, price: true },
      motherboard: { brand: true, chipset: true, price: true },
      gpu: { gpuBrand: true, chipset: true, boardPartner: true, price: true },
      memory: { brand: true, price: true },
      ssd: { brand: true, formFactor: true, price: true },
      powersupply: { brand: true, watts: true, price: true },
      cpucooler: { brand: true, coolerType: true, price: true },
      case: { brand: true, caseFf: true, price: true },
      casefans: { brand: true, price: true },
      other: { brand: true, price: true }
    };

    function moneyPHP(n) {
      const v = Number(n || 0);
      return "₱" + v.toLocaleString("en-PH", { maximumFractionDigits: 0 });
    }

    /* =========================================================
    2) Add availability tier helpers (safe, optional fields)
    Insert this block AFTER the moneyPHP(n) function.
    Search for:
    function moneyPHP(n) { ... }
    Then paste this right after it.
    ========================================================= */

    function ucpReadLeadTimeLabel_(p, av) {
      const candidates = [
        av?.lead_time_label,
        av?.leadTimeLabel,
        p?.lead_time_label,
        p?.leadTimeLabel,
        p?.specs?.lead_time_label,
        p?.specs?.leadTimeLabel,
        p?.metafields?.custom?.lead_time_label
      ];

      for (const c of candidates) {
        if (c === null || c === undefined) continue;
        const v = typeof c === "object" && c && "value" in c ? c.value : c;
        const s = String(v || "").trim();
        if (s) return s;
      }

      return "";
    }

    // [UCP][AVAIL_TIER] Returns an HTML block. Empty string if disabled or missing tier.
    function ucpLeadTimeHtmlForProduct_(p, av) {
      if (!UCP_PCB_SHOW_LEADTIME_LABEL) return "";

      const tier = ucpEffectiveAvailTierInt_(p, av);
      if (!(tier > 0)) return "";

      const customLabel = ucpReadLeadTimeLabel_(p, av);
      const label =
        tier === 1
          ? "On-hand"
          : tier === 2
            ? (customLabel || "1-2 days")
            : tier === 3
              ? (customLabel || "3-5 days")
              : tier === 9
                ? (customLabel || "Ask to confirm")
                : "";

      if (!label) return "";

      // CSS hook only. Style later in CSS if needed.
      return `<div class="ucp-pcb__leadTime" data-ucp-pcb-tier="${escapeHtml(`tier${tier}`)}"><small>${escapeHtml(
        label
      )}</small></div>`;
    }

    function ucpAvailabilityTextForTier_(tier, p, av) {
      if (!(tier > 0)) return "";
      const customLabel = ucpReadLeadTimeLabel_(p, av);
      if (tier === 1) return "On-hand";
      if (tier === 2) return customLabel || "1-2 days";
      if (tier === 3) return customLabel || "3-5 days";
      if (tier === 9) return customLabel || "Ask to confirm";
      return "";
    }

    function endpointFor(tab) {
      return cfg.endpoints && cfg.endpoints[tab] ? cfg.endpoints[tab] : "";
    }

    function withPageParam(url, page) {
      if (!page) return url;
      try {
        const u = new URL(url, window.location.origin);
        u.searchParams.set("page", String(page));
        return u.pathname + u.search;
      } catch {
        if (String(url).includes("page=")) {
          return String(url).replace(/([?&])page=\d+/i, `$1page=${page}`);
        }
        return String(url).includes("?") ? `${url}&page=${page}` : `${url}?page=${page}`;
      }
    }

    function asArray(v) {
      if (Array.isArray(v)) return v;
      if (v === null || v === undefined || v === "") return [];
      return [v];
    }

    function labelOf(x) {
      if (x === null || x === undefined) return "";
      const t = typeof x;
      if (t === "string" || t === "number" || t === "boolean") return String(x);
      if (Array.isArray(x)) return x.length ? labelOf(x[0]) : "";
      if (t === "object") return x.name || x.label || x.title || x.value || x.handle || "";
      return String(x);
    }

    function norm(x) {
      return labelOf(x).trim().toUpperCase();
    }

    function intersects(a, b) {
      const A = asArray(a).map(norm).filter(Boolean);
      const B = new Set(asArray(b).map(norm).filter(Boolean));
      return A.some((x) => B.has(x));
    }

    function getPickedCpuSockets() {
      return asArray(state.picked?.processor?.compat?.processor_sockets).map(labelOf).filter(Boolean);
    }

    function getPickedMoboMemTech() {
      return asArray(state.picked?.motherboard?.compat?.memory_technology).map(labelOf).filter(Boolean);
    }

    function ucpProductEnabledForBuilder_(product) {
      const value = product?.pc_builder_enabled ?? product?.pcBuilderEnabled;
      if (value === false) return false;
      if (typeof value === "string" && value.trim().toLowerCase() === "false") return false;
      return true;
    }

    async function fetchAllProducts(tab) {
      const base = endpointFor(tab);
      if (!base) return [];

      let page = 1;
      let out = [];

      while (true) {
        const res = await fetch(withPageParam(base, page), { credentials: "same-origin" });
        if (!res.ok) break;

        const json = await res.json();
        const items = Array.isArray(json.products) ? json.products : [];
        out = out.concat(items);

        if (!json.next_page) break;
        page = json.next_page;

        if (page > 20) break;
      }

      return out.filter(ucpProductEnabledForBuilder_);
    }

    function uniqSorted(arr) {
      return Array.from(new Set(arr.map((x) => String(x).trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    }

    function setOptions($select, values, { allLabel = "All", formatter = (x) => x } = {}) {
      if (!$select) return;
      const opts = [`<option value="">${escapeHtml(allLabel)}</option>`]
        .concat(
          values.map((v) => {
            const val = String(v);
            return `<option value="${escapeHtml(val)}">${escapeHtml(formatter(val))}</option>`;
          })
        )
        .join("");
      $select.innerHTML = opts;
    }

    // ---------- Bundle rules ----------
    function buildRuleIndex(rules) {
      const map = new Map();

      function keyFor(rule) {
        const cp = rule?.cpu_product_id ? normId(rule.cpu_product_id) : "";
        const cv = rule?.cpu_variant_id ? normId(rule.cpu_variant_id) : "";
        const mp = rule?.mobo_product_id ? normId(rule.mobo_product_id) : "";
        const mv = rule?.mobo_variant_id ? normId(rule.mobo_variant_id) : "";

        if (cv && mv) return `cv:${cv}|mv:${mv}`;
        if (cv && mp) return `cv:${cv}|mp:${mp}`;
        if (cp && mv) return `cp:${cp}|mv:${mv}`;
        if (cp && mp) return `cp:${cp}|mp:${mp}`;
        return "";
      }

      function addToMap(k, rule) {
        if (!k) return;
        const arr = map.get(k) || [];
        arr.push(rule);
        map.set(k, arr);
      }

      for (const r of rules || []) addToMap(keyFor(r), r);
      return map;
    }

    let ruleIndex = buildRuleIndex(bundleRules);

    function bestRule(arr) {
      if (!arr || !arr.length) return null;
      return arr
        .slice()
        .sort((a, b) => {
          const da = Number(a?.discount_amount || 0);
          const db = Number(b?.discount_amount || 0);
          if (db !== da) return db - da;
          const sa = Number(a?.sort_order || 0);
          const sb = Number(b?.sort_order || 0);
          return sa - sb;
        })[0];
    }

    function bundleRuleFor(cpu, mobo) {
      if (!cpu || !mobo) return null;

      const cpuPid = normId(cpu.productId);
      const cpuVid = normId(cpu.variantId);
      const moboPid = normId(mobo.productId);
      const moboVid = normId(mobo.variantId);

      const a1 = ruleIndex.get(`cv:${cpuVid}|mv:${moboVid}`);
      if (a1 && a1.length) return bestRule(a1);

      const a2 = ruleIndex.get(`cv:${cpuVid}|mp:${moboPid}`);
      if (a2 && a2.length) return bestRule(a2);

      const a3 = ruleIndex.get(`cp:${cpuPid}|mv:${moboVid}`);
      if (a3 && a3.length) return bestRule(a3);

      const a4 = ruleIndex.get(`cp:${cpuPid}|mp:${moboPid}`);
      if (a4 && a4.length) return bestRule(a4);

      return null;
    }

    function bundleDiscountFor(cpu, mobo) {
      const r = bundleRuleFor(cpu, mobo);
      const d = Number(r?.discount_amount || 0);
      if (!Number.isFinite(d) || d <= 0) return 0;
      return d;
    }

    function currentBundleDiscount() {
      const cpu = state.picked.processor;
      const mobo = state.picked.motherboard;
      if (!cpu || !mobo) return 0;
      return bundleDiscountFor(cpu, mobo);
    }

    const UCP_PROMO_TAB_KEYS_ = [
      "processor",
      "motherboard",
      "memory",
      "gpu",
      "ssd",
      "cpucooler",
      "powersupply",
      "case",
      "casefans",
      "other"
    ];
    const UCP_PROMO_TAB_SET_ = new Set(UCP_PROMO_TAB_KEYS_);

    function ucpNormalizePromoTab_(value) {
      const s = String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
      const aliases = {
        cpu: "processor",
        processor: "processor",
        motherboard: "motherboard",
        mobo: "motherboard",
        mb: "motherboard",
        ram: "memory",
        memory: "memory",
        gpu: "gpu",
        graphicscard: "gpu",
        ssd: "ssd",
        storage: "ssd",
        cooler: "cpucooler",
        cpucooler: "cpucooler",
        cpucoolers: "cpucooler",
        psu: "powersupply",
        powersupply: "powersupply",
        case: "case",
        chassis: "case",
        casefan: "casefans",
        casefans: "casefans",
        fans: "casefans",
        other: "other"
      };
      return aliases[s] || String(value || "").trim().toLowerCase();
    }

    function ucpPromoRequiredComponents_(promo) {
      let raw = promo && promo.required_components;
      if (typeof raw === "string") {
        try {
          raw = JSON.parse(raw);
        } catch (e) {
          raw = [];
        }
      }

      if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        if (Array.isArray(raw.components)) raw = raw.components;
        else if (Array.isArray(raw.required_components)) raw = raw.required_components;
        else raw = Object.values(raw);
      }

      if (!Array.isArray(raw)) return [];

      return raw
        .map((req) => {
          if (!req || typeof req !== "object" || Array.isArray(req)) return null;
          const tab = ucpNormalizePromoTab_(req.tab || req.component || req.category || req.key || req.type);
          const productId = normId(req.product_id || req.productId || req.product || req.pid || "");
          const variantId = normId(req.variant_id || req.variantId || req.variant || req.vid || "");
          const qtyRaw = Number(req.qty || req.quantity || 1);
          const qty = Number.isFinite(qtyRaw) && qtyRaw > 0 ? Math.max(1, Math.round(qtyRaw)) : 1;
          const label = String(req.label || req.title || req.name || "").trim();
          if (!tab || (!productId && !variantId)) return null;
          return { tab, productId, variantId, qty, label };
        })
        .filter(Boolean);
    }

    function ucpPromoLikeHandleList_(raw) {
      let value = raw;
      if (typeof value === "string") {
        try {
          value = JSON.parse(value);
        } catch (e) {
          value = value
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean);
        }
      }

      if (!Array.isArray(value)) return [];

      return value
        .map((entry) => ucpNormalizePromoHandle_(entry))
        .filter(Boolean);
    }

    function ucpAddonBulkQualifyingTabs_(raw) {
      let value = raw;
      if (typeof value === "string") {
        try {
          value = JSON.parse(value);
        } catch (e) {
          value = value
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean);
        }
      }

      if (value && typeof value === "object" && !Array.isArray(value)) {
        if (Array.isArray(value.tabs)) value = value.tabs;
        else if (Array.isArray(value.bulk_qualifying_tabs)) value = value.bulk_qualifying_tabs;
        else if (Array.isArray(value.qualifying_tabs)) value = value.qualifying_tabs;
        else value = Object.values(value);
      }

      if (!Array.isArray(value)) return [];

      return Array.from(
        new Set(
          value
            .map((entry) => {
              const rawTab =
                entry && typeof entry === "object"
                  ? entry.tab || entry.component || entry.category || entry.key || entry.type || entry.name
                  : entry;
              const tab = ucpNormalizePromoTab_(rawTab);
              return UCP_PROMO_TAB_SET_.has(tab) ? tab : "";
            })
            .filter(Boolean)
        )
      );
    }

    function ucpAddonDiscountTargets_(rule) {
      let raw = rule && rule.discounted_targets;
      if (typeof raw === "string") {
        try {
          raw = JSON.parse(raw);
        } catch (e) {
          raw = [];
        }
      }

      if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        if (Array.isArray(raw.targets)) raw = raw.targets;
        else if (Array.isArray(raw.discounted_targets)) raw = raw.discounted_targets;
        else raw = Object.values(raw);
      }

      if (!Array.isArray(raw)) return [];

      return raw
        .map((target) => {
          if (!target || typeof target !== "object" || Array.isArray(target)) return null;
          const tab = ucpNormalizePromoTab_(target.tab || target.component || target.category || target.key || target.type);
          const productId = normId(target.product_id || target.productId || target.product || target.pid || "");
          const variantId = normId(target.variant_id || target.variantId || target.variant || target.vid || "");
          const qtyRaw = Number(target.qty || target.quantity || 1);
          const qty = Number.isFinite(qtyRaw) && qtyRaw > 0 ? Math.max(1, Math.round(qtyRaw)) : 1;
          const discountRaw = Number(
            target.discount_amount ?? target.discountAmount ?? target.amount ?? target.discount ?? 0
          );
          const discountAmount = Number.isFinite(discountRaw) && discountRaw > 0 ? discountRaw : 0;
          const label = String(target.label || target.title || target.name || "").trim();
          if (!tab || (!productId && !variantId) || !(discountAmount > 0)) return null;
          return { tab, productId, variantId, qty, label, discountAmount };
        })
        .filter(Boolean);
    }

    function ucpNormalizePromoRule_(promo) {
      if (!promo || typeof promo !== "object" || Array.isArray(promo)) return null;
      const handle = ucpNormalizePromoHandle_(promo.handle || promo.system_handle || promo.key || promo.id);
      if (!handle) return null;

      const discountRaw = Number(promo.discount_amount ?? promo.discountAmount ?? promo.amount ?? 0);
      const discountAmount = Number.isFinite(discountRaw) && discountRaw > 0 ? discountRaw : 0;

      return {
        handle,
        promoLabel: String(promo.promo_label || promo.promoLabel || promo.label || handle).trim(),
        badgeLabel: String(promo.badge_label || promo.badgeLabel || "").trim(),
        isActive: ucpAsBool_(promo.is_active ?? promo.isActive ?? true, true),
        discountAmount,
        stackWithBundleDiscount: ucpAsBool_(
          promo.stack_with_bundle_discount ?? promo.stackWithBundleDiscount,
          true
        ),
        requiredComponents: ucpPromoRequiredComponents_(promo),
        publicVisibility: ucpAsBool_(promo.public_visibility ?? promo.publicVisibility, false),
        description: String(promo.description || promo.short_description || promo.shortDescription || "").trim(),
        terms: String(promo.terms || promo.terms_text || promo.termsText || "").trim(),
        imageUrl: String(promo.image_url || promo.imageUrl || "").trim(),
        startsAt: String(promo.starts_at || promo.startsAt || "").trim(),
        endsAt: String(promo.ends_at || promo.endsAt || "").trim(),
        priority: Number(promo.priority || 0) || 0
      };
    }

    function ucpNormalizeAddonDiscountRule_(rule) {
      if (!rule || typeof rule !== "object" || Array.isArray(rule)) return null;
      const handle = ucpNormalizePromoHandle_(rule.handle || rule.system_handle || rule.key || rule.id);
      if (!handle) return null;
      const bulkQualifyingTabs = ucpAddonBulkQualifyingTabs_(
        rule.bulk_qualifying_tabs ?? rule.bulkQualifyingTabs ?? rule.qualifying_tabs ?? rule.qualifyingTabs
      );
      const bulkMinRaw = Number(
        rule.bulk_min_qualifying_tabs ??
          rule.bulkMinQualifyingTabs ??
          rule.min_qualifying_tabs ??
          rule.minQualifyingTabs ??
          0
      );

      return {
        handle,
        promoLabel: String(rule.promo_label || rule.promoLabel || rule.label || handle).trim(),
        badgeLabel: String(rule.badge_label || rule.badgeLabel || "").trim(),
        isActive: ucpAsBool_(rule.is_active ?? rule.isActive ?? true, true),
        unlockOnBundleDiscount: ucpAsBool_(
          rule.unlock_on_bundle_discount ?? rule.unlockOnBundleDiscount,
          false
        ),
        unlockOnAnyPrimaryPromo: ucpAsBool_(
          rule.unlock_on_any_primary_promo ?? rule.unlockOnAnyPrimaryPromo,
          false
        ),
        qualifyingPromoHandles: ucpPromoLikeHandleList_(
          rule.qualifying_promo_handles ?? rule.qualifyingPromoHandles
        ),
        bulkUnlockEnabled: ucpAsBool_(
          rule.bulk_unlock_enabled ?? rule.bulkUnlockEnabled,
          false
        ),
        bulkQualifyingTabs,
        bulkMinQualifyingTabs:
          Number.isFinite(bulkMinRaw) && bulkMinRaw > 0 ? Math.max(1, Math.round(bulkMinRaw)) : 0,
        stackWithBundleDiscount: ucpAsBool_(
          rule.stack_with_bundle_discount ?? rule.stackWithBundleDiscount,
          true
        ),
        stackWithPrimaryPromo: ucpAsBool_(
          rule.stack_with_primary_promo ?? rule.stackWithPrimaryPromo,
          true
        ),
        discountedTargets: ucpAddonDiscountTargets_(rule),
        description: String(rule.description || rule.short_description || rule.shortDescription || "").trim(),
        internalNote: String(rule.internal_note || rule.internalNote || "").trim(),
        startsAt: String(rule.starts_at || rule.startsAt || "").trim(),
        endsAt: String(rule.ends_at || rule.endsAt || "").trim(),
        priority: Number(rule.priority || 0) || 0
      };
    }

    function ucpPromoDateWindowOk_(promo) {
      const now = Date.now();
      if (promo.startsAt) {
        const starts = Date.parse(promo.startsAt);
        if (Number.isFinite(starts) && now < starts) return false;
      }
      if (promo.endsAt) {
        const ends = Date.parse(promo.endsAt);
        if (Number.isFinite(ends) && now > ends) return false;
      }
      return true;
    }

    function ucpAddonDateWindowOk_(rule) {
      const now = Date.now();
      if (rule.startsAt) {
        const starts = Date.parse(rule.startsAt);
        if (Number.isFinite(starts) && now < starts) return false;
      }
      if (rule.endsAt) {
        const ends = Date.parse(rule.endsAt);
        if (Number.isFinite(ends) && now > ends) return false;
      }
      return true;
    }

    function ucpComparePromoRules_(a, b) {
      const priorityDiff = Number(b?.priority || 0) - Number(a?.priority || 0);
      if (priorityDiff) return priorityDiff;

      const discountDiff = Number(b?.discountAmount || 0) - Number(a?.discountAmount || 0);
      if (discountDiff) return discountDiff;

      return String(a?.handle || "").localeCompare(String(b?.handle || ""));
    }

    function ucpAvailablePromoRules_() {
      return (Array.isArray(promoRules) ? promoRules : [])
        .map(ucpNormalizePromoRule_)
        .filter((promo) => {
          return (
            promo &&
            promo.isActive &&
            promo.discountAmount > 0 &&
            Array.isArray(promo.requiredComponents) &&
            promo.requiredComponents.length > 0 &&
            ucpPromoDateWindowOk_(promo)
          );
        })
        .sort(ucpComparePromoRules_);
    }

    function ucpCompareAddonRules_(a, b) {
      const priorityDiff = Number(b?.priority || 0) - Number(a?.priority || 0);
      if (priorityDiff) return priorityDiff;

      const discountDiff =
        (b?.discountedTargets || []).reduce((sum, row) => sum + Number(row?.discountAmount || 0), 0) -
        (a?.discountedTargets || []).reduce((sum, row) => sum + Number(row?.discountAmount || 0), 0);
      if (discountDiff) return discountDiff;

      return String(a?.handle || "").localeCompare(String(b?.handle || ""));
    }

    function ucpAvailableAddonDiscountRules_() {
      return (Array.isArray(addonDiscountRules) ? addonDiscountRules : [])
        .map(ucpNormalizeAddonDiscountRule_)
        .filter((rule) => {
          if (!rule || !rule.isActive || !rule.discountedTargets.length || !ucpAddonDateWindowOk_(rule)) {
            return false;
          }
          return (
            rule.unlockOnBundleDiscount ||
            rule.unlockOnAnyPrimaryPromo ||
            (Array.isArray(rule.qualifyingPromoHandles) && rule.qualifyingPromoHandles.length > 0) ||
            (
              rule.bulkUnlockEnabled &&
              Array.isArray(rule.bulkQualifyingTabs) &&
              rule.bulkQualifyingTabs.length > 0 &&
              rule.bulkMinQualifyingTabs > 0
            )
          );
        })
        .sort(ucpCompareAddonRules_);
    }

    function ucpFindPromoRuleByHandle_(handle) {
      const safeHandle = ucpNormalizePromoHandle_(handle);
      if (!safeHandle) return null;
      return ucpAvailablePromoRules_().find((promo) => promo.handle === safeHandle) || null;
    }

    function ucpFindActivePromoRule_() {
      return ucpFindPromoRuleByHandle_(ACTIVE_PROMO_HANDLE);
    }

    function ucpPickedMatchesPromoRequirement_(req) {
      if (!req || !req.tab) return false;
      const picked = state.picked?.[req.tab];
      if (!picked) return false;

      const list = Array.isArray(picked) ? picked : [picked];
      let matchedQty = 0;

      list.forEach((item) => {
        if (!item) return;
        const itemProductId = normId(item.productId || item.product_id || "");
        const itemVariantId = normId(item.variantId || item.variant_id || "");
        if (req.productId && itemProductId !== req.productId) return;
        if (req.variantId && itemVariantId !== req.variantId) return;
        const qtyRaw = Number(item.qty || 1);
        matchedQty += Number.isFinite(qtyRaw) && qtyRaw > 0 ? qtyRaw : 1;
      });

      return matchedQty >= req.qty;
    }

    function ucpPickedTabHasSelection_(tab) {
      const safeTab = ucpNormalizePromoTab_(tab);
      if (!safeTab || !UCP_PROMO_TAB_SET_.has(safeTab)) return false;
      const picked = state.picked?.[safeTab];
      if (!picked) return false;

      const list = Array.isArray(picked) ? picked : [picked];
      return list.some((item) => {
        if (!item) return false;
        const qtyRaw = Number(item.qty || 1);
        return !Number.isFinite(qtyRaw) || qtyRaw > 0;
      });
    }

    function ucpPromoMatchDetails_(promo) {
      const required = Array.isArray(promo?.requiredComponents) ? promo.requiredComponents : [];
      const missing = required.filter((req) => !ucpPickedMatchesPromoRequirement_(req));
      return {
        required,
        missing,
        valid: required.length > 0 && missing.length === 0
      };
    }

    function ucpBuildPromoState_(promo, details) {
      const match = details || ucpPromoMatchDetails_(promo);
      const valid = !!match.valid;

      return {
        handle: promo.handle,
        label: promo.promoLabel || promo.handle,
        badgeLabel: promo.badgeLabel,
        active: true,
        valid,
        discountAmount: valid ? promo.discountAmount : 0,
        stackWithBundleDiscount: promo.stackWithBundleDiscount,
        missingCount: match.missing.length
      };
    }

    function ucpFindBestMatchingPromoRule_() {
      const matches = ucpAvailablePromoRules_()
        .map((promo) => ({
          promo,
          details: ucpPromoMatchDetails_(promo)
        }))
        .filter((entry) => entry.details.valid);

      if (!matches.length) return null;
      matches.sort((a, b) => ucpComparePromoRules_(a.promo, b.promo));
      return matches[0];
    }

    function ucpCurrentPromoState_() {
      const empty = {
        handle: ACTIVE_PROMO_HANDLE || "",
        label: "",
        badgeLabel: "",
        active: false,
        valid: false,
        discountAmount: 0,
        stackWithBundleDiscount: true,
        missingCount: 0
      };

      const activePromo = ucpFindActivePromoRule_();
      if (activePromo) {
        const details = ucpPromoMatchDetails_(activePromo);
        if (details.valid) return ucpBuildPromoState_(activePromo, details);
      }

      const matchedPromo = ucpFindBestMatchingPromoRule_();
      if (matchedPromo) return ucpBuildPromoState_(matchedPromo.promo, matchedPromo.details);

      if (activePromo) return ucpBuildPromoState_(activePromo, ucpPromoMatchDetails_(activePromo));

      return empty;
    }

    function ucpAddonDiscountLabel_(rule, target) {
      const ruleLabel = String(rule?.promoLabel || "").trim();
      const targetLabel = String(target?.label || "").trim();
      if (ruleLabel && targetLabel && ruleLabel.toLowerCase() !== targetLabel.toLowerCase()) {
        return ruleLabel;
      }
      return targetLabel || ruleLabel || "Add-on discount";
    }

    function ucpAddonRulePrimaryPromoUnlocked_(rule, promoState) {
      if (!rule || !promoState || !promoState.valid) return false;
      if (rule.unlockOnAnyPrimaryPromo) return true;
      const handles = Array.isArray(rule.qualifyingPromoHandles) ? rule.qualifyingPromoHandles : [];
      if (!handles.length) return false;
      return handles.includes(String(promoState.handle || "").trim());
    }

    function ucpAddonRuleBulkUnlocked_(rule) {
      if (!rule || !rule.bulkUnlockEnabled) return false;
      const tabs = Array.isArray(rule.bulkQualifyingTabs) ? rule.bulkQualifyingTabs : [];
      const minTabs = Number(rule.bulkMinQualifyingTabs || 0);
      if (!tabs.length || !(minTabs > 0)) return false;

      const selectedCount = tabs.reduce(
        (count, tab) => count + (ucpPickedTabHasSelection_(tab) ? 1 : 0),
        0
      );
      return selectedCount >= minTabs;
    }

    function ucpAddonRuleUnlocks_(rule, rawBundleDiscount, promoState) {
      if (!rule) return false;
      if (rule.unlockOnBundleDiscount && Number(rawBundleDiscount || 0) > 0) return true;
      if (ucpAddonRulePrimaryPromoUnlocked_(rule, promoState)) return true;
      if (ucpAddonRuleBulkUnlocked_(rule)) return true;
      return false;
    }

    function ucpMatchAddonDiscountRule_(rule, rawBundleDiscount, promoState) {
      if (!rule || !ucpAddonRuleUnlocks_(rule, rawBundleDiscount, promoState)) return null;

      const targets = Array.isArray(rule.discountedTargets) ? rule.discountedTargets : [];
      const matchedRows = targets
        .filter((target) => ucpPickedMatchesPromoRequirement_(target))
        .map((target) => ({
          handle: rule.handle,
          ruleLabel: rule.promoLabel || rule.handle,
          label: ucpAddonDiscountLabel_(rule, target),
          discountAmount: Number(target.discountAmount || 0) || 0,
          tab: target.tab,
          productId: target.productId || "",
          variantId: target.variantId || "",
          targetLabel: String(target.label || "").trim()
        }))
        .filter((row) => row.discountAmount > 0);

      if (!matchedRows.length) return null;

      return {
        handle: rule.handle,
        ruleLabel: rule.promoLabel || rule.handle,
        stackWithBundleDiscount: rule.stackWithBundleDiscount,
        stackWithPrimaryPromo: rule.stackWithPrimaryPromo,
        rows: matchedRows,
        total: matchedRows.reduce((sum, row) => sum + Number(row.discountAmount || 0), 0)
      };
    }

    function ucpCurrentAddonDiscountState_(rawBundleDiscount, promoState) {
      const matches = ucpAvailableAddonDiscountRules_()
        .map((rule) => ucpMatchAddonDiscountRule_(rule, rawBundleDiscount, promoState))
        .filter(Boolean);

      const rows = matches.flatMap((match) => (Array.isArray(match.rows) ? match.rows : []));
      const ruleHandles = Array.from(
        new Set(
          matches
            .map((match) => String(match.handle || "").trim())
            .filter(Boolean)
        )
      );
      const ruleLabels = Array.from(
        new Set(
          matches
            .map((match) => String(match.ruleLabel || "").trim())
            .filter(Boolean)
        )
      );

      return {
        rows,
        total: rows.reduce((sum, row) => sum + Number(row.discountAmount || 0), 0),
        ruleHandles,
        ruleLabels,
        suppressBundleDiscount: matches.some((match) => match.stackWithBundleDiscount === false),
        suppressPrimaryPromo: matches.some((match) => match.stackWithPrimaryPromo === false)
      };
    }

    function ucpClampAddonDiscountRows_(rows, maxTotal) {
      const safeRows = Array.isArray(rows) ? rows : [];
      const cap = Number.isFinite(Number(maxTotal)) && Number(maxTotal) > 0 ? Number(maxTotal) : 0;
      let remaining = cap;
      const appliedRows = [];

      safeRows.forEach((row) => {
        if (!row || remaining <= 0) return;
        const configured = Number(row.discountAmount || 0);
        if (!Number.isFinite(configured) || configured <= 0) return;
        const appliedAmount = Math.min(configured, remaining);
        if (!(appliedAmount > 0)) return;
        remaining -= appliedAmount;
        appliedRows.push({
          ...row,
          configuredDiscountAmount: configured,
          discountAmount: appliedAmount
        });
      });

      return {
        rows: appliedRows,
        total: cap - remaining
      };
    }

    function ucpBuildPendingPickPayloadFromPromoRule_(promo) {
      if (!promo) return null;
      const payload = {};
      const required = Array.isArray(promo.requiredComponents) ? promo.requiredComponents : [];

      required.forEach((req) => {
        if (!req || !req.tab) return;

        const entry = {
          productId: req.productId || "",
          variantId: req.variantId || "",
          qty: Number.isFinite(Number(req.qty)) && Number(req.qty) > 0 ? Number(req.qty) : 1
        };

        if (!entry.productId && !entry.variantId) return;

        if (isMultiTab(req.tab)) {
          payload[req.tab] = payload[req.tab] || [];
          payload[req.tab].push(entry);
          return;
        }

        payload[req.tab] = entry;
      });

      return Object.keys(payload).length ? payload : null;
    }

    function ucpBuildPendingPickPayloadFromActivePromo_() {
      return ucpBuildPendingPickPayloadFromPromoRule_(ucpFindActivePromoRule_());
    }

    function ucpShouldApplyBundleDiscount_() {
      const totals = ucpComputeTotals_();
      return Number(totals.bundleDiscount || 0) > 0;
    }

    // ---------- Fetch ALL bundle rules via Storefront API (optional) ----------
    async function fetchBundleRulesViaStorefront() {
      const token = cfg.storefront_token;
      if (!token) return null;

      const ver = cfg.storefront_api_version || "2024-10";
      const endpoint = `/api/${ver}/graphql.json`;

      const all = [];
      let cursor = null;
      let hasNext = true;
      let guard = 0;

      const query = `
        query BundleRules($first: Int!, $after: String) {
          metaobjects(type: "cpu_motherboard_bundle", first: $first, after: $after) {
            edges {
              node {
                fields { key value }
              }
            }
            pageInfo { hasNextPage endCursor }
          }
        }
      `;

      while (hasNext) {
        guard += 1;
        if (guard > 50) break;

        const variables = { first: 250, after: cursor };

        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Storefront-Access-Token": token
          },
          body: JSON.stringify({ query, variables })
        });

        const ct = (res.headers.get("content-type") || "").toLowerCase();
        const text = await res.text();

        if (!res.ok) {
          throw new Error(`Storefront API HTTP ${res.status}. First 200 chars: ${text.slice(0, 200)}`);
        }

        if (!ct.includes("application/json")) {
          throw new Error(`Storefront API returned non-JSON. First 200 chars: ${text.slice(0, 200)}`);
        }

        const json = JSON.parse(text);
        if (json.errors) {
          throw new Error(`Storefront API errors: ${JSON.stringify(json.errors)}`);
        }

        const mo = json?.data?.metaobjects;
        if (!mo) break;

        for (const edge of mo.edges || []) {
          const fieldsArr = edge?.node?.fields || [];
          const fields = {};
          fieldsArr.forEach((f) => {
            if (f && f.key) fields[f.key] = f.value;
          });

          const isActive = String(fields["is_active"] || "").toLowerCase() === "true";
          if (!isActive) continue;

          const cpuP = fields["cpu_product"] || "";
          const cpuV = fields["cpu_variant"] || "";
          const moboP = fields["motherboard_product"] || "";
          const moboV = fields["motherboard_variant"] || fields["motherboard_varinat"] || "";

          if (!cpuP || !moboP) continue;

          all.push({
            rule_label: fields["rule_label"] || "",
            sort_order: Number(fields["sort_order"] || 0),
            discount_amount: Number(fields["discount_amount"] || 0),
            cpu_product_id: cpuP,
            cpu_variant_id: cpuV || null,
            mobo_product_id: moboP,
            mobo_variant_id: moboV || null
          });
        }

        hasNext = !!mo.pageInfo?.hasNextPage;
        cursor = mo.pageInfo?.endCursor || null;
      }

      return all;
    }

    async function loadBundleRules() {
      if (!cfg.storefront_token || cfg.storefront_token === "A") {
        window.__UCP_PCB_RULES = bundleRules;
        window.__UCP_PCB_RULES_SOURCE = "embedded_or_endpoint_boot";
        return;
      }

      try {
        const fetched = await fetchBundleRulesViaStorefront();
        if (Array.isArray(fetched) && fetched.length) {
          bundleRules = fetched;
          ruleIndex = buildRuleIndex(bundleRules);
          window.__UCP_PCB_RULES = bundleRules;
          window.__UCP_PCB_RULES_SOURCE = "storefront_api";
          return;
        }
      } catch (e) {}

      window.__UCP_PCB_RULES = bundleRules;
      window.__UCP_PCB_RULES_SOURCE = "embedded_or_endpoint_boot";
    }

    // ---------- Variant UI (dynamic for any tab with 2+ variants) ----------
    const variantState = new Map(); // key: `${tab}|${productId}` -> { variantId }

    function variantKey(tab, productId) {
      return `${tab}|${normId(productId)}`;
    }

    function normalizeVariantOptions(v) {
      if (Array.isArray(v?.options)) return v.options.map((x) => String(x));
      const out = [];
      if (v?.option1) out.push(String(v.option1));
      if (v?.option2) out.push(String(v.option2));
      if (v?.option3) out.push(String(v.option3));
      if (out.length) return out;

      const title = String(v?.title || "");
      if (title.includes(" / ")) {
        return title
          .split(" / ")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return [];
    }

    function normalizeImageUrl_(value) {
      if (!value) return "";
      if (typeof value === "string") return value.trim();
      if (typeof value === "object") {
        return String(
          value.src ||
            value.url ||
            value.image ||
            value.preview_image?.src ||
            value.previewImage?.src ||
            value.featured_image?.src ||
            value.featuredImage?.src ||
            ""
        ).trim();
      }
      return "";
    }

    function variantImageUrl_(variant) {
      if (!variant) return "";
      return (
        normalizeImageUrl_(variant.variantImage) ||
        normalizeImageUrl_(variant.variant_image) ||
        normalizeImageUrl_(variant.variant_image_url) ||
        normalizeImageUrl_(variant.variantImageUrl) ||
        normalizeImageUrl_(variant.image) ||
        normalizeImageUrl_(variant.image_url) ||
        normalizeImageUrl_(variant.imageUrl) ||
        normalizeImageUrl_(variant.featured_image) ||
        normalizeImageUrl_(variant.featuredImage) ||
        normalizeImageUrl_(variant.featured_media) ||
        normalizeImageUrl_(variant.featuredMedia)
      );
    }

    function productImageUrl_(product) {
      if (!product) return "";
      const images = Array.isArray(product.images) ? product.images : [];
      return (
        normalizeImageUrl_(product.image) ||
        normalizeImageUrl_(product.image_url) ||
        normalizeImageUrl_(product.imageUrl) ||
        normalizeImageUrl_(images[0])
      );
    }

    function quoteImageForItem_(item, activeVariant) {
      return (
        variantImageUrl_(activeVariant) ||
        variantImageUrl_(item) ||
        productImageUrl_(item)
      );
    }

    function variantsOfProduct(p) {
      const raw = Array.isArray(p?.variants) ? p.variants : [];
      if (raw.length) {
        return raw.map((v) => ({
          id: v.id ?? v.variantId ?? v.variant_id ?? "",
          price: Number(v.price ?? v.price_amount ?? v.price_amount_number ?? 0),
          available: v.available === undefined ? true : !!v.available,
          availability_tier: v.availability_tier ?? v.availabilityTier ?? null,
          lead_time_label: v.lead_time_label ?? v.leadTimeLabel ?? "",
          title: v.title || "",
          image: variantImageUrl_(v),
          options: normalizeVariantOptions(v)
        }));
      }
      return [
        {
          id: p?.variantId ?? "",
          price: Number(p?.price || 0),
          available: p?.available === undefined ? true : !!p.available,
          availability_tier: p?.availability_tier ?? p?.availabilityTier ?? null,
          lead_time_label: p?.lead_time_label ?? p?.leadTimeLabel ?? "",
          title: p?.title || "",
          image: variantImageUrl_(p),
          options: []
        }
      ];
    }

    function optionNamesOfProduct(p) {
      if (Array.isArray(p?.options) && p.options.length && typeof p.options[0] === "object") {
        return p.options.map((o) => String(o?.name || "").trim()).filter(Boolean);
      }

      const names = p?.option_names || p?.optionNames || [];
      if (Array.isArray(names)) return names.map((x) => String(x || "").trim()).filter(Boolean);

      return [];
    }

    function isColorOptionName(name) {
      const n = String(name || "").trim().toLowerCase();
      return n === "color" || n === "colour" || n.includes("color") || n.includes("colour");
    }

    function getOptionMeta(p) {
      const variants = variantsOfProduct(p);
      const names = optionNamesOfProduct(p);

      const meta = [];
      for (let idx = 0; idx < 3; idx++) {
        const vals = variants
          .map((v) => (v.options && v.options[idx] ? String(v.options[idx]).trim() : ""))
          .filter(Boolean);
        const uniq = Array.from(new Set(vals));
        if (uniq.length <= 1) continue;

        const name = names[idx] && String(names[idx]).trim() ? String(names[idx]).trim() : `Option ${idx + 1}`;
        meta.push({ idx, name, values: uniq });
      }
      return meta;
    }

    function getActiveVariant(tab, p) {
      const key = variantKey(tab, p.productId);
      const variants = variantsOfProduct(p);

      const existing = variantState.get(key);
      const existingId = existing?.variantId ? String(existing.variantId) : "";
      const existingHit = existingId && variants.find((x) => normId(x.id) === normId(existingId));
      const productDefaultHit = p?.variantId && variants.find((x) => normId(x.id) === normId(p.variantId));
      const onHandHit = variants.find((x) => ucpProductAvailableNow_(p, x));

      let v =
        (state.availableOnly && existingHit && ucpProductAvailableNow_(p, existingHit) ? existingHit : null) ||
        (state.availableOnly && productDefaultHit && ucpProductAvailableNow_(p, productDefaultHit) ? productDefaultHit : null) ||
        (state.availableOnly ? onHandHit : null) ||
        existingHit ||
        productDefaultHit ||
        variants.find((x) => x.available) ||
        variants[0];

      if (!v) v = variants[0];

      variantState.set(key, { variantId: v?.id || "" });
      return v;
    }

    function sortVariantForProduct_(p) {
      const variants = variantsOfProduct(p);
      if (!variants.length) return null;

      const defaultId = normId(p?.variantId ?? p?.variant_id ?? "");
      if (defaultId) {
        const hit = variants.find((v) => normId(v.id) === defaultId);
        if (hit) return hit;
      }

      return variants[0] || null;
    }

    function sortPriceForProduct_(tab, p) {
      const sortVariant = sortVariantForProduct_(p);
      const price = Number(effectivePriceForDisplay(tab, p, sortVariant) ?? sortVariant?.price ?? p?.price ?? 0);
      return Number.isFinite(price) ? price : 0;
    }

    function setActiveVariant(tab, p, nextVariantId) {
      const key = variantKey(tab, p.productId);
      variantState.set(key, { variantId: nextVariantId });
    }

    function eqOpt(a, b) {
      return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
    }

    function resolveVariantByOption(p, currentVariant, optIdx, nextValue) {
      const variants = variantsOfProduct(p);
      const curOpts =
        currentVariant?.options && currentVariant.options.length
          ? currentVariant.options.slice()
          : normalizeVariantOptions(currentVariant);

      const want = curOpts.slice();
      want[optIdx] = String(nextValue || "");

      const exact = variants.find((v) => {
        const o = v.options || [];
        for (let i = 0; i < 3; i++) {
          if (!want[i] && !o[i]) continue;
          if (want[i] && !eqOpt(want[i], o[i])) return false;
        }
        return true;
      });

      if (state.availableOnly) {
        if (exact && ucpProductAvailableNow_(p, exact)) return exact;
        return variants.find((v) => ucpProductAvailableNow_(p, v) && eqOpt((v.options || [])[optIdx], nextValue)) || null;
      }

      if (exact) return exact;

      const relaxedAny = variants.find((v) => eqOpt((v.options || [])[optIdx], nextValue));
      if (relaxedAny) return relaxedAny;

      return null;
    }

    function shouldShowVariantUI(tab, p) {
      const variants = variantsOfProduct(p);
      const has = variants.length > 1;
      const notDefaultOnly = p?.hasOnlyDefaultVariant === undefined ? true : !p.hasOnlyDefaultVariant;
      const meta = getOptionMeta(p);
      return has && notDefaultOnly && meta.length > 0;
    }

    function colorToCss(c) {
      const s = String(c || "").trim().toLowerCase();
      const map = {
        black: "#111111",
        white: "#f5f5f5",
        silver: "#c0c0c0",
        gray: "#8a8a8a",
        grey: "#8a8a8a",
        red: "#d32f2f",
        blue: "#1976d2",
        green: "#2e7d32",
        pink: "#d81b60",
        purple: "#6a1b9a",
        yellow: "#f9a825",
        orange: "#ef6c00"
      };
      return map[s] || "#bdbdbd";
    }

    // ---------- Pricing helpers (base price = active variant price) ----------
    function ucpProductMatchesDiscountTarget_(tab, p, activeVariant, target) {
      if (!target || !target.tab) return false;
      if (ucpNormalizePromoTab_(tab) !== target.tab) return false;

      const productId = normId(p?.productId || p?.product_id || p?.id || "");
      const variantId = normId(activeVariant?.id ?? p?.variantId ?? p?.variant_id ?? "");
      if (target.productId && productId !== target.productId) return false;
      if (target.variantId && variantId !== target.variantId) return false;
      return !!(target.productId || target.variantId);
    }

    function ucpBundleDiscountPreviewForRow_(tab, p, activeVariant) {
      if (tab !== "motherboard") return 0;
      const cpu = state.picked.processor;
      if (!cpu) return 0;

      const moboAsVariant = {
        productId: p.productId,
        variantId: activeVariant?.id ?? p.variantId
      };

      return bundleDiscountFor(cpu, moboAsVariant);
    }

    function ucpAddonDiscountPreviewRowsForRow_(tab, p, activeVariant) {
      const rawBundleDiscount = currentBundleDiscount();
      const promoState = ucpCurrentPromoState_();
      const rows = [];

      ucpAvailableAddonDiscountRules_().forEach((rule) => {
        if (!ucpAddonRuleUnlocks_(rule, rawBundleDiscount, promoState)) return;

        (rule.discountedTargets || []).forEach((target) => {
          if (!ucpProductMatchesDiscountTarget_(tab, p, activeVariant, target)) return;
          const amount = Number(target.discountAmount || 0);
          if (!(amount > 0)) return;
          rows.push({
            label: ucpAddonDiscountLabel_(rule, target),
            discountAmount: amount
          });
        });
      });

      return rows;
    }

    function ucpPricePreviewForDisplay_(tab, p, activeVariant) {
      const baseRaw = Number(activeVariant?.price ?? p?.price ?? 0);
      const base = Number.isFinite(baseRaw) ? baseRaw : 0;
      const notes = [];
      let discountAmount = 0;

      const bundleDiscount = ucpBundleDiscountPreviewForRow_(tab, p, activeVariant);
      if (bundleDiscount > 0) {
        discountAmount += bundleDiscount;
        notes.push({ kind: "bundle", label: "Bundle save", amount: bundleDiscount });
      }

      const addonRows = ucpAddonDiscountPreviewRowsForRow_(tab, p, activeVariant);
      const addonDiscount = addonRows.reduce((sum, row) => sum + Number(row.discountAmount || 0), 0);
      if (addonDiscount > 0) {
        discountAmount += addonDiscount;
        notes.push({ kind: "addon", label: "Addon save", amount: addonDiscount });
      }

      const effective = Math.max(0, base - Math.min(Math.max(0, discountAmount), base));
      return {
        base,
        effective,
        discountAmount: Math.max(0, base - effective),
        notes
      };
    }

    function effectivePriceForDisplay(tab, p, activeVariant) {
      return ucpPricePreviewForDisplay_(tab, p, activeVariant).effective;
    }

    function discountForDisplay(tab, p, activeVariant) {
      return ucpPricePreviewForDisplay_(tab, p, activeVariant).discountAmount;
    }

    // ---------- Filter sources ----------
    function gpuBrandOf(p) {
      const s = p?.specs || {};
      const chip = Array.isArray(s.gpu_chipset) ? labelOf(s.gpu_chipset[0]) : labelOf(s.gpu_chipset);
      const t = (chip || "").toUpperCase();

      if (t.includes("RTX") || t.includes("GTX")) return "NVIDIA";
      if (t.includes("RX")) return "AMD";
      if (t.includes("ARC")) return "INTEL";

      const v = (p.vendor || "").trim().toUpperCase();
      if (v === "NVIDIA" || v === "AMD" || v === "INTEL") return v;

      return "OTHER";
    }

    function boardPartnerOf(p) {
      const s = p?.specs || {};
      const bp = labelOf(s.gpu_board_partner);
      if (bp) return bp;
      return (p.vendor || "").trim();
    }

    function ssdInterfaceOf(p) {
      const s = p?.specs || {};
      const ff = labelOf(s.m_2_form_factor);
      const title = (p.title || "").toUpperCase();

      if (ff) return "M.2";
      if (title.includes("M.2")) return "M.2";
      if (title.includes("SATA")) return "SATA";
      if (title.includes("2.5") || title.includes('2.5"')) return "SATA";

      return "";
    }

    function wattsOf(p) {
      const s = p?.specs || {};
      const raw = labelOf(s.psu_watts);
      if (!raw) return null;
      const m = String(raw).match(/(\d+)/);
      if (!m) return null;
      return Number(m[1]);
    }

    function coolerTypeOf(p) {
      const s = p?.specs || {};

      const raw =
        labelOf(s.cpu_cooler_type) ||
        labelOf(s.cpu_cooler_types) ||
        labelOf(s.cooler_type) ||
        labelOf(s.cooler_types);

      const u = String(raw || "").trim().toUpperCase();
      if (u) {
        if (u.includes("AIO")) return "AIO";
        if (u.includes("AIR")) return "AIR";
        if (u.includes("LIQUID")) return "AIO";
        if (u.includes("WATER")) return "AIO";
      }

      const radRaw =
        labelOf(s.cooler_radiator_size) ||
        labelOf(s.radiator_size) ||
        labelOf(s.cooler_radiator);

      const m = String(radRaw || "").match(/(\d{2,4})/);
      const rad = m ? Number(m[1]) : 0;
      if (Number.isFinite(rad) && rad >= 240) return "AIO";

      const handleU = String(p?.handle || "").toUpperCase();
      const titleU = String(p?.title || "").toUpperCase();

      const aioNeedles = ["AIO", "LIQUID", "MASTERLIQUID", "WATER", "ATMOS", "KRAKEN", "GALAHAD", "HYDRO"];
      if (aioNeedles.some((n) => handleU.includes(n) || titleU.includes(n))) return "AIO";

      if (/\bLS\d{3}\b/.test(titleU) || /\bLE\d{3}\b/.test(titleU)) return "AIO";
      if (/LS\d{3}/.test(handleU) || /LE\d{3}/.test(handleU)) return "AIO";

      if (/\bML\d{3}\b/.test(titleU) || /\bML\d{3}\b/.test(handleU)) return "AIO";
      if (/\b(240|280|360|420)\b/.test(titleU)) return "AIO";

      return "AIR";
    }

    function caseFormFactorOf(p) {
      const title = (p.title || "").toUpperCase();
      if (title.includes("E-ATX") || title.includes("EATX")) return "eATX";
      if (
        title.includes("M-ATX") ||
        title.includes("MATX") ||
        title.includes("MICRO-ATX") ||
        title.includes("MICRO ATX")
      )
        return "mATX";
      if (title.includes("ITX") || title.includes("MINI-ITX") || title.includes("MINI ITX")) return "ITX";
      if (title.includes("ATX")) return "ATX";
      return "";
    }

    const CASE_SUPPORTED_MOTHERBOARD_ORDER = ["ITX", "ATX", "mATX", "eATX"];

    function normalizeCaseSupportedMotherboardValue(raw) {
      const u = String(labelOf(raw) || "")
        .trim()
        .toUpperCase()
        .replace(/[\s_-]+/g, "");

      if (!u) return "";
      if (u === "ITX" || u === "MINIITX") return "ITX";
      if (u === "ATX") return "ATX";
      if (u === "MATX" || u === "MICROATX") return "mATX";
      if (u === "EATX" || u === "EXTENDEDATX") return "eATX";
      return "";
    }

    function caseSupportedMotherboardsOf(p) {
      const s = p?.specs || {};
      const raw =
        s.supported_motherboard ??
        s.supportedMotherboard ??
        s.case_supported_motherboard ??
        s.caseSupportedMotherboard ??
        null;

      const found = new Set(
        asArray(raw)
          .map(normalizeCaseSupportedMotherboardValue)
          .filter(Boolean)
      );

      const ordered = CASE_SUPPORTED_MOTHERBOARD_ORDER.filter((value) => found.has(value));
      if (ordered.length) return ordered;

      const fallback = caseFormFactorOf(p);
      return fallback ? [fallback] : [];
    }

    function caseGpuSupportOf(p) {
      const s = p?.specs || {};
      const raw = s.gpu_support ?? s.gpuSupport ?? s.case_gpu_support ?? s.caseGpuSupport ?? null;
      if (raw === null || raw === undefined || raw === "") return null;

      const m = String(raw).match(/(\d{2,4})/);
      if (!m) return null;

      const n = Number(m[1]);
      return Number.isFinite(n) && n > 0 ? n : null;
    }

    // ---------- Build dropdown options ----------
    function buildBrandOptions(products) {
      const vendors = uniqSorted(products.map((p) => (p.vendor || "").trim()).filter(Boolean));
      setOptions($brand, vendors);
    }

    function buildSocketOptions(products) {
      const sockets = [];
      products.forEach((p) => {
        asArray(p?.compat?.processor_sockets).forEach((x) => {
          const n = labelOf(x);
          if (n) sockets.push(n);
        });
      });
      setOptions($socket, uniqSorted(sockets));
    }

    function buildMotherboardChipsetOptions(products) {
      const chips = [];
      products.forEach((p) => {
        asArray(p?.specs?.socket_chipset).forEach((x) => {
          const n = labelOf(x);
          if (n) chips.push(n);
        });
      });
      setOptions($chipset, uniqSorted(chips));
    }

    function buildGpuChipsetOptions(products) {
      const chips = [];
      products.forEach((p) => {
        asArray(p?.specs?.gpu_chipset).forEach((x) => {
          const n = labelOf(x);
          if (n) chips.push(n);
        });
      });
      setOptions($chipset, uniqSorted(chips));
    }

    function buildGpuBrandOptions(products) {
      const brands = uniqSorted(products.map(gpuBrandOf).filter(Boolean));
      setOptions($gpuBrand, brands, { allLabel: "All" });
    }

    function buildBoardPartnerOptions(products) {
      const partners = uniqSorted(products.map(boardPartnerOf).filter(Boolean));
      setOptions($boardPartner, partners);
    }

    function buildSsdInterfaceOptions(products) {
      const vals = uniqSorted(products.map(ssdInterfaceOf).filter(Boolean));
      setOptions($formFactor, vals);
    }

    function buildWattsOptions(products) {
      const vals = products.map(wattsOf).filter((v) => typeof v === "number" && !Number.isNaN(v));
      const uniq = Array.from(new Set(vals)).sort((a, b) => a - b);
      setOptions($watts, uniq.map(String), { formatter: (x) => `${x}W` });
    }

    function buildCoolerTypeOptions(products) {
      const vals = uniqSorted(products.map(coolerTypeOf).filter(Boolean));
      setOptions($coolerType, vals, {
        allLabel: "All",
        formatter: (x) => (String(x).toUpperCase() === "AIO" ? "AIO Cooler" : "Air Cooler")
      });
    }

    function buildCaseFormFactorOptions(products) {
      const present = new Set();
      products.forEach((p) => {
        caseSupportedMotherboardsOf(p).forEach((value) => present.add(value));
      });
      const values = CASE_SUPPORTED_MOTHERBOARD_ORDER.filter((value) => present.has(value));
      setOptions($caseFf, values);
    }

    // ---------- Compatibility filter ----------
    function applyCompatibilityFilter(products) {
      let list = products.slice();

      if (state.tab === "motherboard") {
        const cpuSockets = getPickedCpuSockets();
        if (cpuSockets.length) {
          list = list.filter((p) => intersects(p?.compat?.processor_sockets, cpuSockets));
        }
      }

      if (state.tab === "memory") {
        const memTech = getPickedMoboMemTech();
        if (memTech.length) {
          list = list.filter((p) => intersects(p?.compat?.memory_technology, memTech));
        }
      }

      return list;
    }

    // ---------- Price slider (uses active variant price for comparisons) ----------
    function calcMaxPrice(products) {
      let base = applyCompatibilityFilter(products);
      if (state.availableOnly) base = ucpApplyAvailableOnlyFilter_(base);
      let max = 0;
      base.forEach((p) => {
        const av = getActiveVariant(state.tab, p);
        const v = effectivePriceForDisplay(state.tab, p, av);
        if (v > max) max = v;
      });
      const step = 100;
      return Math.ceil(max / step) * step;
    }

    function syncPriceSlider(products, { forceReset = false } = {}) {
      if (!$price || !$priceOut) return;

      const max = calcMaxPrice(products);
      const step = 100;

      $price.min = "0";
      $price.max = String(max);
      $price.step = String(step);

      const prevMax = Number(state.priceMaxByTab[state.tab] || 0);
      const current = Number($price.value || 0);

      const shouldReset = forceReset || current === 0 || current === prevMax || current > max;

      if (shouldReset) $price.value = String(max);

      state.priceMaxByTab[state.tab] = max;
      $priceOut.textContent = moneyPHP(Number($price.value || 0));
    }

    // [UCP][AVAIL_TIER] Effective availability tier for filtering/sorting.
    // Prefer the active variant tier first, then product tier, then derive a fallback from stock/source flags.
    function ucpEffectiveAvailTierInt_(p, av) {
      try {
        const rawTier = (av?.availability_tier ?? av?.availabilityTier ?? p.availability_tier ?? p.availabilityTier ?? null);
        const tierNum = Number(rawTier);
        if (Number.isFinite(tierNum) && tierNum > 0) return tierNum;

        const inStock = !!((av && av.available) || p.available);
        if (inStock) return 1;

        const local = !!(p.local_source_enabled ?? p.localSourceEnabled);
        const overseas = !!(p.overseas_source_enabled ?? p.overseasSourceEnabled);

        if (local) return 2;
        if (overseas) return 3;
        return 9;
      } catch (e) {
        return 9;
      }
    }

    // ---------- Apply filters and sorting ----------
    function applyFiltersAndSort(products) {
      let list = applyCompatibilityFilter(products);
      if (state.availableOnly) {
        list = ucpApplyAvailableOnlyFilter_(list);
      }
      const tabFilters = FILTERS_BY_TAB[state.tab] || {};

      if (tabFilters.brand && $brand) {
        const brand = ($brand.value || "").trim();
        if (brand) list = list.filter((p) => (p.vendor || "").trim() === brand);
      }

      if (tabFilters.socket && $socket) {
        const sock = ($socket.value || "").trim();
        if (sock) list = list.filter((p) => intersects(p?.compat?.processor_sockets, [sock]));
      }

      if (tabFilters.chipset && $chipset) {
        const chip = ($chipset.value || "").trim();
        if (chip) {
          if (state.tab === "motherboard") {
            list = list.filter((p) => intersects(p?.specs?.socket_chipset, [chip]));
          } else if (state.tab === "gpu") {
            list = list.filter((p) => intersects(p?.specs?.gpu_chipset, [chip]));
          }
        }
      }

      if (tabFilters.gpuBrand && $gpuBrand) {
        const b = ($gpuBrand.value || "").trim();
        if (b) list = list.filter((p) => gpuBrandOf(p) === b);
      }

      if (tabFilters.boardPartner && $boardPartner) {
        const bp = ($boardPartner.value || "").trim();
        if (bp) list = list.filter((p) => boardPartnerOf(p) === bp);
      }

      if (tabFilters.formFactor && $formFactor) {
        const v = ($formFactor.value || "").trim();
        if (v) list = list.filter((p) => ssdInterfaceOf(p) === v);
      }

      if (tabFilters.watts && $watts) {
        const w = Number($watts.value || "");
        if (!Number.isNaN(w) && $watts.value !== "") {
          list = list.filter((p) => wattsOf(p) === w);
        }
      }

      if (tabFilters.coolerType && $coolerType) {
        let t = ($coolerType.value || "").trim().toUpperCase();
        if (t) {
          if (t.includes("AIO")) t = "AIO";
          else if (t.includes("AIR")) t = "AIR";
          list = list.filter((p) => coolerTypeOf(p) === t);
        }
      }

      if (tabFilters.caseFf && $caseFf) {
        const cf = ($caseFf.value || "").trim();
        if (cf) list = list.filter((p) => caseSupportedMotherboardsOf(p).includes(cf));
      }

      if (tabFilters.price && $price) {
        const cap = Number($price.value || 0);
        if (!Number.isNaN(cap) && cap > 0) {
          list = list.filter((p) => {
            const av = getActiveVariant(state.tab, p);
            return effectivePriceForDisplay(state.tab, p, av) <= cap;
          });
        }
      }

      const sortMode = getSortMode(state.tab);

      if (sortMode === SORT_MODES.RECOMMENDED && state.tab === "memory") {
        list.sort((a, b) => {
          const ac = Number(a?.specs?.ram_cas_latency ?? 9999);
          const bc = Number(b?.specs?.ram_cas_latency ?? 9999);
          if (ac !== bc) return ac - bc;

          return sortPriceForProduct_(state.tab, a) - sortPriceForProduct_(state.tab, b);
        });
        return list;
      }

      if (sortMode === SORT_MODES.PRICE_ASC || sortMode === SORT_MODES.PRICE_DESC) {
        const dir = sortMode === SORT_MODES.PRICE_ASC ? 1 : -1;

        const decorated = list.map((p, idx) => {
          const price = sortPriceForProduct_(state.tab, p);
          return { p, idx, price };
        });

        decorated.sort((A, B) => {
          if (A.price !== B.price) return dir * (A.price - B.price);
          return A.idx - B.idx;
        });

        return decorated.map((x) => x.p);
      }

      list.sort((a, b) => {
        const avA = getActiveVariant(state.tab, a);
        const avB = getActiveVariant(state.tab, b);

        const tA = ucpEffectiveAvailTierInt_(a, avA);
        const tB = ucpEffectiveAvailTierInt_(b, avB);
        if (tA !== tB) return tA - tB;

        // Keep sort position stable while users switch variants; displayed prices can still update per variant.
        const pA = sortPriceForProduct_(state.tab, a);
        const pB = sortPriceForProduct_(state.tab, b);
        if (pA !== pB) return pA - pB;

        // Stable tie breaker.
        const idA = String(a.productId ?? a.id ?? "");
        const idB = String(b.productId ?? b.id ?? "");
        if (idA && idB && idA !== idB) return idA.localeCompare(idB);

        const titleA = String(a.title ?? "");
        const titleB = String(b.title ?? "");
        return titleA.localeCompare(titleB);
      });

      return list;
    }

    function renderHead() {
      const thead = root.querySelector(".ucp-pcb__thead");
      if (!thead || !$head) return;

      if (isMobile()) {
        thead.style.gridTemplateColumns = "";
        $head.innerHTML = "";
        return;
      }

      const cols = COLS[state.tab] || COLS.processor;
      thead.style.gridTemplateColumns = "1.6fr repeat(4, .9fr) .9fr 120px";

      const mode = getSortMode(state.tab);
      const icon = priceSortIcon(mode);
      const title = priceSortTitle(mode);

      $head.innerHTML =
        cols
          .map((c, idx) => {
            const isPriceCol = idx === cols.length - 1 && String(c).trim().toLowerCase() === "price";
            const isPsuTierCol = state.tab === "powersupply" && idx === 3;

            if (isPsuTierCol) {
              return `
                <div>
                  <a
                    href="${escapeHtml(SPL_PSU_TIER_LIST_URL)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="color:inherit;text-decoration:underline;text-underline-offset:2px;"
                  >${escapeHtml(c)}</a>
                </div>
              `.trim();
            }

            if (!isPriceCol) return `<div>${escapeHtml(c)}</div>`;

            return `
            <div>
              <button
                type="button"
                id="ucp-pcb-sort-price"
                class="ucp-pcb__sortBtn ${mode !== SORT_MODES.RECOMMENDED ? "is-active" : ""}"
                data-sort-mode="${escapeHtml(mode)}"
                title="${escapeHtml(title)}"
                aria-label="${escapeHtml(title)}"
                style="all:unset; cursor:pointer; display:inline-flex; align-items:center; gap:6px; user-select:none; white-space:nowrap;"
              >
                <span>Price</span>
                <span class="ucp-pcb__sortIcon" aria-hidden="true" style="opacity:${mode === SORT_MODES.RECOMMENDED ? "0.55" : "1"};">
                  ${escapeHtml(icon)}
                </span>
              </button>
            </div>
          `.trim();
          })
          .join("") + `<div></div>`;
    }

    function valOrDash(v, suffix = "") {
      if (v === null || v === undefined || v === "") return "-";
      return `${v}${suffix}`;
    }

    function fmtClockPair(a, aSuffix, b, bSuffix) {
      const A = a === null || a === undefined || a === "" ? "" : `${a}${aSuffix}`;
      const B = b === null || b === undefined || b === "" ? "" : `${b}${bSuffix}`;
      if (!A && !B) return "-";
      if (A && B) return `${A} / ${B}`;
      return A || B;
    }

    function fmtReadWrite(read, write) {
      const r = read === null || read === undefined || read === "" ? "" : `${read} MB/s`;
      const w = write === null || write === undefined || write === "" ? "" : `${write} MB/s`;
      if (!r && !w) return "-";
      if (r && w) return `${r} / ${w}`;
      return r || w;
    }

    function fmtGen(v) {
      if (v === null || v === undefined || v === "") return "-";
      const s = String(v).trim();
      if (!s) return "-";
      const n = Number(s);
      if (!Number.isNaN(n)) return `Gen ${n}`;
      return s;
    }

    function rowCells(p) {
      const s = p.specs || {};

      if (state.tab === "processor") {
        const socket =
          p.compat?.processor_sockets && p.compat.processor_sockets[0] ? labelOf(p.compat.processor_sockets[0]) : "-";
        const ct =
          s.cpu_core_count || s.cpu_thread_count ? `${valOrDash(s.cpu_core_count)}C / ${valOrDash(s.cpu_thread_count)}T` : "-";
        const clocks = fmtClockPair(s.cpu_base_clock, " GHz", s.cpu_boost_clock, " GHz");
        const tdp = s.tdp === null || s.tdp === undefined || s.tdp === "" ? "-" : `${s.tdp} W`;
        return [socket, ct, clocks, tdp];
      }

      if (state.tab === "motherboard") {
        const chip = Array.isArray(s.socket_chipset) ? labelOf(s.socket_chipset[0]) || "-" : labelOf(s.socket_chipset) || "-";
        const ramSlots = valOrDash(s.ram_slots);
        const wifi = valOrDash(s.motherboard_wifi);
        const m2 = valOrDash(s.m_2_slots);
        return [chip, ramSlots, wifi, m2];
      }

      if (state.tab === "gpu") {
        const chip = Array.isArray(s.gpu_chipset) ? labelOf(s.gpu_chipset[0]) || "-" : labelOf(s.gpu_chipset) || "-";
        const vram = s.gpu_vram === null || s.gpu_vram === undefined || s.gpu_vram === "" ? "-" : `${s.gpu_vram} GB`;
        const clocks = fmtClockPair(s.gpu_core_clock, " MHz", s.gpu_boost_clock, " MHz");
        const len = s.gpu_length === null || s.gpu_length === undefined || s.gpu_length === "" ? "-" : `${s.gpu_length} mm`;
        return [chip, vram, clocks, len];
      }

      if (state.tab === "memory") {
        const memType =
          p.compat?.memory_technology && p.compat.memory_technology[0] ? labelOf(p.compat.memory_technology[0]) : "-";
        const speed = valOrDash(s.ram_speed, " MHz");
        const modules = s.ram_module_capacity && s.ram_module_count ? `${s.ram_module_count} x ${s.ram_module_capacity}GB` : "-";
        const cas = s.ram_cas_latency ? `CL${s.ram_cas_latency}` : "-";
        return [memType, speed, modules, cas];
      }

      if (state.tab === "ssd") {
        const di = ssdInterfaceOf(p) || "-";
        const rw = fmtReadWrite(s.read_mbps, s.write_mbps);
        const gen = fmtGen(s.pcie_generation);
        const blank = "-";
        return [di, rw, gen, blank];
      }

      if (state.tab === "powersupply") {
        const w = wattsOf(p);
        const watts = typeof w === "number" && !Number.isNaN(w) ? `${w} W` : "-";
        const cert = valOrDash(s.psu_certification);
        const tier = valOrDash(labelOf(s.psu_tier));
        const mod = valOrDash(s.psu_modularity);
        return [watts, cert, tier, mod];
      }

      if (state.tab === "cpucooler") {
        const radRaw = s.cooler_radiator_size ?? s.coolerRadiatorSize ?? s.radiator_size ?? s.radiatorSize ?? null;
        const heightRaw = s.cooler_height ?? s.coolerHeight ?? s.cpu_cooler_height ?? s.cpuCoolerHeight ?? null;

        const radNum = radRaw === null || radRaw === undefined || radRaw === "" ? null : Number(radRaw);
        const heightNum = heightRaw === null || heightRaw === undefined || heightRaw === "" ? null : Number(heightRaw);

        const rad = Number.isFinite(radNum) && radNum > 0 ? `${radNum} mm` : "-";
        const height = Number.isFinite(heightNum) && heightNum > 0 ? `${heightNum} mm` : "-";

        const temps = valOrDash(s.cooler_full_load_temp, "°C");
        const blank = "-";
        return [rad, height, temps, blank];
      }

      if (state.tab === "case") {
        const supportedBoards = caseSupportedMotherboardsOf(p);
        const boards = supportedBoards.length ? supportedBoards.join(", ") : "-";
        const gpuSupport = caseGpuSupportOf(p);
        const gpu = Number.isFinite(gpuSupport) ? `${gpuSupport} mm` : "-";
        return [boards, gpu, "-", "-"];
      }

      return ["-", "-", "-", "-"];
    }

    function emptyMessageForTab(products, compatibleProducts, availableProducts) {
      const compatible = Array.isArray(compatibleProducts) ? compatibleProducts : applyCompatibilityFilter(products || []);
      if (!compatible.length && state.tab === "motherboard") {
        const cpuSockets = getPickedCpuSockets();
        if (cpuSockets.length) {
          return `No compatible motherboards found for CPU socket: ${cpuSockets.join(", ")}.`;
        }
      }
      if (!compatible.length && state.tab === "memory") {
        const memTech = getPickedMoboMemTech();
        if (memTech.length) {
          return `No compatible RAM found for memory type: ${memTech.join(", ")}.`;
        }
      }
      const available = Array.isArray(availableProducts) ? availableProducts : compatible;
      if (state.availableOnly && compatible.length && !available.length) {
        return "No on-hand items found in this category right now.";
      }
      return "No products found.";
    }

    function isPickedVariant(tab, p, activeVariant) {
      const picked = state.picked[tab];
      if (!picked) return false;

      const pid = normId(p.productId);
      const vid = normId(activeVariant?.id ?? "");

      if (Array.isArray(picked)) {
        return picked.some((it) => normId(it?.productId) === pid && normId(it?.variantId) === vid);
      }

      return normId(picked.productId) === pid && normId(picked.variantId) === vid;
    }

    function ucpReadFirstString_(obj, paths) {
      for (const path of paths) {
        try {
          const parts = String(path).split(".");
          let cur = obj;
          for (const part of parts) {
            if (!cur) break;
            cur = cur[part];
          }
          const s = cur === null || cur === undefined ? "" : String(cur).trim();
          if (s) return s;
        } catch (e) {}
      }
      return "";
    }

    function ucpBenchCpuHandle_(p) {
      return ucpReadFirstString_(p, [
        "bench_cpu_handle",
        "benchCpuHandle",
        "bench.cpu_handle",
        "metafields.custom.bench_cpu_handle",
        "metafields.custom.bench_cpu_handle.value",
        "specs.bench_cpu_handle",
        "specs.benchCpuHandle"
      ]);
    }

    function ucpBenchGpuHandle_(p) {
      return ucpReadFirstString_(p, [
        "bench_gpu_handle",
        "benchGpuHandle",
        "bench.gpu_handle",
        "metafields.custom.bench_gpu_handle",
        "metafields.custom.bench_gpu_handle.value",
        "specs.bench_gpu_handle",
        "specs.benchGpuHandle"
      ]);
    }

    function buildPickedItemFromActiveVariant(tab, p, activeVariant) {
      const vId = activeVariant?.id ?? p.variantId ?? "";
      const vPrice = Number(activeVariant?.price ?? p.price ?? 0);
      const variantImage = variantImageUrl_(activeVariant);

      const out = { ...p, variantId: vId, price: vPrice };
      if (variantImage) {
        out.variantImage = variantImage;
        out.variant_image = variantImage;
      }

      if (tab === "processor") {
        const b = ucpBenchCpuHandle_(p);
        if (b) out.bench_cpu_handle = b;
      }

      if (tab === "gpu") {
        const b = ucpBenchGpuHandle_(p);
        if (b) out.bench_gpu_handle = b;
      }

      return out;
    }

    function priceHtmlForRow(tab, p, activeVariant) {
      const preview = ucpPricePreviewForDisplay_(tab, p, activeVariant);
      const base = preview.base;
      const eff = preview.effective;

      if (preview.discountAmount > 0 && eff !== base) {
        const notesHtml = preview.notes
          .map((note) => {
            const label = String(note?.label || "Save").trim();
            const amount = Number(note?.amount || 0);
            if (!(amount > 0)) return "";
            return `<small class="ucp-pcb__bundleNote">${escapeHtml(label)} ${moneyPHP(amount)}</small>`;
          })
          .filter(Boolean)
          .join("");
        return `
          <div class="ucp-pcb__priceCell">
            <div><s style="opacity:.55">${moneyPHP(base)}</s> <strong>${moneyPHP(eff)}</strong></div>
            ${notesHtml}
          </div>
        `;
      }

      return `<strong>${moneyPHP(eff)}</strong>`;
    }

    function variantStripHtml(tab, p, activeVariant) {
      if (!shouldShowVariantUI(tab, p)) return "";

      const meta = getOptionMeta(p);
      if (!meta.length) return "";

      const curOpts =
        activeVariant?.options && activeVariant.options.length ? activeVariant.options : normalizeVariantOptions(activeVariant);

      const pid = normId(p.productId);

      const lines = meta
        .map((opt) => {
          const activeVal = String(curOpts[opt.idx] || "").trim();

          if (isColorOptionName(opt.name)) {
            const sw = opt.values
              .map((v) => {
                const isActive = eqOpt(v, activeVal);
                const next = resolveVariantByOption(p, activeVariant, opt.idx, v);
                const isSelectable = !!next;
                return `
                  <button type="button"
                          class="ucp-pcb__varSwatch ${isActive ? "is-active" : ""} ${isSelectable ? "" : "is-disabled"}"
                          data-variant-opt-index="${escapeHtml(String(opt.idx))}"
                          data-variant-opt-value="${escapeHtml(String(v))}"
                          data-product-id="${escapeHtml(pid)}"
                          aria-label="${escapeHtml(opt.name)} ${escapeHtml(String(v))}"
                          title="${escapeHtml(String(v))}"
                          ${isSelectable ? "" : "disabled"}>
                    <span style="background:${escapeHtml(colorToCss(v))}"></span>
                  </button>
                `;
              })
              .join("");

            return `
              <div class="ucp-pcb__variantLine">
                <div class="ucp-pcb__variantLabel">${escapeHtml(opt.name)}</div>
                <div class="ucp-pcb__variantSwatches">${sw}</div>
              </div>
            `;
          }

          const pills = opt.values
            .map((v) => {
              const isActive = eqOpt(v, activeVal);
              const next = resolveVariantByOption(p, activeVariant, opt.idx, v);
              const isSelectable = !!next;
              return `
                <button type="button"
                        class="ucp-pcb__varPill ${isActive ? "is-active" : ""} ${isSelectable ? "" : "is-disabled"}"
                        data-variant-opt-index="${escapeHtml(String(opt.idx))}"
                        data-variant-opt-value="${escapeHtml(String(v))}"
                        data-product-id="${escapeHtml(pid)}"
                        ${isSelectable ? "" : "disabled"}>
                  ${escapeHtml(String(v))}
                </button>
              `;
            })
            .join("");

          return `
            <div class="ucp-pcb__variantLine">
              <div class="ucp-pcb__variantLabel">${escapeHtml(opt.name)}</div>
              <div class="ucp-pcb__variantPills">${pills}</div>
            </div>
          `;
        })
        .join("");

      return `
        <div class="ucp-pcb__variantStrip" data-variant-strip="1" data-product-id="${escapeHtml(pid)}">
          ${lines}
        </div>
      `;
    }

    function mobileSpecGridHtml(tab, p) {
      const cols = COLS[tab] || COLS.processor;
      const labels = [cols[1], cols[2], cols[3], cols[4]];
      const values = rowCells(p);

      const pairs = [];
      for (let i = 0; i < 4; i++) {
        const val = String(values[i] ?? "-");
        if (!val || val.trim() === "-") continue;
        const label = labels[i] || "";
        pairs.push({ label, val });
      }

      if (!pairs.length) return "";

      return `
        <div class="ucp-pcb__cardSpecs">
          ${pairs
            .slice(0, 4)
            .map(
              (x) => `
            <div class="ucp-pcb__cardSpec">
              <div class="k">${escapeHtml(x.label)}</div>
              <div class="v">${escapeHtml(x.val)}</div>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    }

    // ---------- Rows renderer ----------
  function renderRows(products) {
    syncPriceSlider(products, { forceReset: false });
    const compatible = applyCompatibilityFilter(products);
    const availableCompatible = state.availableOnly ? ucpApplyAvailableOnlyFilter_(compatible) : compatible.slice();
    const filtered = applyFiltersAndSort(products);

    if (!filtered.length) {
      safeInnerHtml(
        $body,
        `<div class="ucp-pcb__loading">${escapeHtml(emptyMessageForTab(products, compatible, availableCompatible))}</div>`
      );
      return;
    }

    const mobile = isMobile();

    if (mobile) {
      safeInnerHtml(
        $body,
        filtered
          .map((p) => {
            const av = getActiveVariant(state.tab, p);
            const selected = isPickedVariant(state.tab, p, av);
            const availableNow = ucpProductAvailableNow_(p, av);
            const canPickNow = !state.availableOnly || availableNow;

            const vendor = ((p.vendor || "") + "").trim();
            const leadTimeHtml = ucpLeadTimeHtmlForProduct_(p, av); // [UCP][AVAIL_TIER]

            const pricePreview = ucpPricePreviewForDisplay_(state.tab, p, av);
            const base = pricePreview.base;
            const eff = pricePreview.effective;

            const priceHtml =
              pricePreview.discountAmount > 0 && eff !== base
                ? `
                  <div class="p">
                    <span class="was"><s style="opacity:.55">${moneyPHP(base)}</s></span>
                    <span class="now" style="font-weight:800;">${moneyPHP(eff)}</span>
                    ${pricePreview.notes
                      .map((note) => {
                        const label = String(note?.label || "Save").trim();
                        const amount = Number(note?.amount || 0);
                        if (!(amount > 0)) return "";
                        return `<div class="ucp-pcb__bundleNote">${escapeHtml(label)} ${moneyPHP(amount)}</div>`;
                      })
                      .filter(Boolean)
                      .join("")}
                  </div>
                `
                : `
                  <div class="p">
                    <span class="now">${moneyPHP(eff)}</span>
                  </div>
                `;

            const pid = normId(p.productId);

            return `
              <div class="ucp-pcb__card ${selected ? "is-selected" : ""}" data-product-id="${escapeHtml(pid)}" data-unavailable="${availableNow ? "0" : "1"}">
                <div class="ucp-pcb__cardTop">
                  <div class="ucp-pcb__thumb">${p.image ? `<img src="${escapeHtml(p.image)}" alt="">` : ""}</div>
                  <div class="ucp-pcb__cardTitle">
                    <div class="t"><strong>${escapeHtml(p.title || "")}</strong></div>
                    ${vendor ? `<div class="b">${escapeHtml(vendor)}</div>` : ""}
                    ${priceHtml}
                    ${leadTimeHtml ? `<!-- [UCP][AVAIL_TIER] -->${leadTimeHtml}` : ""}
                  </div>
                </div>

                ${variantStripHtml(state.tab, p, av)}

                ${mobileSpecGridHtml(state.tab, p)}

                <div class="ucp-pcb__cardBottom">
                  <button class="ucp-pcb__select ucp-pcb__select--card ${selected ? "is-selected" : ""} ${canPickNow ? "" : "is-unavailable"}"
                          data-pick="${escapeHtml(state.tab)}"
                          data-product="${escapeHtml(pid)}"
                          data-variant="${escapeHtml(normId(av?.id ?? ""))}"
                          ${canPickNow ? "" : "disabled"}>
                    ${canPickNow
                      ? (isMultiTab(state.tab)
                        ? (selected ? "Add another" : "Add to build")
                        : (selected ? "Selected" : "Add to build"))
                      : "Unavailable now"}
                  </button>
                </div>
              </div>
            `;
          })
          .join("")
      );

      return;
    }

    const cols = COLS[state.tab] || COLS.processor;
    const specLabels = [cols[1], cols[2], cols[3], cols[4]];

    function isEmptyCell(v) {
      const s = v === null || v === undefined ? "" : String(v).trim();
      return !s || s === "-";
    }

    function specCell(i, value) {
      const v = value === null || value === undefined ? "-" : String(value);
      const empty = isEmptyCell(v) ? 1 : 0;
      const label = specLabels[i] || "";

      return `
        <div class="ucp-pcb__cell ucp-pcb__cell--spec" data-empty="${empty}">
          <div class="ucp-pcb__specLabel">${escapeHtml(label)}</div>
          <div class="ucp-pcb__specValue">${escapeHtml(v)}</div>
        </div>
      `;
    }

    safeInnerHtml(
      $body,
      filtered
        .map((p) => {
          const av = getActiveVariant(state.tab, p);
          const selected = isPickedVariant(state.tab, p, av);
          const availableNow = ucpProductAvailableNow_(p, av);
          const canPickNow = !state.availableOnly || availableNow;

          const cells = rowCells(p);
          const vendor = ((p.vendor || "") + "").trim();
          const firstSpec = !isEmptyCell(cells[0]) ? String(cells[0]).trim() : "";
          const meta = vendor && firstSpec ? `${vendor} · ${firstSpec}` : vendor || firstSpec;

          const leadTimeHtml = ucpLeadTimeHtmlForProduct_(p, av); // [UCP][AVAIL_TIER]

          const priceHtml = priceHtmlForRow(state.tab, p, av);
          const pid = normId(p.productId);

          return `
            <div class="ucp-pcb__row ${selected ? "is-selected" : ""}"
                data-product-id="${escapeHtml(pid)}"
                data-unavailable="${availableNow ? "0" : "1"}">
              <div class="ucp-pcb__rowTitle">
                <div class="ucp-pcb__thumb">${p.image ? `<img src="${escapeHtml(p.image)}" alt="">` : ""}</div>
                <div style="min-width:0;">
                  <div><strong>${escapeHtml(p.title || "")}</strong></div>
                  <small class="ucp-pcb__rowVendor">${escapeHtml(p.vendor || "")}</small>
                  ${meta ? `<small class="ucp-pcb__rowMeta">${escapeHtml(meta)}</small>` : ""}
                  ${leadTimeHtml ? `<!-- [UCP][AVAIL_TIER] -->${leadTimeHtml}` : ""}

                  ${variantStripHtml(state.tab, p, av)}
                </div>
              </div>

              ${specCell(0, cells[0])}
              ${specCell(1, cells[1])}
              ${specCell(2, cells[2])}
              ${specCell(3, cells[3])}

              <div class="ucp-pcb__cell ucp-pcb__cell--price">${priceHtml}</div>

              <button class="ucp-pcb__select ${selected ? "is-selected" : ""} ${canPickNow ? "" : "is-unavailable"}"
                      data-pick="${escapeHtml(state.tab)}"
                      data-product="${escapeHtml(pid)}"
                      data-variant="${escapeHtml(normId(av?.id ?? ""))}"
                      ${canPickNow ? "" : "disabled"}>
                ${canPickNow
                  ? (isMultiTab(state.tab) ? (selected ? "Add another" : "Add") : (selected ? "Selected" : "Select"))
                  : "Unavailable now"}
              </button>
            </div>
          `;
        })
        .join("")
    );

    if (typeof window.__UCP_PCB_MEASURE_TABS === "function") {
      requestAnimationFrame(() => window.__UCP_PCB_MEASURE_TABS());
    }
  }


    function renderPicked() {
      if (!$picked) return;

      const order = [
        ["processor", "CPU"],
        ["motherboard", "Motherboard"],
        ["memory", "RAM"],
        ["cpucooler", "CPU Cooler"],
        ["gpu", "GPU"],
        ["ssd", "SSD"],
        ["powersupply", "Power Supply"],
        ["case", "Case"],
        ["casefans", "Case Fans"],
        ["other", "Other"]
      ];

      $picked.innerHTML = order
        .map(([k, label]) => {
          const v = state.picked?.[k];

          if (isMultiTab(k)) {
            const list = pickedList(k);

            if (!list.length) {
              return `
                <div class="ucp-pcb__pickedItem" data-picked-tab="${escapeHtml(k)}" data-empty="1">
                  <div class="ucp-pcb__pickedLabel"><strong>${escapeHtml(label)}</strong></div>
                  <button class="ucp-pcb__pickedRemove" type="button" aria-label="Remove ${escapeHtml(label)} from build" data-remove-picked="${escapeHtml(k)}">×</button>
                  <div class="ucp-pcb__pickedSelection"><small>Not selected</small></div>
                  <div class="ucp-pcb__pickedPrice">-</div>
                </div>
              `.trim();
            }

            const linesHtml = list
              .map((it, idx) => {
                const q = Number(it?.qty || 1);
                const qtyLabel = q > 1 ? ` ×${q}` : "";
                return `
                  <div class="ucp-pcb__pickedSubItem" style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
                    <small>${escapeHtml(it?.title || "")}${escapeHtml(qtyLabel)}</small>
                    <button
                      type="button"
                      class="ucp-pcb__pickedRemove ucp-pcb__pickedRemove--line"
                      aria-label="Remove item from ${escapeHtml(label)}"
                      data-remove-picked="${escapeHtml(k)}"
                      data-remove-idx="${escapeHtml(String(idx))}"
                      style="width:24px; height:24px; border-radius:999px; line-height:1; display:inline-flex; align-items:center; justify-content:center;"
                    >×</button>
                  </div>
                `.trim();
              })
              .join("");

            const sum = list.reduce((s, it) => s + Number(it?.price || 0) * Number(it?.qty || 1), 0);

            return `
              <div class="ucp-pcb__pickedItem" data-picked-tab="${escapeHtml(k)}" data-empty="0">
                <div class="ucp-pcb__pickedLabel"><strong>${escapeHtml(label)}</strong></div>
                <button class="ucp-pcb__pickedRemove" type="button" aria-label="Remove ${escapeHtml(label)} from build" data-remove-picked="${escapeHtml(k)}">×</button>
                <div class="ucp-pcb__pickedSelection">${linesHtml}</div>
                <div class="ucp-pcb__pickedPrice">${moneyPHP(sum)}</div>
              </div>
            `.trim();
          }

          if (!v) {
            return `
              <div class="ucp-pcb__pickedItem" data-picked-tab="${escapeHtml(k)}" data-empty="1">
                <div class="ucp-pcb__pickedLabel"><strong>${escapeHtml(label)}</strong></div>
                <button class="ucp-pcb__pickedRemove" type="button" aria-label="Remove ${escapeHtml(label)} from build" data-remove-picked="${escapeHtml(k)}">×</button>
                <div class="ucp-pcb__pickedSelection"><small>Not selected</small></div>
                <div class="ucp-pcb__pickedPrice">-</div>
              </div>
            `.trim();
          }

          return `
            <div class="ucp-pcb__pickedItem" data-picked-tab="${escapeHtml(k)}" data-empty="0">
              <div class="ucp-pcb__pickedLabel"><strong>${escapeHtml(label)}</strong></div>
              <button class="ucp-pcb__pickedRemove" type="button" aria-label="Remove ${escapeHtml(label)} from build" data-remove-picked="${escapeHtml(k)}">×</button>
              <div class="ucp-pcb__pickedSelection"><small>${escapeHtml(v.title || "")}</small></div>
              <div class="ucp-pcb__pickedPrice">${moneyPHP(v.price)}</div>
            </div>
          `.trim();
        })
        .join("");

      const totals = ucpComputeTotals_();
      const payableSubtotalText = moneyPHP(totals.payableSubtotal);

      safeSetText($subtotalRaw, moneyPHP(totals.rawSubtotal));
      safeSetText($savings, moneyPHP(totals.bundleDiscount));
      safeSetText($manualOff, moneyPHP(totals.manualOff));
      safeSetText($promoLabel, totals.promoLabel ? `${totals.promoLabel}` : "Promo discount");
      safeSetText($promoSavings, moneyPHP(totals.promoDiscount));
      ucpRenderAddonDiscountRows_(totals.addonDiscountRows);
      safeSetText($subtotal, payableSubtotalText);
      safeSetText($desktopDockSubtotal, payableSubtotalText);
      safeSetHidden($manualOffRow, !(totals.manualOff > 0));
      safeSetHidden($promoRow, !(totals.promoDiscount > 0));

      const count = pickedLineCount();
      safeSetText($mobileCount, String(count));
      safeSetText($mobileSavings, moneyPHP(totals.bundleDiscount + totals.promoDiscount + totals.addonDiscountTotal));
      safeSetText($mobileSubtotal, payableSubtotalText);
      queueDesktopDockSync_();

      if (PERF_ENABLED) ucpPerfStickyUpdate_();
      else {
        const perfEl = root.querySelector("#ucp-pcb-perf-sticky");
        if (perfEl) perfEl.remove();
      }
    }

    function isMoboCompatibleWithCpu(mobo, cpu) {
      const cpuSockets = asArray(cpu?.compat?.processor_sockets);
      const moboSockets = asArray(mobo?.compat?.processor_sockets);
      if (!cpuSockets.length || !moboSockets.length) return true;
      return intersects(moboSockets, cpuSockets);
    }

    function isRamCompatibleWithMobo(ram, mobo) {
      const list = Array.isArray(ram) ? ram : ram ? [ram] : [];
      if (!list.length) return true;

      const moboMem = asArray(mobo?.compat?.memory_technology);
      if (!moboMem.length) return true;

      return list.every((item) => {
        const ramMem = asArray(item?.compat?.memory_technology);
        if (!ramMem.length) return true;
        return intersects(ramMem, moboMem);
      });
    }

    function enforceDependencies(changedTab) {
      let changed = false;

      if (changedTab === "processor") {
        const cpu = state.picked.processor;
        const mobo = state.picked.motherboard;

        if (cpu && mobo && !isMoboCompatibleWithCpu(mobo, cpu)) {
          delete state.picked.motherboard;
          delete state.picked.memory;
          changed = true;
        }
      }

      if (changedTab === "motherboard") {
        const mobo = state.picked.motherboard;
        const ram = state.picked.memory;

        if (mobo && ram && !isRamCompatibleWithMobo(ram, mobo)) {
          delete state.picked.memory;
          showBuilderNotice("RAM selection was cleared because it is not compatible with the selected motherboard.");
          changed = true;
        } else if (mobo && ram && !ucpMemorySelectionFitsSlots_(ram, mobo)) {
          delete state.picked.memory;
          showBuilderNotice("RAM selection was cleared because it exceeds the motherboard RAM slot limit.");
          changed = true;
        }
      }

      if (changed) ucpHandleBuildChanged_();
    }

    function showFiltersForTab(tab) {
      const f = FILTERS_BY_TAB[tab] || {};

      safeSetHidden($brandWrap, !f.brand);
      safeSetHidden($socketWrap, !f.socket);
      safeSetHidden($chipsetWrap, !f.chipset);
      safeSetHidden($gpuBrandWrap, !f.gpuBrand);
      safeSetHidden($boardPartnerWrap, !f.boardPartner);
      safeSetHidden($formFactorWrap, !f.formFactor);
      safeSetHidden($wattsWrap, !f.watts);
      safeSetHidden($coolerTypeWrap, !f.coolerType);
      safeSetHidden($caseFfWrap, !f.caseFf);
      safeSetHidden($priceWrap, !f.price);
      safeSetHidden($availableOnlyWrap, !AVAILABILITY_FILTER_ENABLED);

      if (tab === "motherboard") safeSetText($chipsetLabel, "Chipset");
      if (tab === "gpu") safeSetText($chipsetLabel, "Chipsets");
    }

    function resetFilterValues() {
      if ($brand) $brand.value = "";
      if ($socket) $socket.value = "";
      if ($chipset) $chipset.value = "";
      if ($gpuBrand) $gpuBrand.value = "";
      if ($boardPartner) $boardPartner.value = "";
      if ($formFactor) $formFactor.value = "";
      if ($watts) $watts.value = "";
      if ($coolerType) $coolerType.value = "";
      if ($caseFf) $caseFf.value = "";
    }

    function buildFiltersForTab(tab, products) {
      if ((FILTERS_BY_TAB[tab] || {}).brand) buildBrandOptions(products);

      if (tab === "processor") buildSocketOptions(products);
      if (tab === "motherboard") buildMotherboardChipsetOptions(products);

      if (tab === "gpu") {
        buildGpuBrandOptions(products);
        buildGpuChipsetOptions(products);
        buildBoardPartnerOptions(products);
      }

      if (tab === "ssd") buildSsdInterfaceOptions(products);
      if (tab === "powersupply") buildWattsOptions(products);
      if (tab === "cpucooler") buildCoolerTypeOptions(products);
      if (tab === "case") buildCaseFormFactorOptions(products);
    }

    function getStickyHeaderOffset_() {
      const candidates = [
        document.querySelector("sticky-header"),
        document.querySelector(".shopify-section-group-header-group"),
        document.querySelector('[id^="shopify-section-header"]'),
        document.querySelector(".header__row.header__row--top"),
        document.querySelector(".header__row"),
        document.querySelector("header")
      ].filter(Boolean);

      return candidates.reduce((max, el) => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        if (style.position !== "sticky" && style.position !== "fixed") return max;
        return Math.max(max, Math.ceil(rect.bottom || 0));
      }, 0);
    }

    function scrollMobileTabIntoView_() {
      if (!isMobile()) return;

      requestAnimationFrame(() => {
        const target =
          root.querySelector(".ucp-pcb__tabs") ||
          root.querySelector(".ucp-pcb__body") ||
          root;
        if (!target || !target.getBoundingClientRect) return;

        const targetTop = window.scrollY + target.getBoundingClientRect().top;
        const y = targetTop - getStickyHeaderOffset_() - 8;
        window.scrollTo({ top: Math.max(0, y), behavior: "auto" });
      });
    }

    function setActiveTab(tab) {
      state.tab = tab;

      $tabs.forEach((b) => b.classList.toggle("is-active", b.dataset.tab === tab));

      showFiltersForTab(tab);
      resetFilterValues();

      renderHead();
      loadAndRender(tab, { forcePriceReset: true, afterRender: scrollMobileTabIntoView_ });

      if (typeof window.__UCP_PCB_MEASURE_TABS === "function") {
        requestAnimationFrame(() => window.__UCP_PCB_MEASURE_TABS());
      }
    }

    // ---------- Share link encoding ----------
    function base64UrlEncode(str) {
      const bytes = new TextEncoder().encode(str);
      let bin = "";
      bytes.forEach((b) => (bin += String.fromCharCode(b)));
      const b64 = btoa(bin);
      return b64.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
    }

    function base64UrlDecodeToString(b64url) {
      const padLen = (4 - (b64url.length % 4)) % 4;
      const padded = (b64url + "====".slice(0, padLen)).replaceAll("-", "+").replaceAll("_", "/");

      const bin = atob(padded);
      const bytes = new Uint8Array([...bin].map((ch) => ch.charCodeAt(0)));
      return new TextDecoder().decode(bytes);
    }

    function getBuildFromUrl() {
      const sp = new URLSearchParams(window.location.search);
      const v = sp.get("build");
      if (!v) return null;
      try {
        const decoded = base64UrlDecodeToString(v);
        return JSON.parse(decoded);
      } catch {
        return null;
      }
    }

    function setBuildInUrl(buildObj) {
      const encoded = base64UrlEncode(JSON.stringify(buildObj));
      const url = new URL(window.location.href);
      url.searchParams.set("build", encoded);
      return url.toString();
    }

    function buildSharePayload() {
      const payload = {};

      for (const [tab, v] of Object.entries(state.picked || {})) {
        if (!v) continue;

        if (Array.isArray(v)) {
          payload[tab] = v
            .filter(Boolean)
            .map((it) => ({
              productId: String(it.productId),
              variantId: String(it.variantId),
              qty: Number(it.qty || 1)
            }));
        } else {
          payload[tab] = {
            productId: String(v.productId),
            variantId: String(v.variantId)
          };
        }
      }

      return payload;
    }

    // Expose build payload helpers for ucp-pcb-build-link.js.
    try {
      window.UCP_PCB_SharePayload = window.UCP_PCB_SharePayload || {};
      window.UCP_PCB_SharePayload.buildSharePayload = buildSharePayload;
      window.UCP_PCB_SharePayload.base64UrlEncode = base64UrlEncode;
    } catch (e) {}

    async function copyToClipboard(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    }

    function applyPendingPickForTab(tab) {
      if (!state.pendingPickByTab) return;

      const pendingRaw = state.pendingPickByTab[tab];
      if (!pendingRaw) return;

      const pendings = Array.isArray(pendingRaw) ? pendingRaw : [pendingRaw];

      const list = state.cache.get(tab) || [];
      let appliedAny = false;

      if (isMultiTab(tab)) {
        delete state.picked[tab];
      }

      for (const pending of pendings) {
        if (!pending) continue;

        const wantVid = pending.variantId ? normId(pending.variantId) : "";
        const wantPid = pending.productId ? normId(pending.productId) : "";
        const wantQtyRaw = Number(pending.qty || 1);
        const wantQty = Number.isFinite(wantQtyRaw) && wantQtyRaw > 0 ? wantQtyRaw : 1;

        let hitProduct = null;
        let hitVariant = null;

        if (wantVid) {
          for (const p of list) {
            const vars = variantsOfProduct(p);
            const v = vars.find((x) => normId(x.id) === wantVid);
            if (v) {
              hitProduct = p;
              hitVariant = v;
              break;
            }
          }
        }

        if (!hitProduct && wantPid) {
          hitProduct = list.find((x) => normId(x.productId) === wantPid) || null;
          if (hitProduct) hitVariant = getActiveVariant(tab, hitProduct);
        }

        if (!hitProduct || !hitVariant) continue;

        setActiveVariant(tab, hitProduct, hitVariant.id);
        const item = buildPickedItemFromActiveVariant(tab, hitProduct, hitVariant);

        const added = addOrIncPicked(tab, item, wantQty);
        if (!added) continue;

        appliedAny = true;
      }

      delete state.pendingPickByTab[tab];

      enforceDependencies(tab);
      if (appliedAny) {
        ucpHandleBuildChanged_();
        renderPicked();
      }
    }

    async function applyPendingPickAllTabs_() {
      if (!state.pendingPickByTab) return;

      const order = ["processor", "motherboard", "memory", "gpu", "cpucooler", "ssd", "powersupply", "case", "casefans", "other"];
      const extras = Object.keys(state.pendingPickByTab).filter((tab) => !order.includes(tab));
      const tabs = order.concat(extras);

      for (const tab of tabs) {
        if (!state.pendingPickByTab || !state.pendingPickByTab[tab]) continue;

        if (!state.cache.has(tab)) {
          try {
            const products = await fetchAllProducts(tab);
            state.cache.set(tab, products);
          } catch (e) {
            continue;
          }
        }

        applyPendingPickForTab(tab);
      }
    }

    function ucpSetBuildRestorePromise_(promise, opts = {}) {
      if (!promise || typeof promise.then !== "function") return;
      try {
        window.__UCP_PCB_BUILD_RESTORE_PROMISE__ = promise;
        window.__UCP_PCB_BUILD_RESTORE_DONE__ = false;
      } catch (e) {}

      try {
        const restoreUi = window.UCP_PCB_RESTORE_LOADING || null;
        if (restoreUi && !opts.suppressRestoreLoading) {
          const beforeCount = Number(opts.beforeCount) || 0;
          const expectedCount = Number(opts.expectedCount) || 0;
          restoreUi.track(promise, {
            source: opts.source || "build",
            timeoutMs: opts.timeoutMs || 15000,
            timeoutMessage: opts.timeoutMessage || "We couldn't fully restore this build.",
            failureMessage: opts.failureMessage || "We couldn't fully restore this build.",
            successTest: () => {
              if (!(expectedCount > 0)) return pickedLineCount() > beforeCount;
              return pickedLineCount() >= beforeCount + expectedCount;
            }
          });
        }
      } catch (e) {}

      promise.then(
        () => {
          try {
            window.__UCP_PCB_BUILD_RESTORE_DONE__ = true;
          } catch (e) {}
        },
        () => {
          try {
            window.__UCP_PCB_BUILD_RESTORE_DONE__ = true;
          } catch (e) {}
        }
      );
    }

    async function loadAndRender(tab, { forcePriceReset = false, afterRender = null } = {}) {
      if (state.cache.has(tab)) {
        const products = state.cache.get(tab);

        buildFiltersForTab(tab, products);
        syncPriceSlider(products, { forceReset: forcePriceReset });

        applyPendingPickForTab(tab);
        renderRows(products);
        if (typeof afterRender === "function") afterRender();
        return;
      }

      safeInnerHtml($body, `<div class="ucp-pcb__loading">Loading...</div>`);

      try {
        const products = await fetchAllProducts(tab);
        state.cache.set(tab, products);

        buildFiltersForTab(tab, products);
        syncPriceSlider(products, { forceReset: true });

        applyPendingPickForTab(tab);
        renderRows(products);
        if (typeof afterRender === "function") afterRender();
      } catch (e) {
        safeInnerHtml($body, `<div class="ucp-pcb__loading">Failed to load this category.</div>`);
      }
    }

    // ---------- Sticky Performance Preview (dataset endpoint, above Promo Code Savings) ----------
    const __UCP_PCB_PERF = {
      mounted: false,
      page: 0,
      lastKey: "",
      req: 0,
      cache: new Map(),

      datasetPromise: null,
      datasetEntries: null
    };

    function ucpPerfKeyResFromAny_(raw) {
      const s = String(raw || "").trim().toLowerCase().replace(/\s+/g, "");
      if (!s) return "1440p";
      if (s === "4k" || s.includes("2160") || s.includes("3840x2160")) return "4k";
      if (s.includes("1080")) return "1080p";
      if (s.includes("1440")) return "1440p";
      return "1440p";
    }

    function ucpPerfKeyPresetFromAny_(raw) {
      const s = String(raw || "").trim().toLowerCase().replace(/\s+/g, "");
      if (!s) return "low";
      if (s === "med" || s === "mid") return "medium";
      if (s.includes("medium")) return "medium";
      if (s.includes("ultra") || s.includes("veryhigh")) return "high";
      if (s.includes("high")) return "high";
      if (s.includes("low")) return "low";
      return "low";
    }

    function ucpPerfUiResFromKey_(key) {
      const k = ucpPerfKeyResFromAny_(key);
      if (k === "1080p") return "1080P";
      if (k === "1440p") return "1440P";
      return "4K";
    }

    function ucpPerfUiPresetFromKey_(key) {
      const k = ucpPerfKeyPresetFromAny_(key);
      if (k === "medium") return "MED";
      if (k === "high") return "HIGH";
      return "LOW";
    }

    function ucpPerfGetSelection_() {
      let resKey = "1440p";
      let presetKey = "low";

      try {
        const r1 = localStorage.getItem("chosen_res");
        const p1 = localStorage.getItem("chosen_preset");
        const r2 = localStorage.getItem("ucp_pcb_perf_res_key");
        const p2 = localStorage.getItem("ucp_pcb_perf_preset_key");

        resKey = ucpPerfKeyResFromAny_(r1 || r2 || resKey);
        presetKey = ucpPerfKeyPresetFromAny_(p1 || p2 || presetKey);
      } catch (e) {}

      return {
        resKey,
        presetKey,
        resUi: ucpPerfUiResFromKey_(resKey),
        presetUi: ucpPerfUiPresetFromKey_(presetKey)
      };
    }

    function ucpPerfSetSelection_(next) {
      try {
        if (next.resUi) {
          const key = ucpPerfKeyResFromAny_(next.resUi);
          localStorage.setItem("ucp_pcb_perf_res_key", key);
          localStorage.setItem("chosen_res", key);
        }

        if (next.presetUi) {
          const ui = String(next.presetUi || "").trim().toUpperCase();
          const key = ui === "MED" ? "medium" : ui === "HIGH" ? "high" : "low";
          localStorage.setItem("ucp_pcb_perf_preset_key", key);
          localStorage.setItem("chosen_preset", key);
        }
      } catch (e) {}
    }

    function ucpPerfEnsureStyles_() {
      if (document.getElementById("ucp-pcb-perf-style")) return;
      const style = document.createElement("style");
      style.id = "ucp-pcb-perf-style";
      style.textContent = `
        .ucp-pcb__perfSticky{
          position: sticky;
          top: 8px;
          z-index: 5;
          background: #fff;
          border: 1px solid rgba(0,0,0,.10);
          border-radius: 14px;
          padding: 10px 10px;
          margin: 10px 0 10px 0;
        }
        .ucp-pcb__perfSub{
          font-size: 13px;
          font-weight: 800;
          margin: 2px 0 8px 0;
          opacity: .92;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ucp-pcb__perfLine{
          display:flex;
          align-items:center;
          gap: 10px;
          margin: 6px 0;
        }
        .ucp-pcb__perfLabel{
          font-size: 11px;
          letter-spacing: .06em;
          text-transform: uppercase;
          opacity: .65;
          width: 92px;
          flex: 0 0 92px;
        }
        .ucp-pcb__perfChips{
          display:flex;
          gap: 6px;
          align-items:center;
          flex-wrap: nowrap;
          overflow: hidden;
        }
        .ucp-pcb__perfChip{
          border: 1px solid rgba(0,0,0,.12);
          background: #fff;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 900;
          line-height: 1;
          cursor: pointer;
          user-select: none;
          white-space: nowrap;
        }
        .ucp-pcb__perfChip.is-active{
          background: #111;
          color: #fff;
          border-color: #111;
        }
        .ucp-pcb__perfBottom{
          display:flex;
          align-items:center;
          gap: 8px;
          margin-top: 6px;
        }
        .ucp-pcb__perfArrow{
          width: 28px;
          height: 28px;
          border-radius: 999px;
          border: 1px solid rgba(0,0,0,.12);
          background: #fff;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size: 16px;
          line-height: 1;
          user-select:none;
          flex: 0 0 auto;
        }
        .ucp-pcb__perfGames{
          display:flex;
          align-items:center;
          gap: 14px;
          overflow:hidden;
          min-width: 0;
          flex: 1 1 auto;
        }
        .ucp-pcb__perfGame{
          display:flex;
          align-items:center;
          gap: 8px;
          white-space: nowrap;
          flex: 0 0 auto;
        }
        .ucp-pcb__perfLogo{
          width: 18px;
          height: 18px;
          object-fit: contain;
          display:block;
        }
        .ucp-pcb__perfFps{
          font-weight: 900;
          font-size: 14px;
        }
        .ucp-pcb__perfFps small{
          font-weight: 800;
          font-size: 11px;
          opacity: .65;
          margin-left: 6px;
        }
        .ucp-pcb__perfSticky[data-status="loading"]{ opacity: .78; }
        .ucp-pcb__perfSticky[data-status="incomplete"]{ opacity: .70; }
      `;
      document.head.appendChild(style);
    }

    function ucpPerfFindAnchorRow_() {
      const candidates = [
        root.querySelector("#ucp-pcb-promo-savings"),
        root.querySelector("#ucp-pcb-promocode-savings"),
        root.querySelector("#ucp-pcb-promo-code-savings"),
        root.querySelector("[data-ucp-pcb-promo-savings]"),
        root.querySelector("[data-ucp-pcb-promocode-savings]"),
        $savings
      ].filter(Boolean);

      function findRowFromLeaf(leaf) {
        if (!leaf) return null;

        let el = leaf;
        for (let i = 0; i < 10; i++) {
          if (!el || el === root) break;
          if (el.classList) {
            if (
              el.classList.contains("ucp-pcb__totalsRow") ||
              el.classList.contains("ucp-pcb__summaryRow") ||
              el.classList.contains("ucp-pcb__totalsLine")
            ) {
              return el;
            }
          }
          el = el.parentElement;
        }

        return leaf.parentElement?.parentElement || leaf.parentElement || null;
      }

      for (const c of candidates) {
        const row = findRowFromLeaf(c);
        if (row && row.parentElement) return row;
      }

      return null;
    }

    function ucpPerfEnsureMounted_() {
      if (__UCP_PCB_PERF.mounted && root.querySelector("#ucp-pcb-perf-sticky")) return;

      ucpPerfEnsureStyles_();

      const existing = root.querySelector("#ucp-pcb-perf-sticky");
      if (existing) {
        __UCP_PCB_PERF.mounted = true;
        return;
      }

      const anchor = ucpPerfFindAnchorRow_();
      if (!anchor || !anchor.parentElement) return;

      const el = document.createElement("div");
      el.id = "ucp-pcb-perf-sticky";
      el.className = "ucp-pcb__perfSticky";
      el.setAttribute("data-status", "incomplete");

      el.innerHTML = `
        <div class="ucp-pcb__perfSub" id="ucp-pcb-perf-sub">Select CPU and GPU to show FPS</div>

        <div class="ucp-pcb__perfLine">
          <div class="ucp-pcb__perfLabel">Resolution</div>
          <div class="ucp-pcb__perfChips" id="ucp-pcb-perf-res">
            <button type="button" class="ucp-pcb__perfChip" data-perf-res-ui="1080P">1080P</button>
            <button type="button" class="ucp-pcb__perfChip" data-perf-res-ui="1440P">1440P</button>
            <button type="button" class="ucp-pcb__perfChip" data-perf-res-ui="4K">4K</button>
          </div>
        </div>

        <div class="ucp-pcb__perfLine">
          <div class="ucp-pcb__perfLabel">Preset</div>
          <div class="ucp-pcb__perfChips" id="ucp-pcb-perf-preset">
            <button type="button" class="ucp-pcb__perfChip" data-perf-preset-ui="LOW">LOW</button>
            <button type="button" class="ucp-pcb__perfChip" data-perf-preset-ui="MED">MED</button>
            <button type="button" class="ucp-pcb__perfChip" data-perf-preset-ui="HIGH">HIGH</button>
          </div>
        </div>

        <div class="ucp-pcb__perfBottom">
          <button type="button" class="ucp-pcb__perfArrow" id="ucp-pcb-perf-next" aria-label="Show other games">›</button>
          <div class="ucp-pcb__perfGames" id="ucp-pcb-perf-games"></div>
        </div>
      `.trim();

      anchor.parentElement.insertBefore(el, anchor);

      el.addEventListener("click", (e) => {
        const resBtn = e.target.closest("[data-perf-res-ui]");
        if (resBtn) {
          ucpPerfSetSelection_({ resUi: resBtn.getAttribute("data-perf-res-ui") });
          __UCP_PCB_PERF.page = 0;
          ucpPerfStickyUpdate_();
          return;
        }

        const presetBtn = e.target.closest("[data-perf-preset-ui]");
        if (presetBtn) {
          ucpPerfSetSelection_({ presetUi: presetBtn.getAttribute("data-perf-preset-ui") });
          __UCP_PCB_PERF.page = 0;
          ucpPerfStickyUpdate_();
          return;
        }

        const nextBtn = e.target.closest("#ucp-pcb-perf-next");
        if (nextBtn) {
          __UCP_PCB_PERF.page += 1;
          ucpPerfStickyUpdate_({ keepCache: true });
          return;
        }
      });

      __UCP_PCB_PERF.mounted = true;
    }

    const UCP_PCB_PREFERRED_GAMES = [
      "valorant",
      "cs-2",
      "dota-2",
      "marvel-rivals",
      "cyberpunk",
      "arc-raiders"
    ];

    const UCP_PCB_GAME_LABELS = {
      valorant: "Valorant",
      "cs-2": "CS 2",
      "dota-2": "Dota 2",
      "marvel-rivals": "Marvel Rivals",
      cyberpunk: "Cyberpunk 2077",
      "arc-raiders": "ARC Raiders"
    };

    const UCP_PCB_GAME_ALIASES = {
      "cs-2": ["counter-strike-2", "cs2"],
      cyberpunk: ["cyberpunk-2077"],
      "marvel-rivals": ["marvelrivals"]
    };

    function ucpPerfSlug_(input) {
      return String(input || "")
        .trim()
        .toLowerCase()
        .replace(/['"]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
    }

    function ucpPerfHumanize_(key) {
      const s = String(key || "").replace(/-/g, " ").trim();
      if (!s) return "";
      return s.replace(/\b\w/g, (m) => m.toUpperCase());
    }

    function ucpPerfPickPreferredGames_(incomingGames) {
      const list = Array.isArray(incomingGames) ? incomingGames : [];
      const pref = Array.isArray(UCP_PCB_PREFERRED_GAMES) ? UCP_PCB_PREFERRED_GAMES : [];
      if (!pref.length) return list;

      const map = new Map();
      list.forEach((g) => {
        const key = ucpPerfSlug_(g?.key || g?.handle || g?.game || g?.name || g?.title);
        if (!key) return;
        if (!map.has(key)) map.set(key, g);
      });

      const out = [];
      for (const prefKeyRaw of pref) {
        const prefKey = ucpPerfSlug_(prefKeyRaw);
        let hit = map.get(prefKey) || null;

        if (!hit) {
          const aliases = UCP_PCB_GAME_ALIASES[prefKey];
          if (Array.isArray(aliases)) {
            for (const a of aliases) {
              const ak = ucpPerfSlug_(a);
              hit = map.get(ak) || null;
              if (hit) break;
            }
          }
        }

        if (hit) {
          out.push({
            ...hit,
            key: prefKey,
            game: hit.game || UCP_PCB_GAME_LABELS[prefKey] || ucpPerfHumanize_(prefKey) || "Game"
          });
        } else {
          out.push({
            key: prefKey,
            game: UCP_PCB_GAME_LABELS[prefKey] || ucpPerfHumanize_(prefKey) || "Game",
            fps: null,
            logoUrl: ""
          });
        }
      }

      return out;
    }

    function ucpPerfSetActiveChips_(wrap, { resUi, presetUi }) {
      wrap.querySelectorAll("[data-perf-res-ui]").forEach((b) => {
        b.classList.toggle("is-active", String(b.getAttribute("data-perf-res-ui")).toUpperCase() === resUi);
      });
      wrap.querySelectorAll("[data-perf-preset-ui]").forEach((b) => {
        b.classList.toggle("is-active", String(b.getAttribute("data-perf-preset-ui")).toUpperCase() === presetUi);
      });
    }

    function ucpPerfRenderGames_(wrap, games) {
      const box = wrap.querySelector("#ucp-pcb-perf-games");
      if (!box) return;

      const chosen = ucpPerfPickPreferredGames_(games);

      const perPage = 3;
      const totalPages = Math.max(1, Math.ceil((chosen.length || 0) / perPage));
      const page = ((__UCP_PCB_PERF.page % totalPages) + totalPages) % totalPages;
      const slice = chosen.slice(page * perPage, page * perPage + perPage);

      if (!slice.length) {
        box.innerHTML = `<div class="ucp-pcb__perfGame"><span class="ucp-pcb__perfFps">-<small>AVG FPS</small></span></div>`;
        return;
      }

      box.innerHTML = slice
        .map((g) => {
          const fps = g.fps === null ? "-" : String(Math.round(g.fps));
          const logo = g.logoUrl
            ? `<img class="ucp-pcb__perfLogo" src="${escapeHtml(g.logoUrl)}" alt="${escapeHtml(g.game || "Game")}">`
            : `<span class="ucp-pcb__perfLogo" aria-hidden="true"></span>`;

          return `
            <div class="ucp-pcb__perfGame" title="${escapeHtml(g.game || "")}">
              ${logo}
              <span class="ucp-pcb__perfFps">${escapeHtml(fps)}<small>AVG FPS</small></span>
            </div>
          `;
        })
        .join("");
    }

    function ucpPerfEndpoint_() {
      const ep =
        (cfg && cfg.perf_preview_endpoint ? String(cfg.perf_preview_endpoint) : "").trim() ||
        (cfg && cfg.endpoints && cfg.endpoints.perf_preview ? String(cfg.endpoints.perf_preview) : "").trim();
      return ep;
    }

    function ucpPerfExtractArray_(json) {
      if (!json) return [];
      if (Array.isArray(json)) return json;

      const directKeys = ["items", "entries", "results", "rows", "benchmarks", "data"];
      for (const k of directKeys) {
        if (Array.isArray(json[k])) return json[k];
      }

      if (json.data && Array.isArray(json.data.items)) return json.data.items;
      if (json.data && Array.isArray(json.data.entries)) return json.data.entries;

      if (Array.isArray(json.sample)) return json.sample;

      return [];
    }

    async function ucpPerfFetchDatasetFromEndpoint_() {
      if (__UCP_PCB_PERF.datasetEntries) return __UCP_PCB_PERF.datasetEntries;
      if (__UCP_PCB_PERF.datasetPromise) return __UCP_PCB_PERF.datasetPromise;

      const ep = ucpPerfEndpoint_();
      if (!ep) return [];

      __UCP_PCB_PERF.datasetPromise = (async () => {
        const all = [];
        let page = 1;
        let guard = 0;

        while (true) {
          guard += 1;
          if (guard > 30) break;

          const u = new URL(ep, window.location.origin);
          u.searchParams.set("page", String(page));

          const r = await fetch(u.toString(), { credentials: "same-origin" });
          if (!r.ok) break;

          const json = await r.json().catch(() => null);
          if (!json) break;

          const arr = ucpPerfExtractArray_(json);
          if (arr.length) all.push(...arr);

          const nextPage = Number(json.next_page || 0);
          if (!nextPage) break;
          page = nextPage;
        }

        __UCP_PCB_PERF.datasetEntries = all;

        window.__UCP_PCB_PERF_DATASET_META = {
          endpoint: ep,
          entries: all.length
        };

        return all;
      })();

      const out = await __UCP_PCB_PERF.datasetPromise;
      return out;
    }

    function ucpPerfReadNumber_(obj, keys) {
      for (const k of keys) {
        const v = obj?.[k];
        const n = Number(v);
        if (Number.isFinite(n)) return n;
        if (typeof v === "string") {
          const m = v.match(/(\d+(\.\d+)?)/);
          if (m) {
            const nn = Number(m[1]);
            if (Number.isFinite(nn)) return nn;
          }
        }
      }
      return null;
    }

    function ucpPerfReadString_(obj, keys) {
      for (const k of keys) {
        const v = obj?.[k];
        const s = v === null || v === undefined ? "" : String(v).trim();
        if (s) return s;
      }
      return "";
    }

    function ucpPerfGamesFromDataset_(entries, { cpuHandle, gpuHandle, resKey, presetKey }) {
      const list = Array.isArray(entries) ? entries : [];
      if (!list.length) return [];

      const suffix = `-${cpuHandle}-${gpuHandle}-res-${resKey}-preset-${presetKey}`;

      const byGame = new Map();

      for (const row of list) {
        const benchKey = ucpPerfReadString_(row, ["bench_key_field", "benchKey", "key", "bench_key", "bench_key_entry"]);
        if (!benchKey) continue;
        if (!benchKey.endsWith(suffix)) continue;

        const gamePartRaw = benchKey.slice(0, benchKey.length - suffix.length);
        const gameKey = ucpPerfSlug_(gamePartRaw);
        if (!gameKey) continue;

        const fps = ucpPerfReadNumber_(row, [
          "fps",
          "avg_fps",
          "avgFps",
          "fps_avg",
          "fpsAvg",
          "avg_fps_entry",
          "fps_avg_entry",
          "value"
        ]);

        const logoUrl = ucpPerfReadString_(row, [
          "logoUrl",
          "logo_url",
          "game_logo",
          "game_logo_url",
          "icon",
          "icon_url",
          "game_icon",
          "game_icon_url",
          "image",
          "image_url"
        ]);

        const existing = byGame.get(gameKey);

        if (!existing) {
          byGame.set(gameKey, {
            key: gameKey,
            game: UCP_PCB_GAME_LABELS[gameKey] || ucpPerfHumanize_(gameKey) || "Game",
            fps: fps,
            logoUrl: logoUrl
          });
          continue;
        }

        const cur = existing.fps;
        if (cur === null || cur === undefined) {
          existing.fps = fps;
        } else if (fps !== null && fps !== undefined && Number.isFinite(fps) && fps > cur) {
          existing.fps = fps;
        }

        if (!existing.logoUrl && logoUrl) existing.logoUrl = logoUrl;
      }

      return Array.from(byGame.values());
    }

    async function ucpPerfLookupGames_({ cpuHandle, gpuHandle, resKey, presetKey }) {
      const key = `${cpuHandle}|${gpuHandle}|${resKey}|${presetKey}`;
      if (__UCP_PCB_PERF.cache.has(key)) return __UCP_PCB_PERF.cache.get(key);

      const args = { cpuHandle, gpuHandle, res: resKey, preset: presetKey };
      window.__UCP_PCB_LAST_PERF_ARGS = args;

      // If a lookup function exists (from another asset), use it.
      if (typeof window.__UCP_PERF_PREVIEW_LOOKUP === "function") {
        const out = await window.__UCP_PERF_PREVIEW_LOOKUP(args);
        const games = Array.isArray(out?.games) ? out.games : Array.isArray(out) ? out : [];
        const normalized = games
          .map((g) => ({
            key: ucpPerfSlug_(g?.key || g?.handle || g?.game || g?.name || g?.title),
            game: String(g?.game || g?.name || g?.title || "").trim(),
            fps: Number.isFinite(Number(g?.fps)) ? Number(g.fps) : null,
            logoUrl: String(g?.logoUrl || g?.logo || g?.icon || g?.image || "").trim()
          }))
          .filter((x) => x.key || x.game);

        __UCP_PCB_PERF.cache.set(key, normalized);
        return normalized;
      }

      // Dataset endpoint (your current /pages/ucp-pcb-perf-preview view output)
      const ep = ucpPerfEndpoint_();
      if (ep) {
        const entries = await ucpPerfFetchDatasetFromEndpoint_();
        const games = ucpPerfGamesFromDataset_(entries, { cpuHandle, gpuHandle, resKey, presetKey });
        __UCP_PCB_PERF.cache.set(key, games);
        return games;
      }

      __UCP_PCB_PERF.cache.set(key, []);
      return [];
    }

    async function ucpPerfStickyUpdate_(opts = {}) {
      ucpPerfEnsureMounted_();
      const wrap = root.querySelector("#ucp-pcb-perf-sticky");
      if (!wrap) return;

      const sel = ucpPerfGetSelection_();
      ucpPerfSetActiveChips_(wrap, { resUi: sel.resUi, presetUi: sel.presetUi });

      const cpu = state.picked?.processor;
      const gpu = state.picked?.gpu;

      const sub = wrap.querySelector("#ucp-pcb-perf-sub");

      if (!cpu || !gpu) {
        wrap.setAttribute("data-status", "incomplete");
        if (sub) sub.textContent = "Select CPU and GPU to show FPS";
        ucpPerfRenderGames_(wrap, []);
        __UCP_PCB_PERF.lastKey = "";
        __UCP_PCB_PERF.page = 0;
        return;
      }

      const cpuHandle = String(cpu.bench_cpu_handle || "").trim();
      const gpuHandle = String(gpu.bench_gpu_handle || "").trim();

      if (!cpuHandle || !gpuHandle) {
        wrap.setAttribute("data-status", "incomplete");
        if (sub) sub.textContent = "Missing benchmark ID on CPU or GPU. Check bench_cpu_handle and bench_gpu_handle.";
        ucpPerfRenderGames_(wrap, []);
        __UCP_PCB_PERF.lastKey = "";
        __UCP_PCB_PERF.page = 0;
        return;
      }

      const key = `${cpuHandle}|${gpuHandle}|${sel.resKey}|${sel.presetKey}`;

      if (__UCP_PCB_PERF.lastKey !== key) __UCP_PCB_PERF.page = 0;
      __UCP_PCB_PERF.lastKey = key;

      if (sub) {
        const left = String(cpu.title || "").trim();
        const right = String(gpu.title || "").trim();
        sub.textContent = `${left} . ${right}`;
      }

      wrap.setAttribute("data-status", "loading");
      const reqId = ++__UCP_PCB_PERF.req;

      try {
        const games = await ucpPerfLookupGames_({
          cpuHandle,
          gpuHandle,
          resKey: sel.resKey,
          presetKey: sel.presetKey
        });

        if (reqId !== __UCP_PCB_PERF.req) return;

        wrap.setAttribute("data-status", "ready");
        ucpPerfRenderGames_(wrap, games);
      } catch (e) {
        if (reqId !== __UCP_PCB_PERF.req) return;
        wrap.setAttribute("data-status", "ready");
        ucpPerfRenderGames_(wrap, []);
      }
    }

    // ---------- PDF ----------
    function normalizePdfVariantTitle_(rawTitle) {
      const title = String(rawTitle || "").trim();
      if (!title) return "";
      if (title.toLowerCase() === "default title") return "";
      return title;
    }

    function getSummaryRowsForPdf() {
      const order = [
        ["processor", "CPU"],
        ["motherboard", "Motherboard"],
        ["memory", "RAM"],
        ["gpu", "GPU"],
        ["cpucooler", "CPU Cooler"],
        ["ssd", "SSD"],
        ["powersupply", "Power Supply"],
        ["case", "Case"],
        ["casefans", "Case Fans"],
        ["other", "Other"]
      ];

      const cpu = state.picked?.processor || null;
      const rows = [];

      for (const [k, label] of order) {
        const v = state.picked?.[k];
        if (!v) continue;

        const items = Array.isArray(v) ? v : [v];

        for (const p of items) {
          if (!p) continue;

          const qtyRaw = Number(p.qty || 1);
          const qty = Number.isFinite(qtyRaw) && qtyRaw > 0 ? qtyRaw : 1;
          const av = ucpVariantForPicked_(p);
          const variantTitle = normalizePdfVariantTitle_(
            av?.title || p.variantTitle || p.variant_title || (p.variant && p.variant.title) || ""
          );

          const unitPrice = Number(p.price || 0);
          const base = unitPrice * qty;

          let discountPerUnit = 0;
          let final = base;

          if (k === "motherboard" && cpu && ucpShouldApplyBundleDiscount_()) {
            discountPerUnit = bundleDiscountFor(cpu, p);
            const perUnitFinal = Math.max(0, unitPrice - discountPerUnit);
            final = perUnitFinal * qty;
          }

          rows.push({
            component: label,
            title: (p.title || "") + (qty > 1 ? ` ×${qty}` : ""),
            image: p.image || "",
            variantTitle: variantTitle,
            basePrice: base,
            discount: k === "motherboard" ? discountPerUnit * qty : 0,
            finalPrice: k === "motherboard" ? final : base
          });
        }
      }

      return rows;
    }

    function buildPaymentSectionHtml_(opts = {}) {
      const methods = Array.isArray(opts.paymentMethodsSelected) ? opts.paymentMethodsSelected : [];
      const clean = methods
        .map((m) => ({
          id: String(m?.id || "").trim(),
          label: String(m?.label || "").trim(),
          logo: m?.logo || "",
          qr: m?.qr || ""
        }))
        .filter((m) => m.id && m.label);

      if (!clean.length) return "";

      const proofText = opts.proofText ? String(opts.proofText) : "";
      const proofLink = opts.proofLink ? String(opts.proofLink) : "";
      const ctaLabel = opts.proofCtaLabel ? String(opts.proofCtaLabel) : "Send proof on Messenger";
      const wrapClass = "paySection pageBreak";

      const method = clean[0];
      const logo = method.logo
        ? `<div class="payLogoLarge"><img src="${escapeHtml(method.logo)}" alt="${escapeHtml(method.label)}"></div>`
        : "";
      const qr = method.qr
        ? `<div class="payQrLarge"><img src="${escapeHtml(method.qr)}" alt="${escapeHtml(method.label)} QR"></div>`
        : `<div class="payQrFallback">QR not available.</div>`;
      const note = proofText || "Send proof of payment to our Facebook page to confirm.";

      return `
        <div class="${wrapClass}">
          <div class="payTitle">Payment</div>
          ${logo}
          <div class="payLabelLarge">${escapeHtml(method.label)}</div>
          ${qr}
          ${note ? `<div class="payNote">${escapeHtml(note)}</div>` : ""}
          ${proofLink ? `<a class="payCta" href="${escapeHtml(proofLink)}">${escapeHtml(ctaLabel)}</a>` : ""}
        </div>
      `;
    }

    function openPdfWindow(opts = {}) {
      const rows = getSummaryRowsForPdf();

      if (!rows.length) {
        alert("No parts selected yet.");
        return;
      }

      ucpLogBuildEvent("generate_pdf");

      const logoUrl = cfg && cfg.brand_logo ? String(cfg.brand_logo) : "";

      const totals = ucpComputeTotals_();
      const subtotalBase = totals.rawSubtotal;
      const savings = totals.bundleDiscount;
      const promoDiscount = totals.promoDiscount;
      const promoLabel = totals.promoLabel || "Promo discount";
      const addonDiscountRows = Array.isArray(totals.addonDiscountRows) ? totals.addonDiscountRows : [];
      const manualOff = totals.manualOff;
      const total = totals.payableSubtotal;
      const promoRowHtml =
        promoDiscount > 0
          ? `<div class="row"><span>${escapeHtml(promoLabel)}</span><strong class="num">${moneyPHP(promoDiscount)}</strong></div>`
          : "";
      const addonRowsHtml = addonDiscountRows
        .map((row) => {
          const label = String(row?.label || "Add-on discount").trim() || "Add-on discount";
          const amount = Number(row?.discountAmount || 0);
          if (!(amount > 0)) return "";
          return `<div class="row"><span>${escapeHtml(label)}</span><strong class="num">${moneyPHP(amount)}</strong></div>`;
        })
        .filter(Boolean)
        .join("");
      const manualRowHtml =
        manualOff > 0
          ? `<div class="row"><span>Additional discount</span><strong class="num">${moneyPHP(manualOff)}</strong></div>`
          : "";

      const rowsHtml = rows
        .map((r) => {
          const priceHtml =
            r.discount > 0
              ? `<div class="price">
                  <span class="strike num">${moneyPHP(r.basePrice)}</span>
                  <span class="final num">${moneyPHP(r.finalPrice)}</span>
                  <div class="note">Bundle discount: -<span class="num">${moneyPHP(r.discount)}</span></div>
                </div>`
              : `<div class="price">
                  <span class="final num">${moneyPHP(r.basePrice)}</span>
                </div>`;

          return `
            <tr>
              <td class="component">${escapeHtml(r.component)}</td>
              <td class="selection">
                <div class="sel">
                  <div class="img">${r.image ? `<img src="${escapeHtml(r.image)}" alt="">` : ""}</div>
                  <div class="txt">
                    <div class="title">${escapeHtml(r.title)}</div>
                    ${r.variantTitle ? `<div class="variant">${escapeHtml(r.variantTitle)}</div>` : ""}
                  </div>
                </div>
              </td>
              <td class="priceCol">${priceHtml}</td>
            </tr>
          `;
        })
        .join("");

      const paymentSection = buildPaymentSectionHtml_(opts);

      const html = `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Uncapped PC Build</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      @page { margin: 0.35in; }
      :root { --border: rgba(0,0,0,.12); --muted: rgba(0,0,0,.65); }
      body { font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; margin: 16px; color: #111; }

      .pdfHeader { display:flex; flex-direction:column; align-items:center; gap: 6px; margin-bottom: 8px; }
      .pdfLogo { height: 34px; width: auto; object-fit: contain; }
      h1 { text-align: center; margin: 0; font-size: 32px; line-height: 1.05; }
      .sub { display: none; }

      table { width: 100%; border-collapse: collapse; border: 1px solid var(--border); }
      thead th { text-align: left; font-size: 12px; background: rgba(0,0,0,.04); padding: 10px; border-bottom: 1px solid var(--border); }
      tbody td { padding: 10px; border-bottom: 1px solid var(--border); vertical-align: middle; }

      .component { width: 140px; color: #0b57d0; font-weight: 400; font-size: 13px; font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; }
      .selection .sel { display: grid; grid-template-columns: 54px 1fr; gap: 10px; align-items: center; }
      .selection .img { width: 54px; height: 54px; border: 1px solid var(--border); display:flex; align-items:center; justify-content:center; overflow:hidden; background: #fff; }
      .selection img { width: 54px; height: 54px; object-fit: cover; }
      .title { font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; font-weight: 500; font-size: 13px; line-height: 1.3; }
      .variant { font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; font-size: 11px; color: #666; margin-top: 4px; line-height: 1.3; }

      .priceCol { width: 220px; text-align: right; }

      .num {
        font-family: Roboto, system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
        font-variant-numeric: tabular-nums;
        color: #111;
      }
      .price .final { font-weight: 400; color: #111; }
      .price .strike { color: var(--muted); text-decoration: line-through; margin-right: 6px; }
      .price .note { color: var(--muted); font-size: 11px; margin-top: 4px; }

      .totals { margin-top: 14px; display: grid; grid-template-columns: 1fr 260px; gap: 12px; align-items: start; }
      .box { border: 1px solid var(--border); padding: 12px; }
      .row { display:flex; justify-content:space-between; padding: 6px 0; }
      .row strong { font-weight: 400; }
      .row strong.num { font-family: Roboto, system-ui, -apple-system, "Segoe UI", Arial, sans-serif; }
      .grand { font-size: 18px; }
      .grand strong { font-weight: 600; }

      .paySection { margin-top: 16px; text-align: center; }
      .payTitle { font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; font-size: 16px; font-weight: 800; margin-bottom: 8px; }
      .payLogoLarge img { height: 32px; width: auto; object-fit: contain; display:block; margin: 0 auto 6px; }
      .payLabelLarge { font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; font-size: 13px; font-weight: 700; margin-bottom: 10px; }
      .payQrLarge img { width: min(360px, 80%); height: auto; display:block; margin: 0 auto; border: 1px solid var(--border); border-radius: 12px; padding: 6px; background: #fff; }
      .payQrFallback { font-size: 12px; color: var(--muted); }
      .payNote { margin-top: 12px; font-size: 12px; color: var(--muted); font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; }
      .payCta { margin-top: 12px; display:inline-block; background:#111; color:#fff; text-decoration:none; padding:10px 14px; border-radius:10px; font-size:12px; font-weight:700; font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; }
      .pageBreak { page-break-before: always; break-before: page; }

      @media print {
        body { margin: 0; }
        .sub { display:none; }
      }
    </style>
  </head>
  <body>
    <div class="pdfHeader">
      ${logoUrl ? `<img class="pdfLogo" src="${escapeHtml(logoUrl)}" alt="">` : ""}
      <h1>Uncapped PC Build</h1>
    </div>

    <div class="sub">Generated from Uncapped PC Builder</div>

    <table>
      <thead>
        <tr>
          <th>Component</th>
          <th>Selection</th>
          <th style="text-align:right;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="totals">
      <div></div>
      <div class="box">
        <div class="row"><span>Subtotal</span><strong class="num">${moneyPHP(subtotalBase)}</strong></div>
        <div class="row"><span>Bundle discount</span><strong class="num">${moneyPHP(savings)}</strong></div>
        ${promoRowHtml}
        ${addonRowsHtml}
        ${manualRowHtml}
        <div class="row grand"><span>Payable subtotal</span><strong class="num">${moneyPHP(total)}</strong></div>
      </div>
    </div>

    ${paymentSection}

    <script>
      window.addEventListener('load', () => {
        setTimeout(() => window.print(), 250);
      });
    </script>
  </body>
  </html>
      `.trim();

      const w = window.open("", "_blank");
      if (!w) {
        alert("Pop-up blocked. Allow pop-ups for this site, then try again.");
        return;
      }
      w.document.open();
      w.document.write(html);
      w.document.close();
    }

    try {
      window.UCP_PCB_PDF = window.UCP_PCB_PDF || {};
      window.UCP_PCB_PDF.open = openPdfWindow;
    } catch (e) {}

    // ---------- Mobile drawer helpers ----------
    function setDrawerOpen(open) {
      root.classList.toggle("ucp-pcb--drawerOpen", !!open);
      if ($overlay) $overlay.hidden = !open;
      document.body.style.overflow = open ? "hidden" : "";
    }

    function setQuoteModalOpen(open) {
      if (!$quoteModal) return;
      const next = !!open;
      safeSetHidden($quoteModal, !next);
      if ($quoteBackdrop) safeSetHidden($quoteBackdrop, !next);

      const lockScroll = next || root.classList.contains("ucp-pcb--drawerOpen");
      document.body.style.overflow = lockScroll ? "hidden" : "";

      if (next && $quoteCodeField) {
        try {
          $quoteCodeField.focus();
          if (typeof $quoteCodeField.select === "function") $quoteCodeField.select();
        } catch (e) {}
      }
    }

    function ucpBuildBetaContactLink_(quoteCode, quoteVersion) {
      const base = ucpGetMessengerUrl_();
      try {
        const u = new URL(base, window.location.origin);
        const code = ucpNormalizeQuoteCode_(quoteCode);
        const version = Number(quoteVersion) || 0;
        u.searchParams.set("source", "pcbuilder_beta");
        if (code) {
          if (String(u.hostname || "").toLowerCase() === "m.me") {
            u.searchParams.set("ref", code);
          } else {
            u.searchParams.set("quote", code);
            if (version > 0) u.searchParams.set("v", String(version));
          }
        }
        return u.toString();
      } catch (e) {
        return base;
      }
    }

    function ucpEnsureCartBetaModal_() {
      let overlay = root.querySelector("#ucp-pcb-cartbeta-overlay");
      let modal = root.querySelector("#ucp-pcb-cartbeta-modal");
      if (overlay && modal) {
        return {
          overlay,
          modal,
          close: modal.querySelector("#ucp-pcb-cartbeta-close"),
          code: modal.querySelector("#ucp-pcb-cartbeta-code"),
          version: modal.querySelector("#ucp-pcb-cartbeta-version"),
          copy: modal.querySelector("#ucp-pcb-cartbeta-copy"),
          review: modal.querySelector("#ucp-pcb-cartbeta-review"),
          facebook: modal.querySelector("#ucp-pcb-cartbeta-facebook")
        };
      }

      overlay = document.createElement("div");
      overlay.id = "ucp-pcb-cartbeta-overlay";
      overlay.className = "ucp-pcb__quoteOverlay";
      overlay.hidden = true;

      modal = document.createElement("div");
      modal.id = "ucp-pcb-cartbeta-modal";
      modal.className = "ucp-pcb__quoteModal";
      modal.hidden = true;
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-label", "Choose how to continue");

      const head = document.createElement("div");
      head.className = "ucp-pcb__quoteModalHead";

      const title = document.createElement("strong");
      title.textContent = "Choose how to continue";

      const close = document.createElement("button");
      close.type = "button";
      close.className = "ucp-pcb__quoteClose";
      close.id = "ucp-pcb-cartbeta-close";
      close.setAttribute("aria-label", "Close beta warning");
      close.textContent = "X";

      head.appendChild(title);
      head.appendChild(close);

      const copyBlock = document.createElement("div");
      copyBlock.className = "ucp-pcb__quoteBlock";

      const copyLabel = document.createElement("div");
      copyLabel.className = "ucp-pcb__quoteLabel";
      copyLabel.textContent = "Quote Code";

      const copyRow = document.createElement("div");
      copyRow.className = "ucp-pcb__quoteCodeRow";

      const codeInput = document.createElement("input");
      codeInput.type = "text";
      codeInput.readOnly = true;
      codeInput.id = "ucp-pcb-cartbeta-code";
      codeInput.className = "ucp-pcb__quoteCodeInput";
      codeInput.value = "Q-XXXXX";

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "ucp-pcb__btn ucp-pcb__btn--solid";
      copyBtn.id = "ucp-pcb-cartbeta-copy";
      copyBtn.textContent = "Copy";

      copyRow.appendChild(codeInput);
      copyRow.appendChild(copyBtn);

      const copyHint = document.createElement("div");
      copyHint.className = "ucp-pcb__quoteHint";
      copyHint.textContent = "Copy this if you want to message us about this build on Facebook.";

      const versionEl = document.createElement("div");
      versionEl.className = "ucp-pcb__quoteVersion";
      versionEl.id = "ucp-pcb-cartbeta-version";
      versionEl.textContent = "";

      copyBlock.appendChild(copyLabel);
      copyBlock.appendChild(copyRow);
      copyBlock.appendChild(copyHint);
      copyBlock.appendChild(versionEl);

      const warnBlock = document.createElement("div");
      warnBlock.className = "ucp-pcb__quoteBlock ucp-pcb__quoteBlock--secondary";
      const warnText = document.createElement("div");
      warnText.className = "ucp-pcb__quoteHint";
      warnText.style.marginTop = "0";
      warnText.textContent =
        "You can review this build and continue with the approval flow here, or contact our official Facebook page if you want help confirming availability first.";
      warnBlock.appendChild(warnText);

      const actions = document.createElement("div");
      actions.className = "ucp-pcb__quoteActions";
      actions.style.gap = "8px";
      actions.style.flexWrap = "wrap";
      actions.style.justifyContent = "flex-end";

      const reviewBtn = document.createElement("button");
      reviewBtn.type = "button";
      reviewBtn.className = "ucp-pcb__btn ucp-pcb__btn--solid";
      reviewBtn.id = "ucp-pcb-cartbeta-review";
      reviewBtn.textContent = "Review and continue";

      const facebookBtn = document.createElement("button");
      facebookBtn.type = "button";
      facebookBtn.className = "ucp-pcb__btn";
      facebookBtn.id = "ucp-pcb-cartbeta-facebook";
      facebookBtn.textContent = "Open Official Facebook Page";

      actions.appendChild(reviewBtn);
      actions.appendChild(facebookBtn);

      modal.appendChild(head);
      modal.appendChild(warnBlock);
      modal.appendChild(copyBlock);
      modal.appendChild(actions);

      root.appendChild(overlay);
      root.appendChild(modal);

      return {
        overlay,
        modal,
        close,
        code: codeInput,
        version: versionEl,
        copy: copyBtn,
        review: reviewBtn,
        facebook: facebookBtn
      };
    }

    function setCartBetaModalOpen(open, { quoteCode = "", quoteVersion = 0 } = {}) {
      const refs = ucpEnsureCartBetaModal_();
      if (!refs) return;

      const next = !!open;
      const cleanCode = ucpNormalizeQuoteCode_(quoteCode);
      const version = Number(quoteVersion) || 0;

      if (next) {
        if (refs.code) refs.code.value = cleanCode || "Q-XXXXX";
        if (refs.version) refs.version.textContent = version > 0 ? `Version: v${version}` : "";
        if (refs.copy) refs.copy.disabled = !cleanCode;
        if (refs.copy) refs.copy.textContent = "Copy";
        try {
          const link = ucpBuildBetaContactLink_(cleanCode, version);
          if (refs.facebook) refs.facebook.setAttribute("data-href", link);
        } catch (e) {
          if (refs.facebook) refs.facebook.setAttribute("data-href", ucpGetMessengerUrl_());
        }
      }

      safeSetHidden(refs.modal, !next);
      safeSetHidden(refs.overlay, !next);

      const lockScroll =
        next ||
        root.classList.contains("ucp-pcb--drawerOpen") ||
        ($quoteModal && !$quoteModal.hidden);
      document.body.style.overflow = lockScroll ? "hidden" : "";

      if (next && refs.code) {
        try {
          refs.code.focus();
          refs.code.select();
        } catch (e) {}
      }
    }

    async function openCartBetaModalFlow_() {
      const snap = window.UCP_PCB_API?.getSnapshot?.() || null;
      const quoteState = ucpEnsureQuoteStateForShare_(snap);
      const quoteCode = ucpNormalizeQuoteCode_(quoteState.quoteCode || "");
      const quoteVersion = Number(quoteState.quoteVersion) || 0;
      const links = ucpBuildLinksForQuote_(snap, quoteCode, quoteVersion);
      const approvalLink =
        links.approvalLink || ucpBuildQuoteApprovalLink_(quoteCode, quoteVersion) || window.location.href;

      if (quoteCode) {
        ucpSetQuoteCodeInDom_(quoteCode);
        ucpSetQuoteVersionInDom_(quoteVersion);
      }

      const refs = ucpEnsureCartBetaModal_();
      if (!refs) return;

      if (refs.overlay) refs.overlay.onclick = () => setCartBetaModalOpen(false);
      if (refs.close) refs.close.onclick = () => setCartBetaModalOpen(false);
      if (refs.copy) refs.copy.onclick = async () => {
        const val = refs.code ? String(refs.code.value || "").trim() : "";
        if (!val) return;
        const ok = await copyToClipboard(val);
        refs.copy.textContent = ok ? "Copied" : "Copy failed";
        setTimeout(() => {
          refs.copy.textContent = "Copy";
        }, 1200);
      };
      if (refs.review) refs.review.onclick = async () => {
        ucpLogBuildEvent("beta_continue_purchase_click", {
          quoteCode,
          quoteVersion,
          approvalLink
        });
        setCartBetaModalOpen(false);
        try {
          const approvalApi = window.UCP_PCB_APPROVAL;
          if (approvalApi && typeof approvalApi.open === "function") {
            const opened = await approvalApi.open({
              fromBeta: true,
              quoteCode,
              quoteVersion,
              approvalLink
            });
            if (opened) {
              ucpLogBuildEvent("approval_open_from_beta", {
                quoteCode,
                quoteVersion,
                approvalLink
              });
              return;
            }
          }
        } catch (e) {}

        ucpLogBuildEvent("approval_open_from_beta", {
          quoteCode,
          quoteVersion,
          approvalLink,
          mode: "fallback_url"
        });
        window.location.href = approvalLink;
      };
      if (refs.facebook) refs.facebook.onclick = () => {
        const link = String(refs.facebook.getAttribute("data-href") || ucpGetMessengerUrl_()).trim();
        if (typeof window.UCP_PCB_LOG_EVENT === "function") {
          window.UCP_PCB_LOG_EVENT("beta_contact_click", {
            quoteCode: quoteCode || "",
            quoteVersion: quoteVersion || "",
            pageUrl: window.location.href
          });
        }
        try {
          window.open(link, "_blank", "noopener");
        } catch (e) {
          window.open(link, "_blank");
        }
      };

      setCartBetaModalOpen(true, { quoteCode, quoteVersion });

      ucpLogBuildEvent("add_to_cart_beta_notice", {
        quoteCode,
        quoteVersion
      });
    }

    if ($mobileOpen) $mobileOpen.addEventListener("click", () => setDrawerOpen(true));
    if ($drawerClose) $drawerClose.addEventListener("click", () => setDrawerOpen(false));
    if ($overlay) $overlay.addEventListener("click", () => setDrawerOpen(false));
    if ($quoteBackdrop) $quoteBackdrop.addEventListener("click", () => setQuoteModalOpen(false));
    if ($quoteClose) $quoteClose.addEventListener("click", () => setQuoteModalOpen(false));

    window.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;

      let handled = false;

      if ($quoteModal && !$quoteModal.hidden) {
        setQuoteModalOpen(false);
        handled = true;
      }

      const $cartBetaModal = root.querySelector("#ucp-pcb-cartbeta-modal");
      if ($cartBetaModal && !$cartBetaModal.hidden) {
        setCartBetaModalOpen(false);
        handled = true;
      }

      if (root.classList.contains("ucp-pcb--drawerOpen")) {
        setDrawerOpen(false);
        handled = true;
      }

      if (handled) e.stopPropagation();
    });

    if ($mobileRemove && $removeAll) {
      $mobileRemove.addEventListener("click", (e) => {
        e.stopPropagation();
        $removeAll.click();
      });
    }
    if ($mobileShare && $share) {
      $mobileShare.addEventListener("click", (e) => {
        e.stopPropagation();
        $share.click();
      });
    }
    if ($mobileSaveBuild && $saveBuild) {
      $mobileSaveBuild.addEventListener("click", (e) => {
        e.stopPropagation();
        $saveBuild.click();
      });
    }

    if ($mobileRequestQuote && $requestQuote) {
      $mobileRequestQuote.addEventListener("click", (e) => {
        e.stopPropagation();
        $requestQuote.click();
      });
    }
    if ($mobileScreenshot && $quoteImage) {
      $mobileScreenshot.addEventListener("click", (e) => {
        e.stopPropagation();
        $quoteImage.click();
      });
    }

    if ($desktopDockShare && $share) {
      $desktopDockShare.addEventListener("click", (e) => {
        e.preventDefault();
        $share.click();
      });
    }
    if ($desktopDockSaveBuild && $saveBuild) {
      $desktopDockSaveBuild.addEventListener("click", (e) => {
        e.preventDefault();
        $saveBuild.click();
      });
    }

    if ($desktopDockQuoteImage && $quoteImage) {
      $desktopDockQuoteImage.addEventListener("click", (e) => {
        e.preventDefault();
        $quoteImage.click();
      });
    }

    if ($desktopDockRequestQuote && $requestQuote) {
      $desktopDockRequestQuote.addEventListener("click", (e) => {
        e.preventDefault();
        $requestQuote.click();
      });
    }

    if ($desktopDockAddToCart && $addToCart) {
      $desktopDockAddToCart.addEventListener("click", (e) => {
        e.preventDefault();
        $addToCart.click();
      });
    }

    if ($mobilePdf && $pdf) {
      $mobilePdf.addEventListener("click", (e) => {
        e.stopPropagation();
        $pdf.click();
      });
    }


    // ---------- Add build to cart ----------
    async function addBuildToCart() {
      const order = ["processor", "motherboard", "memory", "gpu", "cpucooler", "ssd", "powersupply", "case", "casefans", "other"];

      const qtyByVariant = new Map();

      for (const k of order) {
        const v = state.picked[k];
        if (!v) continue;

        const items = Array.isArray(v) ? v : [v];

        for (const it of items) {
          if (!it) continue;

          const vid = normId(it.variantId);
          const idNum = Number(vid);
          if (!Number.isFinite(idNum)) continue;

          const qRaw = Number(it.qty || 1);
          const q = Number.isFinite(qRaw) && qRaw > 0 ? qRaw : 1;

          qtyByVariant.set(idNum, (qtyByVariant.get(idNum) || 0) + q);
        }
      }

      const items = Array.from(qtyByVariant.entries()).map(([id, quantity]) => ({ id, quantity }));

      if (!items.length) {
        alert("No parts selected yet.");
        return;
      }

      ucpLogBuildEvent("add_to_cart");

      try {
        const res = await fetch("/cart/add.js", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ items })
        });

        if (!res.ok) {
          await openCartBetaModalFlow_();
          return;
        }
        await openCartBetaModalFlow_();
      } catch (e) {
        await openCartBetaModalFlow_();
      }
    }

    if ($addToCart) $addToCart.addEventListener("click", () => addBuildToCart());
    if ($mobileCart) {
      $mobileCart.addEventListener("click", (e) => {
        e.stopPropagation();
        addBuildToCart();
      });
    }

    // ---------- Pick + Variant click handlers ----------
    function rerenderPreserveScroll() {
      const y = window.scrollY || 0;
      const list = state.cache.get(state.tab) || [];
      renderHead();
      renderRows(list);
      window.scrollTo(0, y);
    }

    root.addEventListener("click", (e) => {
      const target = getEventTargetElement(e);
      if (!target) return;

      const removePickedBtn = target.closest("[data-remove-picked]");
      if (removePickedBtn) {
        const tab = (removePickedBtn.getAttribute("data-remove-picked") || "").trim();
        if (!tab) return;

        const idxAttr = removePickedBtn.getAttribute("data-remove-idx");

        if (idxAttr !== null && idxAttr !== "") {
          removePickedAt(tab, Number(idxAttr));
        } else {
          clearPicked(tab);
        }

        renderPicked();
        const list = state.cache.get(state.tab) || [];
        renderHead();
        renderRows(list);
        return;
      }

      const priceSortBtn = target.closest("#ucp-pcb-sort-price");
      if (priceSortBtn) {
        cyclePriceSort(state.tab);
        rerenderPreserveScroll();
        return;
      }

      const optBtn = target.closest("[data-variant-opt-index]");
      if (optBtn) {
        const pid = normId(optBtn.getAttribute("data-product-id"));
        const idx = Number(optBtn.getAttribute("data-variant-opt-index"));
        const val = optBtn.getAttribute("data-variant-opt-value");

        const list = state.cache.get(state.tab) || [];
        const p = list.find((x) => normId(x.productId) === pid);
        if (!p) return;

        const cur = getActiveVariant(state.tab, p);
        const next = resolveVariantByOption(p, cur, idx, val);
        if (!next) return;

        setActiveVariant(state.tab, p, next.id);
        rerenderPreserveScroll();
        return;
      }

      const btn = target.closest("[data-pick]");
      if (!btn) return;

      const tab = btn.getAttribute("data-pick");
      const pid = normId(btn.getAttribute("data-product"));

      const list = state.cache.get(tab) || [];
      const p = list.find((x) => normId(x.productId) === pid);
      if (!p) return;

      const av = getActiveVariant(tab, p);

      const item = buildPickedItemFromActiveVariant(tab, p, av);
      const added = addOrIncPicked(tab, item, 1);
      if (!added) return;

      enforceDependencies(tab);
      renderPicked();

      const currentList = state.cache.get(state.tab) || [];
      renderRows(currentList);
    });

    if ($removeAll) {
      $removeAll.addEventListener("click", () => {
        state.picked = {};
        ucpHandleBuildChanged_();
        renderPicked();
        const list = state.cache.get(state.tab) || [];
        renderRows(list);
      });
    }

    function openQuoteModalFlow_() {
      if (pickedLineCount() <= 0) {
        alert("No parts selected yet.");
        return;
      }

      const snap = window.UCP_PCB_API?.getSnapshot?.() || null;
      const quoteState = ucpEnsureQuoteStateForSnapshot_(snap);
      const code = quoteState.quoteCode;
      const version = quoteState.quoteVersion;
      const links = ucpBuildLinksForQuote_(snap, code, version);

      ucpSetQuoteCodeInDom_(code);
      ucpSetQuoteVersionInDom_(version);
      ucpSetQuoteLinkInDom_(links.quoteLink || links.buildLink);
      ucpSetApprovalLinkInDom_(links.approvalLink);

      if ($quoteModal) {
        setQuoteModalOpen(true);
      } else {
        alert(code);
      }

      ucpLogRequestQuoteOnce_(code, {
        quoteVersion: version,
        buildLink: links.buildLink,
        quoteLink: links.quoteLink,
        approvalLink: links.approvalLink
      });
    }

    async function copyQuoteCode_() {
      const code = ucpNormalizeQuoteCode_(ucpReadQuoteCodeFromDom_());
      if (!code) return;

      const ok = await copyToClipboard(code);
      alert(ok ? "Copied" : "Copy failed. Please copy manually.");
    }

    async function copyQuoteLink_() {
      if (!$quoteLinkField) return;
      const val = "value" in $quoteLinkField ? $quoteLinkField.value : $quoteLinkField.textContent;
      const link = String(val || "").trim();
      if (!link) return;
      const ok = await copyToClipboard(link);
      alert(ok ? "Link copied" : "Copy failed. Please copy manually.");
    }

    function openQuoteMessenger_() {
      const url = ucpGetMessengerUrl_();
      if (!url) {
        alert("Messenger link is not configured yet.");
        return;
      }
      try {
        window.open(url, "_blank", "noopener");
      } catch (e) {
        window.open(url, "_blank");
      }
    }

    const $shareHint = root.querySelector("#ucp-pcb-hint-share");
    const SHARE_HINT_ENABLED = cfg && cfg.hints_enabled !== false;
    const SHARE_HINT_DEFAULT = $shareHint
      ? String($shareHint.textContent || "").trim() || String(cfg.hint_share_text || "").trim()
      : "";
    let shareHintTimer = null;
    const SHARE_LABEL = $share ? String($share.textContent || "").trim() || "Share" : "Share";
    const MOBILE_SHARE_LABEL = $mobileShare ? String($mobileShare.textContent || "").trim() || "Share" : "Share";
    const DESKTOP_DOCK_SHARE_LABEL =
      $desktopDockShare ? String($desktopDockShare.textContent || "").trim() || "Share" : "Share";
    const SAVE_BUILD_LABEL = $saveBuild ? String($saveBuild.textContent || "").trim() || "Save Build" : "Save Build";
    const MOBILE_SAVE_BUILD_LABEL =
      $mobileSaveBuild ? String($mobileSaveBuild.textContent || "").trim() || "Save" : "Save";
    const DESKTOP_DOCK_SAVE_BUILD_LABEL =
      $desktopDockSaveBuild ? String($desktopDockSaveBuild.textContent || "").trim() || "Save Build" : "Save Build";
    let shareLabelTimer = null;
    let saveBuildLabelTimer = null;
    let saveBuildInFlight = false;

    function setShareHint_(msg) {
      if (!$shareHint || !SHARE_HINT_ENABLED) return;
      const text = String(msg || "").trim();
      if (!text) return;

      $shareHint.textContent = text;
      $shareHint.hidden = false;

      if (shareHintTimer) clearTimeout(shareHintTimer);
      shareHintTimer = setTimeout(() => {
        if (SHARE_HINT_DEFAULT) {
          $shareHint.textContent = SHARE_HINT_DEFAULT;
          $shareHint.hidden = false;
        } else {
          $shareHint.textContent = "";
          $shareHint.hidden = true;
        }
      }, 2400);
    }

    function flashShareButtons_(ok) {
      const label = ok ? "Copied" : "Copy failed";
      if ($share) $share.textContent = label;
      if ($mobileShare) $mobileShare.textContent = label;
      if ($desktopDockShare) $desktopDockShare.textContent = label;

      if (shareLabelTimer) clearTimeout(shareLabelTimer);
      shareLabelTimer = setTimeout(() => {
        if ($share) $share.textContent = SHARE_LABEL;
        if ($mobileShare) $mobileShare.textContent = MOBILE_SHARE_LABEL;
        if ($desktopDockShare) $desktopDockShare.textContent = DESKTOP_DOCK_SHARE_LABEL;
      }, 1200);
    }

    function setSaveBuildButtonsLabel_(label) {
      if ($saveBuild) $saveBuild.textContent = label;
      if ($mobileSaveBuild) $mobileSaveBuild.textContent = label;
      if ($desktopDockSaveBuild) $desktopDockSaveBuild.textContent = label;
    }

    function setSaveBuildButtonsDisabled_(disabled) {
      if ($saveBuild) $saveBuild.disabled = !!disabled;
      if ($mobileSaveBuild) $mobileSaveBuild.disabled = !!disabled;
      if ($desktopDockSaveBuild) $desktopDockSaveBuild.disabled = !!disabled;
    }

    function restoreSaveBuildButtons_() {
      if ($saveBuild) $saveBuild.textContent = SAVE_BUILD_LABEL;
      if ($mobileSaveBuild) $mobileSaveBuild.textContent = MOBILE_SAVE_BUILD_LABEL;
      if ($desktopDockSaveBuild) $desktopDockSaveBuild.textContent = DESKTOP_DOCK_SAVE_BUILD_LABEL;
      setSaveBuildButtonsDisabled_(false);
      saveBuildInFlight = false;
    }

    function setSaveBuildBusy_(busy) {
      if (saveBuildLabelTimer) {
        clearTimeout(saveBuildLabelTimer);
        saveBuildLabelTimer = null;
      }
      if (busy) {
        saveBuildInFlight = true;
        setSaveBuildButtonsDisabled_(true);
        setSaveBuildButtonsLabel_("Saving...");
        return;
      }
      restoreSaveBuildButtons_();
    }

    function flashSaveBuildButtons_(label, duration = 1400) {
      if (saveBuildLabelTimer) clearTimeout(saveBuildLabelTimer);
      setSaveBuildButtonsDisabled_(false);
      setSaveBuildButtonsLabel_(label);
      saveBuildInFlight = false;
      saveBuildLabelTimer = setTimeout(() => {
        restoreSaveBuildButtons_();
      }, duration);
    }

    function ucpBuildSaveLoginUrl_() {
      const url = new URL("/account/login", window.location.origin);
      url.searchParams.set("return_url", window.location.href);
      return url.toString();
    }

    function ucpRedirectToSaveBuildLogin_() {
      const loginUrl = ucpBuildSaveLoginUrl_();
      showBuilderNotice("Sign in to save builds.");
      window.setTimeout(() => {
        window.location.assign(loginUrl);
      }, 240);
    }

    function ucpBuildSnapshotForSave_() {
      try {
        const snap =
          window.UCP_PCB_API && typeof window.UCP_PCB_API.getSnapshot === "function"
            ? window.UCP_PCB_API.getSnapshot()
            : null;
        if (!snap || typeof snap !== "object" || Array.isArray(snap)) return null;
        const quoteState = ucpGetActiveQuoteState_() || {};
        return {
          ...snap,
          meta: {
            ...(snap.meta && typeof snap.meta === "object" ? snap.meta : {}),
            quoteCode: String(ucpTryQuoteCode_() || "").trim(),
            quoteVersion: Number(quoteState.quoteVersion) || 0,
            generatedAt: new Date().toISOString()
          }
        };
      } catch (e) {
        return null;
      }
    }

    function ucpBuildSaveRequestBody_(buildName) {
      let buildPayload = null;
      try {
        buildPayload = buildSharePayload() || null;
      } catch (e) {}

      if (!buildPayload || typeof buildPayload !== "object" || !Object.keys(buildPayload).length) {
        return null;
      }

      const customer = ucpGetCustomerSnapshot_();
      const quoteState = ucpGetActiveQuoteState_() || {};
      const body = {
        build_name: buildName,
        build_payload: buildPayload,
        quote_code: String(ucpTryQuoteCode_() || "").trim(),
        quote_version: quoteState.quoteVersion ? String(quoteState.quoteVersion).trim() : "",
        customer_email_snapshot: customer ? String(customer.email || "").trim() : "",
        customer_name_snapshot: ucpGetCustomerNameSnapshot_()
      };
      const buildSnapshot = ucpBuildSnapshotForSave_();
      if (buildSnapshot) {
        body.build_snapshot = buildSnapshot;
      }
      return body;
    }

    async function ucpSaveBuild_() {
      if (saveBuildInFlight) return;

      if (pickedLineCount() <= 0) {
        showBuilderNotice("Select at least one part before saving.");
        return;
      }

      const customer = ucpGetCustomerSnapshot_();
      if (!customer || !customer.id) {
        ucpLogBuildEvent("save_build_blocked", { saveBuildStatus: "blocked" });
        ucpRedirectToSaveBuildLogin_();
        return;
      }

      let buildName = window.prompt("Name this build", "My Build");
      if (buildName === null) return;

      buildName = String(buildName || "").replace(/\s+/g, " ").trim() || "My Build";
      const requestBody = ucpBuildSaveRequestBody_(buildName);
      if (!requestBody) {
        showBuilderNotice("Select at least one part before saving.");
        return;
      }

      ucpLogBuildEvent("save_build_click", {
        quoteCode: requestBody.quote_code,
        savedBuildName: buildName,
        saveBuildStatus: "clicked"
      });

      setSaveBuildBusy_(true);

      try {
        const response = await fetch(MY_BUILDS_SAVE_ENDPOINT, {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify(requestBody)
        });

        let data = null;
        try {
          data = await response.json();
        } catch (e) {}

        const errorCode =
          data && typeof data === "object" && !Array.isArray(data) ? String(data.error || "").trim() : "";

        if (!response.ok || !data || !data.ok) {
          if (errorCode === "not_logged_in") {
            ucpLogBuildEvent("save_build_blocked", {
              quoteCode: requestBody.quote_code,
              savedBuildName: buildName,
              saveBuildStatus: "blocked"
            });
            restoreSaveBuildButtons_();
            ucpRedirectToSaveBuildLogin_();
            return;
          }

          throw new Error(errorCode || `save_build_request_failed_${response.status}`);
        }

        ucpLogBuildEvent("save_build_success", {
          quoteCode: requestBody.quote_code,
          savedBuildId: String(data.savedBuildId || "").trim(),
          savedBuildHandle: String(data.savedBuildHandle || "").trim(),
          savedBuildName: String(data.buildName || buildName).trim(),
          saveBuildStatus: "saved"
        });

        flashSaveBuildButtons_("Saved");
        showBuilderNotice(
          MY_BUILDS_PAGE_URL
            ? "Build saved. Open My Builds to manage it."
            : "Build saved."
        );
      } catch (error) {
        const summary = ucpSummarizeSaveBuildError_(error && error.message ? error.message : error);
        ucpLogBuildEvent("save_build_failed", {
          quoteCode: requestBody.quote_code,
          savedBuildName: buildName,
          saveBuildStatus: "failed"
        });
        flashSaveBuildButtons_("Save failed");
        showBuilderNotice(summary);
      }
    }

    if ($share) {
      $share.addEventListener("click", async () => {
        let link = location.href;

        try {
          const snap = window.UCP_PCB_API?.getSnapshot?.();
          const quoteState = ucpEnsureQuoteStateForShare_(snap);
          const gen = window.UCP_PCB_BuildLink?.generateBuildLink;
          let buildLink = link;
          if (snap && typeof gen === "function") {
            buildLink = String(gen(snap, { path: window.location.pathname }) || "").trim() || link;
          }
          const quoteCode = ucpNormalizeQuoteCode_(quoteState.quoteCode);
          const quoteVersion = quoteState.quoteVersion || "";
          if (quoteCode) {
            const quoteLink = ucpBuildQuoteLookupLink_(quoteCode, quoteVersion, { snapshot: snap });
            link = quoteLink || ucpAppendQuoteToUrl_(buildLink, quoteCode, quoteVersion);
            try {
              const approvalLink = ucpBuildQuoteApprovalLink_(quoteCode, quoteVersion);
              ucpLogBuildEvent("share", {
                quoteCode,
                quoteVersion,
                quoteLink: link,
                buildLink,
                approvalLink
              });
            } catch (e) {}
          } else {
            link = buildLink;
          }
        } catch (e) {}

        const ok = await copyToClipboard(link);
        if (ok) document.dispatchEvent(new CustomEvent("ucp:pcb:share_copied"));
        setShareHint_(ok ? "Link copied." : "Copy failed. Use the address bar.");
        flashShareButtons_(ok);
      });
    }
    if ($saveBuild) {
      $saveBuild.addEventListener("click", async (e) => {
        e.preventDefault();
        await ucpSaveBuild_();
      });
    }
    if ($requestQuote) {
      $requestQuote.addEventListener("click", (e) => {
        e.preventDefault();
        openQuoteModalFlow_();
      });
    }

    if ($quoteCopyBtn) {
      $quoteCopyBtn.addEventListener("click", (e) => {
        e.preventDefault();
        copyQuoteCode_();
      });
    }

    if ($quoteCopyLinkBtn) {
      $quoteCopyLinkBtn.addEventListener("click", (e) => {
        e.preventDefault();
        copyQuoteLink_();
      });
    }

    if ($quoteMessengerBtn) {
      $quoteMessengerBtn.addEventListener("click", (e) => {
        e.preventDefault();
        openQuoteMessenger_();
      });
    }





    if ($pdf) $pdf.addEventListener("click", () => openPdfWindow());

    // ---------- Control listeners ----------
    const rerender = () => {
      const list = state.cache.get(state.tab) || [];
      renderRows(list);
    };

    [$brand, $socket, $chipset, $gpuBrand, $boardPartner, $formFactor, $watts, $coolerType, $caseFf].forEach((el) => {
      if (!el) return;
      el.addEventListener("change", rerender);
    });

    if ($availableOnly) {
      $availableOnly.checked = !!state.availableOnly;
      $availableOnly.addEventListener("change", () => {
        state.availableOnly = AVAILABILITY_FILTER_ENABLED && !!$availableOnly.checked;
        rerender();
      });
    }

    if ($price) {
      $price.addEventListener("input", () => {
        safeSetText($priceOut, moneyPHP(Number($price.value || 0)));
        rerender();
      });
    }

    $tabs.forEach((b) => b.addEventListener("click", () => setActiveTab(b.dataset.tab)));

    // Keep PC Builder sticky tabs below Shopify's mega menu when the theme menu is open.
    function initMegaMenuStackGuard_() {
      const menuSelectors = [
        '[data-menu-list-id^="MegaMenuList"]',
        '[data-menu-list-id="MegaMenuList-1"]',
        ".mega-menu__column",
        ".mega-menu__column--span-1",
        "header-drawer[open]",
        "header-drawer .menu-drawer",
        ".menu-drawer",
        "#menu-drawer",
        '[id^="menu-drawer"]',
        "[data-menu-drawer]",
        ".mobile-menu",
        ".mobile-menu-drawer"
      ];
      const triggerSelectors = [
        '.menu-list__link-title[aria-expanded="true"]',
        '[aria-controls^="MegaMenuList"][aria-expanded="true"]',
        '.header__icon--menu[aria-expanded="true"]',
        '[aria-controls*="menu-drawer"][aria-expanded="true"]',
        '[aria-controls*="MenuDrawer"][aria-expanded="true"]',
        '[aria-controls*="mobile-menu"][aria-expanded="true"]'
      ];
      let raf = null;

      function isVisible_(el) {
        if (!el || !el.getClientRects || el.getClientRects().length === 0) return false;
        const style = window.getComputedStyle(el);
        if (!style) return false;
        const rect = el.getBoundingClientRect();
        const vw = window.innerWidth || document.documentElement.clientWidth || 0;
        const vh = window.innerHeight || document.documentElement.clientHeight || 0;
        const intersectsViewport = rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.bottom > 0 && rect.left < vw && rect.top < vh;
        return intersectsViewport && style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity || 1) > 0;
      }

      function hasOpenMegaMenu_() {
        const visibleMenu = menuSelectors.some((selector) =>
          Array.from(document.querySelectorAll(selector)).some(isVisible_)
        );
        if (visibleMenu) return true;

        return triggerSelectors.some((selector) =>
          Array.from(document.querySelectorAll(selector)).some((el) => {
            if (!isVisible_(el)) return false;
            const controls = String(el.getAttribute("aria-controls") || "").trim();
            if (!controls) return true;
            const controlled = document.getElementById(controls);
            return controlled ? isVisible_(controlled) : true;
          })
        );
      }

      function sync() {
        raf = null;
        if (hasOpenMegaMenu_()) root.setAttribute("data-mega-menu-open", "1");
        else root.removeAttribute("data-mega-menu-open");
      }

      function scheduleSync() {
        if (raf) return;
        raf = requestAnimationFrame(sync);
      }

      const events = ["pointerover", "pointerout", "focusin", "focusout", "click", "keydown", "scroll", "resize"];
      events.forEach((eventName) => {
        const target = eventName === "scroll" || eventName === "resize" ? window : document;
        target.addEventListener(eventName, scheduleSync, { passive: true });
      });

      const observer = new MutationObserver(scheduleSync);
      observer.observe(document.body, {
        attributes: true,
        subtree: true,
        childList: true,
        attributeFilter: ["aria-expanded", "hidden", "class", "style", "data-menu-list-id"]
      });

      scheduleSync();
    }

    // ---------- Mobile sticky tabs (peek on scroll up) ----------
    function initMobilePeekTabs() {
      const tabsWrap = root.querySelector(".ucp-pcb__tabs");
      if (!tabsWrap) return;

      const mq = window.matchMedia("(max-width: 768px)");
      let cleanup = null;

      function enable() {
        let lastY = window.scrollY || 0;
        let tabsTopAbs = 0;
        let raf = null;

        function measure() {
          const rect = tabsWrap.getBoundingClientRect();
          tabsTopAbs = (window.scrollY || 0) + rect.top;
        }

        window.__UCP_PCB_MEASURE_TABS = measure;

        function setState(sticky, peek) {
          if (sticky) root.setAttribute("data-tabs-sticky", "1");
          else root.removeAttribute("data-tabs-sticky");

          if (peek) root.setAttribute("data-tabs-peek", "1");
          else root.setAttribute("data-tabs-peek", "0");
        }

        function onScroll() {
          if (raf) return;

          raf = requestAnimationFrame(() => {
            raf = null;

            const y = window.scrollY || 0;
            const delta = y - lastY;

            const stickyActive = y > tabsTopAbs + 12;

            if (!stickyActive) {
              root.removeAttribute("data-tabs-sticky");
              root.removeAttribute("data-tabs-peek");
              lastY = y;
              return;
            }

            if (Math.abs(delta) < 8) {
              lastY = y;
              return;
            }

            if (delta < 0) setState(true, true);
            if (delta > 0) setState(true, false);

            lastY = y;
          });
        }

        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            measure();
            onScroll();
          })
        );

        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", measure, { passive: true });

        return () => {
          window.removeEventListener("scroll", onScroll);
          window.removeEventListener("resize", measure);
          root.removeAttribute("data-tabs-sticky");
          root.removeAttribute("data-tabs-peek");
          if (window.__UCP_PCB_MEASURE_TABS === measure) delete window.__UCP_PCB_MEASURE_TABS;
        };
      }

      function apply() {
        if (mq.matches) {
          if (!cleanup) cleanup = enable();
        } else {
          if (cleanup) {
            cleanup();
            cleanup = null;
          }
        }
      }

      apply();
      if (mq.addEventListener) mq.addEventListener("change", apply);
      else mq.addListener(apply);
    }

    if (MOBILE_MQ.addEventListener) {
      MOBILE_MQ.addEventListener("change", () => {
        renderHead();
        const list = state.cache.get(state.tab) || [];
        renderRows(list);
      });
    } else {
      MOBILE_MQ.addListener(() => {
        renderHead();
        const list = state.cache.get(state.tab) || [];
        renderRows(list);
      });
    }

    // ---------- Build Link adapter (exposed API) ----------
    window.UCP_PCB_API = window.UCP_PCB_API || {};

    function ucpQuoteLabelForTab_(tab) {
      const map = {
        processor: "CPU",
        motherboard: "Motherboard",
        memory: "RAM",
        gpu: "GPU",
        cpucooler: "CPU Cooler",
        ssd: "SSD",
        powersupply: "Power Supply",
        case: "Case",
        casefans: "Case Fans",
        other: "Other"
      };

      const key = String(tab || "").trim();
      return map[key] || key.toUpperCase();
    }

    function ucpVariantForPicked_(p) {
      if (!p) return null;
      const variants = variantsOfProduct(p);
      if (!variants.length) return null;
      const vid = normId(p.variantId);
      if (vid) {
        const hit = variants.find((v) => normId(v.id) === vid);
        if (hit) return hit;
      }
      return variants[0] || null;
    }

    function ucpQuoteItemsFromPicked_() {
      const order = [
        "processor",
        "motherboard",
        "memory",
        "gpu",
        "cpucooler",
        "ssd",
        "powersupply",
        "case",
        "casefans",
        "other"
      ];

      const items = [];

      order.forEach((tab) => {
        const picked = state.picked?.[tab];
        if (!picked) return;

        const list = Array.isArray(picked) ? picked : [picked];
        list.forEach((it) => {
          if (!it) return;
          const qtyRaw = Number(it.qty || 1);
          const qty = Number.isFinite(qtyRaw) && qtyRaw > 0 ? qtyRaw : 1;
          const av = ucpVariantForPicked_(it);
          const variantTitle =
            String(av?.title || it.variantTitle || it.variant_title || (it.variant && it.variant.title) || "").trim();
          const productHandle = String(it.handle || it.productHandle || "").trim();
          const variantId = String(av?.id ?? it.variantId ?? it.variant_id ?? "").trim();
          const productUrl = productHandle
            ? `/products/${encodeURIComponent(productHandle)}${variantId ? `?variant=${encodeURIComponent(normId(variantId))}` : ""}`
            : "";
          const base = Number(av?.price ?? it.price ?? 0);
          const eff = Number(effectivePriceForDisplay(tab, it, av) ?? base);
          const lineBase = base * qty;
          const lineEff = eff * qty;
          const variantImage =
            variantImageUrl_(av) ||
            normalizeImageUrl_(it.variantImage) ||
            normalizeImageUrl_(it.variant_image) ||
            normalizeImageUrl_(it.variant_image_url) ||
            normalizeImageUrl_(it.variantImageUrl);
          const image = quoteImageForItem_(it, av);

          items.push({
            key: tab,
            label: ucpQuoteLabelForTab_(tab),
            title: String(it.title || ""),
            variantTitle,
            image,
            variantImage,
            variant_image: variantImage,
            quick_description: it.quick_description || it.quickDescription || "",
            vendor: String(it.vendor || ""),
            qty,
            priceBase: lineBase,
            priceEffective: lineEff,
            productId: String(it.productId || ""),
            variantId,
            handle: productHandle,
            productUrl
          });
        });
      });

      return items;
    }

    // Snapshot used to generate a build link
    window.UCP_PCB_API.getSnapshot = function () {
      const getOne = (tabKey) => {
        const v = state.picked?.[tabKey];
        if (!v || Array.isArray(v)) return null;
        const vid = normId(v.variantId);
        const n = Number(vid);
        return Number.isFinite(n) ? n : null;
      };

      const totals = ucpComputeTotals_();

      return {
        selected: {
          cpu: getOne("processor"),
          mb: getOne("motherboard"),
          ram: getOne("memory"),
          gpu: getOne("gpu"),
          ssd: getOne("ssd"),
          cooler: getOne("cpucooler"),
          psu: getOne("powersupply"),
          case: getOne("case")
        },
        meta: {
          subtotalDisplay: ($subtotal && $subtotal.textContent) ? $subtotal.textContent.trim() : "",
          promoHandle: totals.promoHandle || "",
          promoLabel: totals.promoLabel || "",
          promoBadgeLabel: totals.promoBadgeLabel || "",
          promoValid: !!totals.promoValid,
          addonRuleHandles: Array.isArray(totals.addonRuleHandles) ? totals.addonRuleHandles : [],
          addonRuleLabels: Array.isArray(totals.addonRuleLabels) ? totals.addonRuleLabels : []
        },
        items: ucpQuoteItemsFromPicked_(),
        totals: {
          subtotalBase: totals.rawSubtotal,
          rawBundleDiscount: totals.rawBundleDiscount,
          savings: totals.bundleDiscount,
          promoDiscount: totals.promoDiscount,
          promoValid: !!totals.promoValid,
          promoStackWithBundleDiscount: !!totals.promoStackWithBundleDiscount,
          promoSuppressedByAddon: !!totals.promoSuppressedByAddon,
          addonDiscountTotal: totals.addonDiscountTotal,
          addonDiscountCount: totals.addonDiscountCount,
          addonDiscountRows: Array.isArray(totals.addonDiscountRows) ? totals.addonDiscountRows : [],
          addonSuppressesBundleDiscount: !!totals.addonSuppressesBundleDiscount,
          addonSuppressesPrimaryPromo: !!totals.addonSuppressesPrimaryPromo,
          manualOff: totals.manualOff,
          payableSubtotal: totals.payableSubtotal,
          total: totals.payableSubtotal
        }
      };
    };

    try {
      window.UCP_PCB_GET_TOTALS = ucpComputeTotals_;
    } catch (e) {}

    function ucpBuildSnapshotForApproval_() {
      const labelMap = {
        processor: "CPU",
        motherboard: "Motherboard",
        memory: "RAM",
        gpu: "GPU",
        cpucooler: "CPU Cooler",
        ssd: "SSD",
        powersupply: "Power Supply",
        case: "Case",
        casefans: "Case Fans",
        other: "Other"
      };

      const order = [
        "processor",
        "motherboard",
        "memory",
        "gpu",
        "cpucooler",
        "ssd",
        "powersupply",
        "case",
        "casefans",
        "other"
      ];

      const items = [];

      order.forEach((tab) => {
        const picked = state.picked?.[tab];
        if (!picked) return;

        const list = Array.isArray(picked) ? picked : [picked];
        list.forEach((it) => {
          if (!it) return;
          const qty = Number(it.qty || 1);
          const price = Number(it.price || 0) * qty;
          const av = ucpVariantForPicked_(it);
          const availabilityTier = ucpEffectiveAvailTierInt_(it, av);
          const availabilityLabel = ucpAvailabilityTextForTier_(availabilityTier, it, av);
          const isImmediate = availabilityTier === 1;
          const variantTitle =
            it.variantTitle ||
            it.variant_title ||
            (it.variant && it.variant.title) ||
            (it.variantTitle === "" ? "" : (it.variantTitle || ""));

          const variantImage =
            variantImageUrl_(av) ||
            normalizeImageUrl_(it.variantImage) ||
            normalizeImageUrl_(it.variant_image) ||
            normalizeImageUrl_(it.variant_image_url) ||
            normalizeImageUrl_(it.variantImageUrl);
          const image = quoteImageForItem_(it, av);

          items.push({
            key: tab,
            label: labelMap[tab] || tab,
            title: it.title || "",
            variantTitle: variantTitle || "",
            price,
            priceDisplay: moneyPHP(price),
            image,
            variantImage,
            variant_image: variantImage,
            qty,
            availabilityTier,
            availabilityLabel,
            isImmediate
          });
        });
      });

      const delayedItemCount = items.reduce((count, it) => count + (it && it.isImmediate === false ? 1 : 0), 0);

      const totals = ucpComputeTotals_();

      const quoteState = ucpGetActiveQuoteState_();
      const snap = window.UCP_PCB_API.getSnapshot();
      const links = ucpBuildLinksForQuote_(snap, quoteState.quoteCode, quoteState.quoteVersion);

      return {
        items,
        savings: totals.bundleDiscount,
        rawBundleDiscount: totals.rawBundleDiscount,
        promoDiscount: totals.promoDiscount,
        promoHandle: totals.promoHandle,
        promoLabel: totals.promoLabel,
        promoBadgeLabel: totals.promoBadgeLabel,
        promoValid: totals.promoValid,
        promoStackWithBundleDiscount: totals.promoStackWithBundleDiscount,
        promoSuppressedByAddon: totals.promoSuppressedByAddon,
        addonDiscountTotal: totals.addonDiscountTotal,
        addonDiscountCount: totals.addonDiscountCount,
        addonDiscountRows: Array.isArray(totals.addonDiscountRows) ? totals.addonDiscountRows : [],
        addonRuleHandles: Array.isArray(totals.addonRuleHandles) ? totals.addonRuleHandles : [],
        addonRuleLabels: Array.isArray(totals.addonRuleLabels) ? totals.addonRuleLabels : [],
        addonSuppressesBundleDiscount: totals.addonSuppressesBundleDiscount,
        addonSuppressesPrimaryPromo: totals.addonSuppressesPrimaryPromo,
        manualOff: totals.manualOff,
        subtotal: totals.payableSubtotal,
        subtotalBase: totals.rawSubtotal,
        total: totals.payableSubtotal,
        savingsDisplay: moneyPHP(totals.bundleDiscount),
        promoDiscountDisplay: moneyPHP(totals.promoDiscount),
        addonDiscountTotalDisplay: moneyPHP(totals.addonDiscountTotal),
        manualOffDisplay: moneyPHP(totals.manualOff),
        subtotalDisplay: moneyPHP(totals.payableSubtotal),
        payableSubtotalDisplay: moneyPHP(totals.payableSubtotal),
        subtotalBaseDisplay: moneyPHP(totals.rawSubtotal),
        totalDisplay: moneyPHP(totals.payableSubtotal),
        quoteCode: quoteState.quoteCode,
        quoteVersion: quoteState.quoteVersion,
        hasDelayedItems: delayedItemCount > 0,
        delayedItemCount,
        buildLink: links.buildLink,
        quoteLink: links.quoteLink,
        approvalLink: links.approvalLink
      };
    }

    try {
      window.__UCP_PCB_GET_BUILD_SNAPSHOT__ = ucpBuildSnapshotForApproval_;
    } catch (e) {}

    // Selection function used when opening a build link
    window.UCP_PCB_API.selectVariantById = async function (categoryKey, variantId) {
      const cat = String(categoryKey || "").trim().toLowerCase();
      const map = {
        cpu: "processor",
        mb: "motherboard",
        motherboard: "motherboard",
        ram: "memory",
        memory: "memory",
        gpu: "gpu",
        ssd: "ssd",
        cooler: "cpucooler",
        cpucooler: "cpucooler",
        psu: "powersupply",
        powersupply: "powersupply",
        case: "case"
      };

      const tab = map[cat];
      if (!tab) return false;

      const wantVid = String(variantId || "").trim();
      const wantNum = Number(wantVid);
      if (!Number.isFinite(wantNum)) return false;

      // Ensure tab data is loaded, without changing current UI tab
      if (!state.cache.has(tab)) {
        try {
          const products = await fetchAllProducts(tab);
          state.cache.set(tab, products);
        } catch (e) {
          return false;
        }
      }

      const list = state.cache.get(tab) || [];

      let hitProduct = null;
      let hitVariant = null;

      for (const p of list) {
        const vars = variantsOfProduct(p);
        const v = vars.find((x) => Number(normId(x.id)) === wantNum);
        if (v) {
          hitProduct = p;
          hitVariant = v;
          break;
        }
      }

      if (!hitProduct || !hitVariant) return false;

      setActiveVariant(tab, hitProduct, hitVariant.id);

      const item = buildPickedItemFromActiveVariant(tab, hitProduct, hitVariant);
      const added = addOrIncPicked(tab, item, 1);
      if (!added) return false;

      enforceDependencies(tab);
      renderPicked();

      // Refresh current visible list only if user is on that tab
      if (state.tab === tab) {
        renderRows(state.cache.get(tab) || []);
      }

      return true;
    };

    window.UCP_PCB_API.applyBuildPayload = async function (payload, opts = {}) {
      if (!payload || typeof payload !== "object") return false;

      const aliasMap = {
        cpu: "processor",
        processor: "processor",
        mb: "motherboard",
        motherboard: "motherboard",
        ram: "memory",
        memory: "memory",
        gpu: "gpu",
        ssd: "ssd",
        cooler: "cpucooler",
        cpucooler: "cpucooler",
        psu: "powersupply",
        powersupply: "powersupply",
        case: "case",
        casefans: "casefans",
        other: "other"
      };

      const next = {};
      Object.keys(payload).forEach((k) => {
        if (!payload[k]) return;
        const tab = aliasMap[k] || k;
        if (!tab) return;
        next[tab] = payload[k];
      });

      if (!Object.keys(next).length) return false;

      const beforeCount = pickedLineCount();
      const expectedCount = ucpCountRestorePayloadLines_(next);
      state.pendingPickByTab = Object.assign({}, state.pendingPickByTab || {}, next);

      try {
        const prefetchTabs = Object.keys(next).filter((tab) => !state.cache.has(tab));
        if (prefetchTabs.length) {
          await Promise.all(
            prefetchTabs.map(async (tab) => {
              try {
                const products = await fetchAllProducts(tab);
                state.cache.set(tab, products);
              } catch (e) {}
            })
          );
        }

        const restorePromise = applyPendingPickAllTabs_();
        ucpSetBuildRestorePromise_(restorePromise, {
          source: opts.source || "build",
          suppressRestoreLoading: !!opts.suppressRestoreLoading,
          beforeCount,
          expectedCount,
          failureMessage: opts.failureMessage || "We couldn't fully restore this build.",
          timeoutMessage: opts.timeoutMessage || "We couldn't fully restore this build."
        });
        await restorePromise;
        return true;
      } catch (e) {
        return false;
      }
    };

    const PROMO_DISCOVERY_SESSION_KEY = "ucp_pcb_promo_discovery_seen_session_v1";
    const PROMO_DISCOVERY_DISMISSED_UNTIL_KEY = "ucp_pcb_promo_discovery_dismissed_until_v1";
    let promoDiscoveryRefs_ = null;
    let promoDiscoveryCandidates_ = [];
    let promoDiscoveryIndex_ = 0;
    let promoDiscoveryEscapeBound_ = false;

    function ucpPromoTabLabel_(tab) {
      const map = {
        processor: "CPU",
        motherboard: "Motherboard",
        memory: "RAM",
        gpu: "GPU",
        cpucooler: "CPU Cooler",
        ssd: "SSD",
        powersupply: "Power Supply",
        case: "Case",
        casefans: "Case Fans",
        other: "Other"
      };
      return map[tab] || String(tab || "").replace(/[_-]+/g, " ");
    }

    function ucpPromoRequirementText_(req) {
      const label = String(req?.label || "").trim();
      const fallback = req?.variantId || req?.productId || "";
      const text = label || fallback;
      const qty = Number(req?.qty || 1);
      const qtyLabel = Number.isFinite(qty) && qty > 1 ? ` x${Math.round(qty)}` : "";
      return `${ucpPromoTabLabel_(req?.tab)}: ${text}${qtyLabel}`;
    }

    function ucpPromoDiscoveryCandidates_() {
      return ucpAvailablePromoRules_().filter((promo) => promo.publicVisibility === true);
    }

    function ucpPromoDiscoveryHasSharedParams_() {
      try {
        const sp = new URLSearchParams(window.location.search || "");
        const keys = [
          "quote",
          "v",
          "build",
          "buildId",
          "promo",
          "approved",
          "approve",
          "cpu",
          "mb",
          "mobo",
          "motherboard",
          "ram",
          "gpu",
          "ssd",
          "psu",
          "case",
          "cooler",
          "cpucooler"
        ];
        return keys.some((key) => sp.has(key));
      } catch (e) {}
      return false;
    }

    function ucpPromoDiscoveryOnboardingDue_() {
      if (cfg.onboarding_enabled === false) return false;
      if (ucpPromoDiscoveryHasSharedParams_()) return false;
      try {
        return localStorage.getItem("ucp_pcb_onboarded") !== "1";
      } catch (e) {
        return true;
      }
    }

    function ucpPromoDiscoveryDismissed_() {
      if (PROMO_DISCOVERY_VISIBILITY_MODE !== "cooldown") return false;
      try {
        const until = Number(localStorage.getItem(PROMO_DISCOVERY_DISMISSED_UNTIL_KEY) || 0);
        return Number.isFinite(until) && until > Date.now();
      } catch (e) {}
      return false;
    }

    function ucpMarkPromoDiscoveryDismissed_() {
      if (PROMO_DISCOVERY_VISIBILITY_MODE === "cooldown") {
        try {
          const ms = PROMO_DISCOVERY_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
          localStorage.setItem(PROMO_DISCOVERY_DISMISSED_UNTIL_KEY, String(Date.now() + ms));
        } catch (e) {}
      }

      if (PROMO_DISCOVERY_VISIBILITY_MODE === "session" || PROMO_DISCOVERY_VISIBILITY_MODE === "cooldown") {
        try {
          sessionStorage.setItem(PROMO_DISCOVERY_SESSION_KEY, "1");
        } catch (e) {}
      }
    }

    function ucpPromoDiscoverySeenThisSession_() {
      if (PROMO_DISCOVERY_VISIBILITY_MODE === "always") return false;
      try {
        return sessionStorage.getItem(PROMO_DISCOVERY_SESSION_KEY) === "1";
      } catch (e) {}
      return false;
    }

    function ucpMarkPromoDiscoverySeenThisSession_() {
      if (PROMO_DISCOVERY_VISIBILITY_MODE === "always") return;
      try {
        sessionStorage.setItem(PROMO_DISCOVERY_SESSION_KEY, "1");
      } catch (e) {}
    }

    function ucpPromoDiscoveryAnotherModalOpen_() {
      const ids = [
        "ucp-pcb-quote-modal",
        "ucp-pcb-cartbeta-modal",
        "ucp-pcb-onboard-modal",
        "ucp-pcb-pay-modal",
        "ucp-pcb-approve-modal",
        "ucp-pcb-payment-modal"
      ];
      return ids.some((id) => {
        const el = document.getElementById(id);
        return el && !el.hidden;
      });
    }

    function ucpShouldShowPromoDiscovery_() {
      if (!PROMO_DISCOVERY_MODAL_ENABLED) return false;
      if (ucpPromoDiscoveryHasSharedParams_()) return false;
      if (ucpPromoDiscoveryOnboardingDue_()) return false;
      if (ucpPromoDiscoverySeenThisSession_()) return false;
      if (ucpPromoDiscoveryDismissed_()) return false;
      return ucpPromoDiscoveryCandidates_().length > 0;
    }

    function ucpSetPromoDiscoveryOpen_(open) {
      const refs = promoDiscoveryRefs_;
      if (!refs) return;
      const next = !!open;
      safeSetHidden(refs.overlay, !next);
      safeSetHidden(refs.modal, !next);
      document.body.style.overflow =
        next || root.classList.contains("ucp-pcb--drawerOpen") || ($quoteModal && !$quoteModal.hidden)
          ? "hidden"
          : "";
    }

    function ucpClosePromoDiscovery_(markDismissed = true) {
      if (markDismissed) ucpMarkPromoDiscoveryDismissed_();
      ucpSetPromoDiscoveryOpen_(false);
    }

    function ucpRenderPromoDiscoverySlide_() {
      const refs = promoDiscoveryRefs_;
      const promo = promoDiscoveryCandidates_[promoDiscoveryIndex_];
      if (!refs || !promo) return;

      const imageUrl = String(promo.imageUrl || "").trim();
      if (refs.imageWrap) refs.imageWrap.hidden = !imageUrl;
      if (refs.image) {
        if (imageUrl) refs.image.src = imageUrl;
        else refs.image.removeAttribute("src");
      }

      if (refs.badge) refs.badge.textContent = promo.badgeLabel || "PC Builder Promo";
      if (refs.title) refs.title.textContent = promo.promoLabel || promo.handle;
      if (refs.discount) refs.discount.textContent = `-${moneyPHP(promo.discountAmount)}`;
      if (refs.description) {
        refs.description.textContent = promo.description || "";
        refs.description.hidden = !promo.description;
      }
      if (refs.terms) {
        refs.terms.textContent = promo.terms || "";
        refs.terms.hidden = !promo.terms;
      }
      if (refs.reqList) {
        refs.reqList.innerHTML = (promo.requiredComponents || [])
          .map((req) => `<li>${escapeHtml(ucpPromoRequirementText_(req))}</li>`)
          .join("");
      }
      if (refs.counter) refs.counter.textContent = `${promoDiscoveryIndex_ + 1} / ${promoDiscoveryCandidates_.length}`;
      if (refs.prev) refs.prev.disabled = promoDiscoveryCandidates_.length <= 1;
      if (refs.next) refs.next.disabled = promoDiscoveryCandidates_.length <= 1;
      if (refs.apply) {
        refs.apply.disabled = false;
        refs.apply.textContent = "Add to build";
      }
    }

    async function ucpApplyPromoDiscoveryPromo_(promo) {
      const payload = ucpBuildPendingPickPayloadFromPromoRule_(promo);
      if (!payload) return false;

      const ok = await window.UCP_PCB_API.applyBuildPayload(payload, {
        source: "promo",
        suppressRestoreLoading: true,
        failureMessage: "We couldn't add this promo build.",
        timeoutMessage: "We couldn't add this promo build."
      });

      if (!ok) return false;
      const totals = ucpComputeTotals_();
      return totals.promoHandle === promo.handle && !!totals.promoValid && totals.promoDiscount > 0;
    }

    function ucpEnsurePromoDiscoveryModal_() {
      if (promoDiscoveryRefs_) return promoDiscoveryRefs_;

      const overlay = document.createElement("div");
      overlay.id = "ucp-pcb-promo-discovery-overlay";
      overlay.className = "ucp-pcb__quoteOverlay ucp-pcb__promoDiscoveryOverlay";
      overlay.hidden = true;

      const modal = document.createElement("div");
      modal.id = "ucp-pcb-promo-discovery-modal";
      modal.className = "ucp-pcb__quoteModal ucp-pcb__promoDiscoveryModal";
      modal.hidden = true;
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-label", "PC Builder promos");

      modal.innerHTML = `
        <div class="ucp-pcb__quoteModalHead ucp-pcb__promoDiscoveryHead">
          <div>
            <div class="ucp-pcb__promoDiscoveryEyebrow">Available promos</div>
            <strong>Choose a PC Builder promo</strong>
          </div>
          <button type="button" class="ucp-pcb__quoteClose" id="ucp-pcb-promo-discovery-close" aria-label="Close promo modal">X</button>
        </div>
        <div class="ucp-pcb__promoDiscoveryImage" data-promo-image-wrap hidden>
          <img data-promo-image alt="">
        </div>
        <div class="ucp-pcb__promoDiscoveryBody">
          <div class="ucp-pcb__promoDiscoveryTopline">
            <span class="ucp-pcb__promoDiscoveryBadge" data-promo-badge></span>
            <strong class="ucp-pcb__promoDiscoveryDiscount" data-promo-discount></strong>
          </div>
          <h3 class="ucp-pcb__promoDiscoveryTitle" data-promo-title></h3>
          <p class="ucp-pcb__promoDiscoveryDesc" data-promo-description hidden></p>
          <div class="ucp-pcb__promoDiscoveryReqTitle">Included parts</div>
          <ul class="ucp-pcb__promoDiscoveryReqs" data-promo-reqs></ul>
          <p class="ucp-pcb__promoDiscoveryTerms" data-promo-terms hidden></p>
        </div>
        <div class="ucp-pcb__promoDiscoveryNav">
          <button type="button" class="ucp-pcb__btn" id="ucp-pcb-promo-discovery-prev">Previous</button>
          <span data-promo-counter></span>
          <button type="button" class="ucp-pcb__btn" id="ucp-pcb-promo-discovery-next">Next</button>
        </div>
        <div class="ucp-pcb__promoDiscoveryActions">
          <button type="button" class="ucp-pcb__btn" id="ucp-pcb-promo-discovery-later">Maybe later</button>
          <button type="button" class="ucp-pcb__btn ucp-pcb__btn--solid" id="ucp-pcb-promo-discovery-apply">Add to build</button>
        </div>
      `;

      root.appendChild(overlay);
      root.appendChild(modal);

      const refs = {
        overlay,
        modal,
        close: modal.querySelector("#ucp-pcb-promo-discovery-close"),
        later: modal.querySelector("#ucp-pcb-promo-discovery-later"),
        apply: modal.querySelector("#ucp-pcb-promo-discovery-apply"),
        prev: modal.querySelector("#ucp-pcb-promo-discovery-prev"),
        next: modal.querySelector("#ucp-pcb-promo-discovery-next"),
        counter: modal.querySelector("[data-promo-counter]"),
        imageWrap: modal.querySelector("[data-promo-image-wrap]"),
        image: modal.querySelector("[data-promo-image]"),
        badge: modal.querySelector("[data-promo-badge]"),
        discount: modal.querySelector("[data-promo-discount]"),
        title: modal.querySelector("[data-promo-title]"),
        description: modal.querySelector("[data-promo-description]"),
        reqList: modal.querySelector("[data-promo-reqs]"),
        terms: modal.querySelector("[data-promo-terms]")
      };

      refs.overlay.addEventListener("click", () => {
        ucpLogBuildEvent("promo_discovery_modal_dismiss", { reason: "overlay" });
        ucpClosePromoDiscovery_(true);
      });
      refs.close.addEventListener("click", () => {
        ucpLogBuildEvent("promo_discovery_modal_dismiss", { reason: "close" });
        ucpClosePromoDiscovery_(true);
      });
      refs.later.addEventListener("click", () => {
        ucpLogBuildEvent("promo_discovery_modal_dismiss", { reason: "maybe_later" });
        ucpClosePromoDiscovery_(true);
      });
      refs.prev.addEventListener("click", () => {
        promoDiscoveryIndex_ =
          (promoDiscoveryIndex_ - 1 + promoDiscoveryCandidates_.length) % promoDiscoveryCandidates_.length;
        ucpRenderPromoDiscoverySlide_();
      });
      refs.next.addEventListener("click", () => {
        promoDiscoveryIndex_ = (promoDiscoveryIndex_ + 1) % promoDiscoveryCandidates_.length;
        ucpRenderPromoDiscoverySlide_();
      });
      refs.apply.addEventListener("click", async () => {
        const promo = promoDiscoveryCandidates_[promoDiscoveryIndex_];
        if (!promo) return;
        refs.apply.disabled = true;
        refs.apply.textContent = "Adding...";
        ucpLogBuildEvent("promo_discovery_apply_click", {
          promoHandle: promo.handle,
          promoLabel: promo.promoLabel || promo.handle
        });

        const ok = await ucpApplyPromoDiscoveryPromo_(promo);
        if (ok) {
          ucpLogBuildEvent("promo_discovery_apply_success", {
            promoHandle: promo.handle,
            promoLabel: promo.promoLabel || promo.handle
          });
          showBuilderNotice(`${promo.promoLabel || "Promo"} added to your build.`);
          ucpClosePromoDiscovery_(true);
          return;
        }

        ucpLogBuildEvent("promo_discovery_apply_failed", {
          promoHandle: promo.handle,
          promoLabel: promo.promoLabel || promo.handle
        });
        showBuilderNotice("We couldn't add this promo build. Please try again.");
        refs.apply.disabled = false;
        refs.apply.textContent = "Add to build";
      });

      if (!promoDiscoveryEscapeBound_) {
        promoDiscoveryEscapeBound_ = true;
        window.addEventListener("keydown", (e) => {
          if (e.key !== "Escape") return;
          if (!promoDiscoveryRefs_ || promoDiscoveryRefs_.modal.hidden) return;
          ucpLogBuildEvent("promo_discovery_modal_dismiss", { reason: "escape" });
          ucpClosePromoDiscovery_(true);
          e.stopPropagation();
        });
      }

      promoDiscoveryRefs_ = refs;
      return refs;
    }

    function ucpOpenPromoDiscoveryModal_() {
      promoDiscoveryCandidates_ = ucpPromoDiscoveryCandidates_();
      if (!promoDiscoveryCandidates_.length) return;
      promoDiscoveryIndex_ = 0;
      ucpEnsurePromoDiscoveryModal_();
      ucpRenderPromoDiscoverySlide_();
      ucpMarkPromoDiscoverySeenThisSession_();
      ucpSetPromoDiscoveryOpen_(true);
      ucpLogBuildEvent("promo_discovery_modal_view", {
        promoCount: promoDiscoveryCandidates_.length,
        firstPromoHandle: promoDiscoveryCandidates_[0]?.handle || ""
      });
    }

    function ucpSchedulePromoDiscoveryModal_(attempt = 0) {
      if (!ucpShouldShowPromoDiscovery_()) return;
      if (ucpPromoDiscoveryAnotherModalOpen_()) {
        if (attempt < 8) {
          setTimeout(() => ucpSchedulePromoDiscoveryModal_(attempt + 1), 500);
        }
        return;
      }
      ucpOpenPromoDiscoveryModal_();
    }


    // ---------- Init ----------
    async function init() {
      ucpInitQuoteContext_();
      ucpEnsureDraftQuoteCode_();
      ucpMaybeLogSourceOpen_();

      let initRestoreSource = "";
      let initRestoreExpectedCount = 0;

      const buildFromUrl = getBuildFromUrl();
      if (buildFromUrl && typeof buildFromUrl === "object") {
        const buildLineCount = ucpCountRestorePayloadLines_(buildFromUrl);
        if (buildLineCount > 0) {
          state.pendingPickByTab = buildFromUrl;
          initRestoreSource = "build";
          initRestoreExpectedCount = buildLineCount;
          try {
            window.UCP_PCB_RESTORE_LOADING?.show("build");
          } catch (e) {}
        }
      } else if (ACTIVE_PROMO_HANDLE && QUOTE_MODE !== "linked") {
        const promoPrefill = ucpBuildPendingPickPayloadFromActivePromo_();
        const promoLineCount = ucpCountRestorePayloadLines_(promoPrefill);
        if (promoPrefill && promoLineCount > 0) {
          state.pendingPickByTab = Object.assign({}, state.pendingPickByTab || {}, promoPrefill);
          initRestoreSource = "promo";
          initRestoreExpectedCount = promoLineCount;
          try {
            window.UCP_PCB_RESTORE_LOADING?.show("promo");
          } catch (e) {}
        }
      }

      function ucpApplyStickyTabsOffset_() {
        const headerTop =
          document.querySelector(".header__row.header__row--top") ||
          document.querySelector(".header__row") ||
          document.querySelector("header");
        if (!headerTop || !root) return;

        const rect = headerTop.getBoundingClientRect();
        const h = Math.max(0, Math.ceil(rect.height || headerTop.offsetHeight || 0));
        if (!h) return;

        root.style.setProperty("--ucp-pcb-tabs-top", `${h}px`);
      }

      await loadBundleRules();

      initMegaMenuStackGuard_();
      initMobilePeekTabs();
      initDesktopActionDock_();

      setActiveTab(state.tab);
      renderPicked();

      ucpApplyStickyTabsOffset_();
      window.addEventListener("resize", ucpApplyStickyTabsOffset_);
      setTimeout(ucpApplyStickyTabsOffset_, 300);

      if (state.pendingPickByTab) {
        const beforeCount = pickedLineCount();
        const restorePromise = applyPendingPickAllTabs_();
        ucpSetBuildRestorePromise_(restorePromise, {
          source: initRestoreSource || "build",
          beforeCount,
          expectedCount: initRestoreExpectedCount,
          failureMessage: "We couldn't fully restore this build.",
          timeoutMessage: "We couldn't fully restore this build."
        });
      }

      setTimeout(() => ucpSchedulePromoDiscoveryModal_(), 900);
    }

    init().catch(() => {
      try {
        window.UCP_PCB_RESTORE_LOADING?.hide();
        window.UCP_PCB_RESTORE_LOADING?.notify("We couldn't fully restore this build.");
      } catch (e) {}
    });
  })();
