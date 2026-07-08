/* File: assets/ucp-pcb-quote-lookup.js */
(() => {
  if (window.__UCP_PCB_QUOTE_LOOKUP__) return;
  window.__UCP_PCB_QUOTE_LOOKUP__ = true;
  try {
    window.__UCP_PCB_QUOTE_LOOKUP_DONE__ = false;
  } catch (e) {}

  const root = document.querySelector("[data-ucp-pcb]");
  if (!root) return;

  function readConfig_() {
    try {
      const el = root.querySelector("#ucp-pcb-config");
      if (!el || !el.textContent) return {};
      return JSON.parse(el.textContent);
    } catch (e) {
      return {};
    }
  }

  const cfg = readConfig_();
  const endpoint = String(cfg.apps_script_webapp_url || cfg.appsScriptWebappUrl || "").trim();
  if (!endpoint) {
    try { window.__UCP_PCB_QUOTE_LOOKUP_DONE__ = true; } catch (e) {}
    return;
  }

  const sp = new URLSearchParams(window.location.search);
  const quote = sp.get("quote");
  if (!quote) {
    try { window.__UCP_PCB_QUOTE_LOOKUP_DONE__ = true; } catch (e) {}
    return;
  }

  const v = sp.get("v") || "1";
  const blockKeys = ["cpu", "mb", "ram", "gpu", "ssd", "cooler", "psu", "case"];
  if (blockKeys.some((k) => sp.has(k))) {
    try { window.__UCP_PCB_QUOTE_LOOKUP_DONE__ = true; } catch (e) {}
    return;
  }
  if (sp.has("build")) {
    try { window.__UCP_PCB_QUOTE_LOOKUP_DONE__ = true; } catch (e) {}
    return;
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function toNumId_(raw) {
    if (raw === null || raw === undefined) return null;
    const s = String(raw).trim();
    if (!s) return null;
    if (s.includes("gid://")) {
      const parts = s.split("/");
      const last = parts[parts.length - 1] || "";
      const n1 = Number(last);
      return Number.isFinite(n1) ? n1 : null;
    }
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  function normalizeSelected_(payload, build) {
    const out = {};
    const selected = payload && typeof payload.selected === "object" ? payload.selected : null;

    if (selected) {
      out.cpu = selected.cpu ?? null;
      out.mb = selected.mb ?? selected.motherboard ?? null;
      out.ram = selected.ram ?? selected.memory ?? null;
      out.gpu = selected.gpu ?? null;
      out.cooler = selected.cooler ?? selected.cpucooler ?? null;
      out.ssd = selected.ssd ?? null;
      out.psu = selected.psu ?? selected.powersupply ?? null;
      out.case = selected.case ?? null;
    }

    const hasAny = Object.values(out).some((v) => v !== null && v !== undefined && v !== "");
    if (!hasAny && build && typeof build === "object") {
      const map = {
        cpu: "processor",
        mb: "motherboard",
        ram: "memory",
        gpu: "gpu",
        cooler: "cpucooler",
        ssd: "ssd",
        psu: "powersupply",
        case: "case"
      };

      Object.keys(map).forEach((k) => {
        const val = build[map[k]];
        if (!val || Array.isArray(val)) return;
        out[k] = val.variantId || val.variant_id || val.id || null;
      });
    }

    const cleaned = {};
    Object.keys(out).forEach((k) => {
      const id = toNumId_(out[k]);
      if (id) cleaned[k] = id;
    });
    return cleaned;
  }

  function normalizeMultiItems_(arr) {
    if (!Array.isArray(arr)) return [];
    return arr
      .map((it) => {
        if (!it) return null;
        const variantId = it.variantId || it.variant_id || it.id || "";
        const productId = it.productId || it.product_id || "";
        const qtyRaw = Number(it.qty || it.quantity || 1);
        const qty = Number.isFinite(qtyRaw) && qtyRaw > 0 ? qtyRaw : 1;
        if (!variantId && !productId) return null;
        return { variantId: String(variantId), productId: String(productId), qty };
      })
      .filter(Boolean);
  }

  function readArray_(payload, keys) {
    if (!payload || typeof payload !== "object") return [];
    for (const k of keys) {
      if (Array.isArray(payload[k])) return payload[k];
    }
    return [];
  }

  function countBuildPayloadLines_(build) {
    if (!build || typeof build !== "object" || Array.isArray(build)) return 0;
    let count = 0;
    Object.values(build).forEach((value) => {
      if (!value) return;
      if (Array.isArray(value)) {
        count += value.filter(Boolean).length;
        return;
      }
      if (typeof value === "object") count += 1;
    });
    return count;
  }

  function readSnapshotItemCount_() {
    try {
      const snap = window.UCP_PCB_API && typeof window.UCP_PCB_API.getSnapshot === "function"
        ? window.UCP_PCB_API.getSnapshot()
        : null;
      return snap && Array.isArray(snap.items) ? snap.items.length : 0;
    } catch (e) {
      return 0;
    }
  }

  async function waitForApi(timeoutMs = 8000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (window.UCP_PCB_API && typeof window.UCP_PCB_API.selectVariantById === "function") {
        return true;
      }
      await sleep(50);
    }
    return false;
  }

  function buildJsonpUrl_(baseUrl, quoteCode, version, cb) {
    try {
      const u = new URL(baseUrl, window.location.origin);
      u.searchParams.set("action", "get_quote");
      u.searchParams.set("quote", quoteCode);
      if (version) u.searchParams.set("v", version);
      u.searchParams.set("callback", cb);
      return u.toString();
    } catch (e) {
      return "";
    }
  }

  function fetchQuote_(baseUrl, quoteCode, version) {
    return new Promise((resolve) => {
      const cb = "__ucpPcbQuoteCb_" + Math.random().toString(36).slice(2);
      let script = null;

      function cleanup() {
        if (script && script.parentNode) script.parentNode.removeChild(script);
        try {
          delete window[cb];
        } catch (e) {
          window[cb] = undefined;
        }
      }

      window[cb] = function (res) {
        cleanup();
        if (res && res.ok && res.payload) resolve(res.payload);
        else resolve(null);
      };

      const url = buildJsonpUrl_(baseUrl, quoteCode, version, cb);
      if (!url) {
        cleanup();
        resolve(null);
        return;
      }

      script = document.createElement("script");
      script.src = url;
      script.async = true;
      script.onerror = function () {
        cleanup();
        resolve(null);
      };
      document.head.appendChild(script);
    });
  }

  async function applyQuote_(payload) {
    const okApi = await waitForApi(8000);
    if (!okApi) {
      return { ok: false, expectedCount: 0, appliedCount: 0, reason: "api_not_ready" };
    }

    const build = payload && typeof payload.build === "object" ? payload.build : null;
    const expectedBuildCount = countBuildPayloadLines_(build);
    let applied = false;

    if (build && Object.keys(build).length && typeof window.UCP_PCB_API.applyBuildPayload === "function") {
      try {
        applied = await window.UCP_PCB_API.applyBuildPayload(build, {
          suppressRestoreLoading: true,
          source: "quote"
        });
      } catch (e) {
        applied = false;
      }
    }

    if (!applied) {
      const selected = normalizeSelected_(payload, build);
      const expectedSelectedCount = Object.keys(selected).length;
      const order = ["cpu", "mb", "ram", "gpu", "cooler", "ssd", "psu", "case"];
      for (const key of order) {
        const id = selected[key];
        if (!id) continue;
        try {
          await window.UCP_PCB_API.selectVariantById(key, id);
        } catch (e) {}
      }

      const multi = {};
      const casefansRaw = Array.isArray(build?.casefans)
        ? build.casefans
        : readArray_(payload, ["casefans_items", "casefansItems", "casefans_list", "casefansList", "casefans"]);
      const memoryRaw = Array.isArray(build?.memory)
        ? build.memory
        : readArray_(payload, ["memory_items", "memoryItems", "ram_items", "ramItems", "memory_list", "memoryList"]);
      const otherRaw = Array.isArray(build?.other)
        ? build.other
        : readArray_(payload, ["other_items", "otherItems", "other_list", "otherList", "other"]);

      const casefansItems = normalizeMultiItems_(casefansRaw);
      const memoryItems = normalizeMultiItems_(memoryRaw);
      const otherItems = normalizeMultiItems_(otherRaw);
      const expectedMultiCount = casefansItems.length + memoryItems.length + otherItems.length;

      if (casefansItems.length) multi.casefans = casefansItems;
      if (memoryItems.length) multi.memory = memoryItems;
      if (otherItems.length) multi.other = otherItems;

      if (Object.keys(multi).length && typeof window.UCP_PCB_API.applyBuildPayload === "function") {
        try {
          await window.UCP_PCB_API.applyBuildPayload(multi, {
            suppressRestoreLoading: true,
            source: "quote"
          });
        } catch (e) {}
      }

      const expectedCount = expectedBuildCount > 0 ? expectedBuildCount : expectedSelectedCount + expectedMultiCount;
      const appliedCount = readSnapshotItemCount_();
      return {
        ok: expectedCount > 0 && appliedCount >= expectedCount,
        expectedCount,
        appliedCount,
        reason: expectedCount > 0 ? "" : "empty_quote_payload"
      };
    }

    const appliedCount = readSnapshotItemCount_();
    return {
      ok: expectedBuildCount > 0 && appliedCount >= expectedBuildCount,
      expectedCount: expectedBuildCount,
      appliedCount,
      reason: expectedBuildCount > 0 ? "" : "empty_quote_payload"
    };
  }

  try {
    window.UCP_PCB_RESTORE_LOADING?.show("quote");
  } catch (e) {}

  const lookupPromise = fetchQuote_(endpoint, quote, v)
    .then((payload) => {
      if (!payload) {
        return { ok: false, expectedCount: 0, appliedCount: 0, reason: "quote_not_found" };
      }
      return applyQuote_(payload);
    })
    .catch(() => ({ ok: false, expectedCount: 0, appliedCount: 0, reason: "quote_lookup_failed" }))
    .finally(() => {
      try { window.__UCP_PCB_QUOTE_LOOKUP_DONE__ = true; } catch (e) {}
    });

  try {
    const restoreUi = window.UCP_PCB_RESTORE_LOADING || null;
    window.__UCP_PCB_QUOTE_LOOKUP_PROMISE__ = restoreUi
      ? restoreUi.track(lookupPromise, {
          source: "quote",
          timeoutMs: 15000,
          timeoutMessage: "We couldn't fully restore this build.",
          failureMessage: "We couldn't fully restore this build.",
          successTest: (result) => !!(result && result.ok)
        })
      : lookupPromise;
  } catch (e) {}
})();
