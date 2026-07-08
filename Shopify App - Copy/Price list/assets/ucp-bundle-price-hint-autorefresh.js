(() => {
  if (window.__ucpBundleAutoRefreshLoaded) return;
  window.__ucpBundleAutoRefreshLoaded = true;

  const HINT_SELECTOR = ".js-ucp-bundle-price-hint";
  const RULES_ENDPOINT = "/pages/ucp-pcb-bundle-rules?view=ucp-pcb-bundle-rules-json";
  const CART_ENDPOINT = "/cart.js";

  let rulesIndexPromise = null;
  let refreshTimer = null;
  let refreshInFlight = false;

  function pageHasHints() {
    return document.querySelector(HINT_SELECTOR) != null;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatMoney(cents) {
    if (window.Shopify && typeof window.Shopify.formatMoney === "function") {
      return window.Shopify.formatMoney(cents);
    }
    const currency =
      (window.Shopify &&
        window.Shopify.currency &&
        window.Shopify.currency.active) ||
      "PHP";
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
      }).format((cents || 0) / 100);
    } catch (err) {
      return `${(cents || 0) / 100} ${currency}`;
    }
  }

  function pushRule(map, key, rule) {
    if (!key) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(rule);
  }

  async function fetchRulesPage(page) {
    const url = page
      ? `${RULES_ENDPOINT}&page=${encodeURIComponent(page)}`
      : RULES_ENDPOINT;
    const res = await fetch(url, { credentials: "same-origin" });
    if (!res.ok) throw new Error(`Bundle rules fetch failed (${res.status})`);
    return res.json();
  }

  async function loadRulesIndex() {
    if (rulesIndexPromise) return rulesIndexPromise;

    rulesIndexPromise = (async () => {
      const rules = [];
      let page = 1;

      while (true) {
        const data = await fetchRulesPage(page);
        if (data && Array.isArray(data.rules)) {
          rules.push(...data.rules);
        }
        if (!data || !data.next_page) break;
        page = data.next_page;
      }

      const byCpuProductId = new Map();
      const byCpuVariantId = new Map();

      rules.forEach((rule) => {
        pushRule(byCpuProductId, Number(rule.cpu_product_id), rule);
        if (rule.cpu_variant_id) {
          pushRule(byCpuVariantId, Number(rule.cpu_variant_id), rule);
        }
      });

      return { rules, byCpuProductId, byCpuVariantId };
    })();

    return rulesIndexPromise;
  }

  async function fetchCart() {
    const res = await fetch(CART_ENDPOINT, {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Cart fetch failed (${res.status})`);
    return res.json();
  }

  function findCpuMatch(cart, rulesIndex) {
    if (!cart || !Array.isArray(cart.items)) return null;
    for (const item of cart.items) {
      const byVariant = rulesIndex.byCpuVariantId.get(Number(item.variant_id));
      const byProduct = rulesIndex.byCpuProductId.get(Number(item.product_id));
      const rules = byVariant && byVariant.length ? byVariant : byProduct;
      if (rules && rules.length) {
        return { item, rules };
      }
    }
    return null;
  }

  function findRuleForMobo(rules, moboProductId, moboVariantId) {
    if (!rules || !rules.length) return null;
    const moboPid = Number(moboProductId);
    const moboVid = Number(moboVariantId);
    return rules.find((rule) => {
      const ruleMoboVid = Number(rule.mobo_variant_id || 0);
      const ruleMoboPid = Number(rule.mobo_product_id || 0);
      if (moboVid && ruleMoboVid && ruleMoboVid === moboVid) return true;
      if (moboPid && ruleMoboPid && ruleMoboPid === moboPid) return true;
      return false;
    });
  }

  function renderHint(el, payload) {
    if (!payload) {
      el.innerHTML = "";
      el.hidden = true;
      return;
    }

    el.hidden = false;
    el.innerHTML = `
      <div class="ucp-bundle-price-hint__line">
        Bundle with
        <span class="ucp-bundle-price-hint__cpu">${escapeHtml(
          payload.cpuTitle
        )}</span>
        <span class="ucp-bundle-price-hint__compare">${payload.baseMoney}</span>
        <strong class="ucp-bundle-price-hint__price">${
          payload.finalMoney
        }</strong>
      </div>
      <div class="ucp-bundle-price-hint__save">
        Save ${payload.discountMoney} on this motherboard
      </div>
    `;
  }

  async function refreshBundleHints() {
    if (!pageHasHints() || refreshInFlight) return;
    refreshInFlight = true;

    try {
      const [rulesIndex, cart] = await Promise.all([
        loadRulesIndex(),
        fetchCart(),
      ]);

      const cpuMatch = findCpuMatch(cart, rulesIndex);
      const hints = Array.from(document.querySelectorAll(HINT_SELECTOR));

      hints.forEach((el) => {
        const itemEl = el.closest("[data-product-item]");

        if (!cpuMatch) {
          renderHint(el, null);
          if (itemEl) itemEl.classList.remove("ucp-bundle-active");
          return;
        }

        const moboProductId = Number(el.dataset.moboProductId || 0);
        const moboVariantId = Number(el.dataset.moboVariantId || 0);
        const basePriceCents = Number(el.dataset.basePrice || 0);

        const rule = findRuleForMobo(
          cpuMatch.rules,
          moboProductId,
          moboVariantId
        );

        const discountUnits = rule ? Number(rule.discount_amount || 0) : 0;
        const discountCents = Math.round(discountUnits * 100);
        const finalCents = basePriceCents - discountCents;

        if (!rule || discountCents <= 0 || finalCents < 0) {
          renderHint(el, null);
          if (itemEl) itemEl.classList.remove("ucp-bundle-active");
          return;
        }

        const cpuTitle =
          cpuMatch.item.product_title ||
          cpuMatch.item.title ||
          "this CPU";

        renderHint(el, {
          cpuTitle,
          baseMoney: formatMoney(basePriceCents),
          finalMoney: formatMoney(finalCents),
          discountMoney: formatMoney(discountCents),
        });
        if (itemEl) itemEl.classList.add("ucp-bundle-active");
      });
    } catch (err) {
      console.warn("UCP bundle hint update failed", err);
    } finally {
      refreshInFlight = false;
    }
  }

  function scheduleRefresh() {
    if (!pageHasHints()) return;
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(refreshBundleHints, 250);
  }

  function isCartMutationUrl(url) {
    if (!url) return false;
    return (
      url.includes("/cart/add") ||
      url.includes("/cart/change") ||
      url.includes("/cart/update") ||
      url.includes("/cart/clear")
    );
  }

  const originalFetch = window.fetch;
  if (typeof originalFetch === "function") {
    window.fetch = function (input, init) {
      let url = "";
      if (typeof input === "string") url = input;
      else if (input && typeof input.url === "string") url = input.url;

      return originalFetch(input, init).then((res) => {
        if (isCartMutationUrl(url)) scheduleRefresh();
        return res;
      });
    };
  }

  const OriginalXHR = window.XMLHttpRequest;
  if (OriginalXHR) {
    function PatchedXHR() {
      const xhr = new OriginalXHR();
      let lastUrl = "";

      const open = xhr.open;
      xhr.open = function (method, url) {
        lastUrl = url || "";
        return open.apply(xhr, arguments);
      };

      xhr.addEventListener("loadend", () => {
        if (isCartMutationUrl(lastUrl)) scheduleRefresh();
      });

      return xhr;
    }
    window.XMLHttpRequest = PatchedXHR;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", refreshBundleHints);
  } else {
    refreshBundleHints();
  }
})();
