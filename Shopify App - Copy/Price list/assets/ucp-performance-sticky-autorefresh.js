(() => {
  if (window.__ucpPerformanceStickyAutoRefreshLoaded) return;
  window.__ucpPerformanceStickyAutoRefreshLoaded = true;

  const STICKY_SELECTOR = '[data-ucp-performance-sticky="true"]';
  const CART_ENDPOINT = "/cart.js";

  let refreshTimer = null;
  let refreshInFlight = false;

  function pageHasSticky() {
    return document.querySelector(STICKY_SELECTOR) != null;
  }

  function normalizeUrl(url) {
    if (!url) return "";
    try {
      return new URL(url, window.location.origin).pathname;
    } catch (err) {
      return String(url || "");
    }
  }

  function keysFromSearchParams(params) {
    const keys = [];
    params.forEach((_, key) => {
      keys.push(key);
    });
    return keys;
  }

  function bodyKeys(body) {
    if (!body) return [];

    if (typeof body === "string") {
      return keysFromSearchParams(new URLSearchParams(body));
    }

    if (body instanceof URLSearchParams) {
      return keysFromSearchParams(body);
    }

    if (typeof FormData !== "undefined" && body instanceof FormData) {
      const keys = [];
      body.forEach((_, key) => {
        keys.push(key);
      });
      return keys;
    }

    if (typeof body === "object") {
      return Object.keys(body);
    }

    return [];
  }

  function isItemMutationKey(key) {
    return (
      key === "updates" ||
      key === "items" ||
      key === "line" ||
      key === "quantity" ||
      key === "id" ||
      key === "sections" ||
      /^updates\[/.test(key)
    );
  }

  function isIgnoredMetaKey(key) {
    return (
      key === "form_type" ||
      key === "utf8" ||
      key === "note" ||
      key === "sections_url" ||
      /^attributes(\[.*\])?$/.test(key)
    );
  }

  function shouldRefreshFor(url, body) {
    const pathname = normalizeUrl(url);
    if (!pathname) return false;

    if (
      pathname.includes("/cart/add") ||
      pathname.includes("/cart/change") ||
      pathname.includes("/cart/clear")
    ) {
      return true;
    }

    if (!pathname.includes("/cart/update")) return false;

    const keys = bodyKeys(body);
    if (!keys.length) return true;

    if (keys.some(isItemMutationKey)) return true;
    return !keys.every(isIgnoredMetaKey);
  }

  function dispatchCartUpdated(cart) {
    document.dispatchEvent(
      new CustomEvent("uncapped:cart-updated", {
        detail: { cart },
      })
    );
  }

  async function refreshStickyPreview() {
    if (!pageHasSticky() || refreshInFlight) return;
    refreshInFlight = true;

    try {
      const res = await fetch(CART_ENDPOINT, {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`Cart fetch failed (${res.status})`);
      }
      const cart = await res.json();
      if (!pageHasSticky()) return;
      dispatchCartUpdated(cart);
    } catch (err) {
      console.warn("UCP performance sticky refresh failed", err);
    } finally {
      refreshInFlight = false;
    }
  }

  function scheduleRefresh() {
    if (!pageHasSticky()) return;
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(refreshStickyPreview, 250);
  }

  const originalFetch = window.fetch;
  if (typeof originalFetch === "function") {
    window.fetch = function (input, init) {
      let url = "";
      let body = init && init.body;

      if (typeof input === "string") {
        url = input;
      } else if (input && typeof input.url === "string") {
        url = input.url;
        if (!body && input.body) body = input.body;
      }

      return originalFetch(input, init).then((res) => {
        if (shouldRefreshFor(url, body)) scheduleRefresh();
        return res;
      });
    };
  }

  const OriginalXHR = window.XMLHttpRequest;
  if (OriginalXHR) {
    function PatchedXHR() {
      const xhr = new OriginalXHR();
      let lastUrl = "";
      let lastBody = null;

      const open = xhr.open;
      xhr.open = function (method, url) {
        lastUrl = url || "";
        return open.apply(xhr, arguments);
      };

      const send = xhr.send;
      xhr.send = function (body) {
        lastBody = body;
        return send.apply(xhr, arguments);
      };

      xhr.addEventListener("loadend", () => {
        if (shouldRefreshFor(lastUrl, lastBody)) scheduleRefresh();
      });

      return xhr;
    }

    window.XMLHttpRequest = PatchedXHR;
  }
})();
