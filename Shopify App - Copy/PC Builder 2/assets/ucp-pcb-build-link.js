/* File: assets/ucp-pcb-build-link.js */
(() => {
  const KEY_ORDER = ["cpu", "mb", "ram", "gpu", "ssd", "cooler", "psu", "case"];
  const KEY_ALIASES = {
    motherboard: "mb",
    cpucooler: "cooler",
    powersupply: "psu",
  };
  const SHARE_HANDLED_BY_BUILDER = window.__UCP_PCB_SHARE_HANDLER__ === "builder";

  function normKey(k) {
    const s = String(k || "").trim().toLowerCase();
    return KEY_ALIASES[s] || s;
  }

  function toNumId(x) {
    if (x === null || x === undefined) return null;
    const s = String(x).trim();
    if (!s) return null;

    // Accept gid://shopify/ProductVariant/123
    if (s.includes("gid://")) {
      const parts = s.split("/");
      const last = parts[parts.length - 1] || "";
      const n1 = Number(last);
      return Number.isFinite(n1) ? n1 : null;
    }

    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  function pickSelectedFromSnapshot(snapshot) {
    const sel = snapshot && snapshot.selected ? snapshot.selected : {};
    const out = {};

    for (const [k, v] of Object.entries(sel || {})) {
      const key = normKey(k);
      const id = toNumId(v);
      if (id) out[key] = id;
    }

    return out;
  }

  function ucpBase64UrlEncodeUnicode_(str) {
    try {
      return btoa(unescape(encodeURIComponent(String(str || ""))))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
    } catch (_) {
      return "";
    }
  }

  function ucpTryGetBuilderSharePayload_(snapshot) {
    const sp = window.UCP_PCB_SharePayload || window.__UCP_PCB_SharePayload__ || null;
    const fn = sp && typeof sp.buildSharePayload === "function" ? sp.buildSharePayload : null;
    if (!fn) return null;

    try {
      return fn.length >= 1 ? fn(snapshot) : fn();
    } catch (_) {
      return null;
    }
  }

  function ucpTryEncodeBuildPayload_(payload) {
    if (!payload || typeof payload !== "object") return "";

    const sp = window.UCP_PCB_SharePayload || window.__UCP_PCB_SharePayload__ || null;
    const enc = sp && typeof sp.base64UrlEncode === "function" ? sp.base64UrlEncode : null;

    try {
      const json = JSON.stringify(payload);
      if (enc) return enc(json);
      return ucpBase64UrlEncodeUnicode_(json);
    } catch (_) {
      return "";
    }
  }

  function ucpPayloadNeedsBuildParam_(payload) {
    if (!payload || typeof payload !== "object") return false;
    const shortKeys = new Set([
      "processor",
      "motherboard",
      "memory",
      "gpu",
      "ssd",
      "cpucooler",
      "powersupply",
      "case"
    ]);

    for (const [k, v] of Object.entries(payload)) {
      if (k === "casefans" || k === "other") return true;
      if (Array.isArray(v)) return true;
      if (!shortKeys.has(k)) return true;
    }

    return false;
  }

  function ucpMaybeAttachBuildParam_(urlObj, snapshot) {
    const payload = ucpTryGetBuilderSharePayload_(snapshot);
    if (!payload) return;
    if (!ucpPayloadNeedsBuildParam_(payload)) return;

    const encoded = ucpTryEncodeBuildPayload_(payload);
    if (!encoded) return;

    urlObj.searchParams.set("build", encoded);
  }

  function generateBuildLink(snapshot, opts = {}) {
    const selected = pickSelectedFromSnapshot(snapshot);

    const origin = window.location.origin;
    const path = opts.path || window.location.pathname;

    const u = new URL(origin + path);

    // Preserve query params that might be required for Shopify templates (ex: ?view=...)
    const preserveParams = Array.isArray(opts.preserveParams)
      ? opts.preserveParams
      : ["view", "off", "promo"];

    try {
      const cur = new URL(window.location.href);
      preserveParams.forEach((p) => {
        const val = cur.searchParams.get(p);
        if (val) u.searchParams.set(p, val);
      });
    } catch (_) {}

    // Only include categories that are selected
    KEY_ORDER.forEach((k) => {
      if (selected[k]) u.searchParams.set(k, String(selected[k]));
    });

    try {
      const ctx = window.__UCP_PCB_QUOTE_CTX__ || null;
      if (ctx && ctx.quoteCode) {
        u.searchParams.set("quote", ctx.quoteCode);
        if (ctx.quoteVersion) u.searchParams.set("v", String(ctx.quoteVersion));
      }
    } catch (_) {}

    ucpMaybeAttachBuildParam_(u, snapshot);

    return u.toString();
  }

  function parseBuildParams(search) {
    const sp = new URLSearchParams(String(search || ""));
    const out = {};

    for (const [k, v] of sp.entries()) {
      const key = normKey(k);
      if (!KEY_ORDER.includes(key)) continue;

      const id = toNumId(v);
      if (id) out[key] = id;
    }

    return out;
  }

  function getEntrySource(search) {
    const sp = new URLSearchParams(String(search || ""));
    const raw = String(
      sp.get("src") ||
      sp.get("source") ||
      sp.get("ref") ||
      ""
    ).trim().toLowerCase();
    if (!raw) return "";

    const normalized = raw.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    if (normalized === "fps_finder") return "fps_finder";
    return normalized;
  }

  function showNonBlockingNotice(msg) {
    const existing = document.getElementById("ucp-pcb-buildlink-notice");
    if (existing) existing.remove();

    const el = document.createElement("div");
    el.id = "ucp-pcb-buildlink-notice";
    el.textContent = String(msg || "");
    el.style.cssText =
      "position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;" +
      "background:#111;color:#fff;padding:10px 12px;border-radius:12px;" +
      "font:600 12px/1.2 system-ui,-apple-system,Segoe UI,Roboto,Arial;" +
      "box-shadow:0 10px 30px rgba(0,0,0,.25);";

    document.body.appendChild(el);
    setTimeout(() => el.remove(), 5500);
  }

  async function waitForApi(timeoutMs = 6000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (
        window.UCP_PCB_API &&
        typeof window.UCP_PCB_API.getSnapshot === "function" &&
        typeof window.UCP_PCB_API.selectVariantById === "function"
      ) {
        return true;
      }
      await new Promise((r) => setTimeout(r, 50));
    }
    return false;
  }

  async function applyBuildFromUrl(opts = {}) {
    const entrySource = getEntrySource(window.location.search);
    try {
      const cur = new URL(window.location.href);
      if (cur.searchParams.has("build")) {
        return { applied: 0, failed: 0, skipped: true };
      }
    } catch (_) {}

    const params = parseBuildParams(window.location.search);
    const keys = KEY_ORDER.filter((k) => params[k]);
    if (!keys.length) return { applied: 0, failed: 0 };

    const okApi = await waitForApi(opts.timeoutMs || 6000);
    if (!okApi) {
      showNonBlockingNotice(
        "Build link loaded, but builder is not ready yet. Please refresh."
      );
      return { applied: 0, failed: keys.length };
    }

    let applied = 0;
    let failed = 0;

    // Apply in dependency-friendly order
    for (const k of KEY_ORDER) {
      const id = params[k];
      if (!id) continue;

      try {
        const ok = await window.UCP_PCB_API.selectVariantById(k, id);
        if (ok) applied += 1;
        else failed += 1;
      } catch (e) {
        failed += 1;
      }
    }

    if (failed) {
      showNonBlockingNotice(
        "Some items in this shared build are unavailable. Please reselect."
      );
    }

    if (entrySource === "fps_finder" && applied > 0) {
      try {
        if (typeof window.UCP_PCB_LOG_EVENT === "function") {
          window.UCP_PCB_LOG_EVENT("fps_finder");
        }
      } catch (_) {}
    }

    return { applied, failed };
  }

  async function copyText(text) {
    const t = String(text || "");
    if (!t) return false;

    // Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(t);
        return true;
      } catch (_) {}
    }

    // Fallback
    try {
      const ta = document.createElement("textarea");
      ta.value = t;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return !!ok;
    } catch (_) {
      return false;
    }
  }

  async function handleShareClick(e) {
    const btn = e.target.closest("#ucp-pcb-share, #ucp-pcb-mobilebar-share");
    if (!btn) return;

    e.preventDefault();

    const okApi = await waitForApi(6000);
    if (!okApi) {
      showNonBlockingNotice("Builder is not ready yet. Please try again.");
      return;
    }

    let snap;
    try {
      snap = window.UCP_PCB_API.getSnapshot();
    } catch (_) {
      showNonBlockingNotice("Unable to read your build. Please try again.");
      return;
    }

    const link = generateBuildLink(snap, { preserveParams: ["view"] });

    // Prefer native share if available. If it fails, fall back to copy.
    if (navigator.share) {
      try {
        await navigator.share({ title: "Uncapped PC Build", url: link });
        return;
      } catch (_) {}
    }

    const copied = await copyText(link);
    if (copied) document.dispatchEvent(new CustomEvent("ucp:pcb:share_copied"));
    showNonBlockingNotice(copied ? "Build link copied." : "Copy failed. Please copy from the address bar.");
  }

  // Public API
  window.UCP_PCB_BuildLink = window.UCP_PCB_BuildLink || {};
  window.UCP_PCB_BuildLink.generateBuildLink = generateBuildLink;
  window.UCP_PCB_BuildLink.parseBuildParams = parseBuildParams;
  window.UCP_PCB_BuildLink.applyBuildFromUrl = applyBuildFromUrl;

  // Auto-apply on page load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => applyBuildFromUrl().catch(() => {}));
  } else {
    applyBuildFromUrl().catch(() => {});
  }

  // Share button handler (desktop + mobile)
  if (!SHARE_HANDLED_BY_BUILDER) {
    document.addEventListener("click", (e) => {
      handleShareClick(e).catch(() => {});
    });
  }
})();
