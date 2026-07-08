(function () {
  if (window.__UCP_SOURCE_TRACKER_V1__) return;
  window.__UCP_SOURCE_TRACKER_V1__ = true;

  var ENDPOINT = "https://script.google.com/macros/s/AKfycbysHP_LKSCNjTczUQZr0OT5pMY37htXnWk_MowJ9mRTqTeCA9Gy49JprHDbkWOCYM-2/exec";
  var SECRET = "pc builder data saver";
  var SESSION_KEY = "ucp_pcb_session_id";
  var DEDUPE_PREFIX = "ucp_source_tracker_v1:";

  function normalize(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function getSearchParams() {
    try {
      return new URLSearchParams(window.location.search || "");
    } catch (e) {
      return new URLSearchParams("");
    }
  }

  function readFirstParam(names) {
    var sp = getSearchParams();
    for (var i = 0; i < names.length; i += 1) {
      var value = sp.get(names[i]);
      if (value) return value;
    }
    return "";
  }

  function getSessionId() {
    try {
      var value = localStorage.getItem(SESSION_KEY);
      if (!value) {
        value = (crypto && crypto.randomUUID && crypto.randomUUID()) || String(Date.now()) + "_" + Math.random().toString(16).slice(2);
        localStorage.setItem(SESSION_KEY, value);
      }
      return value;
    } catch (e) {
      return String(Date.now()) + "_" + Math.random().toString(16).slice(2);
    }
  }

  function getOpenId() {
    try {
      return (crypto && crypto.randomUUID && crypto.randomUUID()) || "";
    } catch (e) {}
    return "open_" + Date.now() + "_" + Math.random().toString(16).slice(2);
  }

  function getDeviceInfo() {
    var ua = String(navigator.userAgent || "");
    var platform = String(navigator.userAgentData && navigator.userAgentData.platform || navigator.platform || "");
    var mobileHint = navigator.userAgentData && typeof navigator.userAgentData.mobile === "boolean"
      ? String(navigator.userAgentData.mobile)
      : "";
    var isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || mobileHint === "true";

    var os = "unknown";
    if (/Windows/i.test(ua) || /Win/i.test(platform)) os = "windows";
    else if (/Android/i.test(ua)) os = "android";
    else if (/iPhone|iPad|iPod/i.test(ua)) os = "ios";
    else if (/Mac/i.test(ua) || /macOS/i.test(platform)) os = "macos";
    else if (/Linux/i.test(ua)) os = "linux";

    var browser = "unknown";
    if (/Edg\//i.test(ua)) browser = "edge";
    else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = "chrome";
    else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = "safari";
    else if (/Firefox\//i.test(ua)) browser = "firefox";

    return {
      deviceType: isMobile ? "mobile" : "desktop",
      os: os,
      browser: browser,
      uaPlatform: platform,
      uaMobileHint: mobileHint,
      userAgent: ua
    };
  }

  function getPageRoot() {
    return document.querySelector("[data-ucp-source-page-type]") ||
      document.querySelector("[data-ucp-bundle-chooser]") ||
      document.querySelector("[data-ucp-hub]") ||
      document.querySelector("[data-testid='product-list']");
  }

  function inferPageType() {
    var root = getPageRoot();
    if (root && root.getAttribute("data-ucp-source-page-type")) {
      return normalize(root.getAttribute("data-ucp-source-page-type"));
    }
    if (document.querySelector("[data-ucp-bundle-chooser]")) return "bundle_page";
    if (document.querySelector("[data-ucp-hub]")) return "bundle_list";
    if (document.querySelector("[data-testid='product-list']")) return "price_list";

    var path = String(location.pathname || "").toLowerCase();
    if (path.indexOf("bundle-masterlist") >= 0) return "bundle_list";
    if (path.indexOf("pc-builder") >= 0) return "pc_builder";
    if (path.indexOf("price") >= 0) return "price_list";
    return "page";
  }

  function getContext() {
    var root = getPageRoot();
    return {
      pageType: inferPageType(),
      campaign: root ? normalize(root.getAttribute("data-ucp-source-campaign")) : "",
      content: root ? normalize(root.getAttribute("data-ucp-source-content")) : ""
    };
  }

  function getTags(fallbacks) {
    var ctx = getContext();
    fallbacks = fallbacks || {};
    return {
      sourceTag: normalize(readFirstParam(["src", "source", "ref"]) || fallbacks.sourceTag || ""),
      campaign: normalize(readFirstParam(["campaign", "utm_campaign"]) || fallbacks.campaign || ctx.campaign || ""),
      content: normalize(readFirstParam(["content", "utm_content"]) || fallbacks.content || ctx.content || "")
    };
  }

  function getReferrer() {
    var referrerUrl = String(document.referrer || "").trim();
    if (!referrerUrl) return { referrerUrl: "", referrerHost: "" };
    try {
      var url = new URL(referrerUrl);
      return { referrerUrl: referrerUrl, referrerHost: String(url.hostname || "").toLowerCase() };
    } catch (e) {
      return { referrerUrl: referrerUrl, referrerHost: "" };
    }
  }

  function getEntryType() {
    var sp = getSearchParams();
    if (sp.get("quote")) return "quote";
    if (sp.get("build")) return "build";
    if (sp.get("promo")) return "promo";
    return inferPageType();
  }

  function shouldDedupe(eventName, key) {
    if (!key) return false;
    var storageKey = DEDUPE_PREFIX + eventName + ":" + encodeURIComponent(key);
    try {
      var last = Number(sessionStorage.getItem(storageKey) || 0);
      if (Number.isFinite(last) && Date.now() - last < 10000) return true;
      sessionStorage.setItem(storageKey, String(Date.now()));
    } catch (e) {}
    return false;
  }

  function postEvent(eventName, extra) {
    extra = extra || {};
    var tags = getTags(extra);
    if (!tags.sourceTag) return;

    var ctx = getContext();
    var ref = getReferrer();
    var dev = getDeviceInfo();
    var payload = {
      event: eventName,
      openId: extra.openId || getOpenId(),
      sourceTag: tags.sourceTag,
      campaign: tags.campaign,
      content: tags.content,
      promoHandle: normalize(extra.promoHandle || readFirstParam(["promo"])),
      referrerHost: ref.referrerHost,
      referrerUrl: ref.referrerUrl,
      entryType: extra.entryType || getEntryType(),
      pageType: normalize(extra.pageType || ctx.pageType),
      ctaName: normalize(extra.ctaName || ""),
      targetUrl: String(extra.targetUrl || "").trim(),
      pageUrl: String(extra.pageUrl || window.location.href || "").trim(),
      quoteCode: String(extra.quoteCode || readFirstParam(["quote"])).trim(),
      quoteVersion: String(extra.quoteVersion || readFirstParam(["v"])).trim(),
      quoteLink: String(extra.quoteLink || "").trim(),
      buildLink: String(extra.buildLink || "").trim(),
      sessionId: getSessionId(),
      customerId: "",
      customerEmail: "",
      deviceType: dev.deviceType,
      os: dev.os,
      browser: dev.browser,
      uaPlatform: dev.uaPlatform,
      uaMobileHint: dev.uaMobileHint,
      userAgent: dev.userAgent
    };

    var body = {
      secret: SECRET,
      payload: payload
    };

    try {
      var ok = navigator.sendBeacon(
        ENDPOINT,
        new Blob([JSON.stringify(body)], { type: "text/plain;charset=UTF-8" })
      );
      if (ok) return;
    } catch (e) {}

    try {
      fetch(ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: "data=" + encodeURIComponent(JSON.stringify(body))
      }).catch(function () {});
    } catch (e) {}
  }

  function decorateUrl(urlValue, fallbacks) {
    var tags = getTags(fallbacks || {});
    if (!tags.sourceTag && !tags.campaign && !tags.content) return String(urlValue || "");

    try {
      var url = new URL(String(urlValue || ""), window.location.origin);
      if (url.origin !== window.location.origin) return String(urlValue || "");

      if (!url.searchParams.get("src") && !url.searchParams.get("source") && !url.searchParams.get("ref") && tags.sourceTag) {
        url.searchParams.set("src", tags.sourceTag);
      }
      if (!url.searchParams.get("campaign") && !url.searchParams.get("utm_campaign") && tags.campaign) {
        url.searchParams.set("campaign", tags.campaign);
      }
      if (!url.searchParams.get("content") && !url.searchParams.get("utm_content") && tags.content) {
        url.searchParams.set("content", tags.content);
      }

      return url.toString();
    } catch (e) {
      return String(urlValue || "");
    }
  }

  function decorateAnchor(anchor) {
    if (!anchor || !anchor.href) return;
    var decorated = decorateUrl(anchor.href);
    if (decorated && decorated !== anchor.href) anchor.href = decorated;
  }

  function asElement(target) {
    if (!target) return null;
    if (target.nodeType === 1) return target;
    return target.parentElement || null;
  }

  function getTrackElement(target) {
    var el = asElement(target);
    return el ? el.closest("[data-ucp-track-click]") : null;
  }

  function getAnchor(target) {
    var el = asElement(target);
    return el ? el.closest("a[href]") : null;
  }

  function logCtaClick(extra) {
    extra = extra || {};
    var targetUrl = String(extra.targetUrl || "").trim();
    var ctaName = normalize(extra.ctaName || "cta_click");
    var dedupeKey = [inferPageType(), ctaName, targetUrl, window.location.href].join("|");
    if (shouldDedupe("cta_click", dedupeKey)) return;
    postEvent("cta_click", {
      pageType: extra.pageType || inferPageType(),
      ctaName: ctaName,
      targetUrl: targetUrl
    });
  }

  function onClick(event) {
    var anchor = getAnchor(event.target);
    var el = getTrackElement(event.target);
    if (anchor && el) decorateAnchor(anchor);
    if (!el) return;

    var targetUrl = el.getAttribute("data-ucp-track-target") || (anchor && anchor.href) || "";
    logCtaClick({
      ctaName: el.getAttribute("data-ucp-track-cta") || el.textContent || "cta_click",
      targetUrl: targetUrl,
      pageType: el.getAttribute("data-ucp-track-page-type") || inferPageType()
    });
  }

  function logPageOpen() {
    var key = [inferPageType(), window.location.href].join("|");
    if (shouldDedupe("page_open", key)) return;
    postEvent("page_open", {
      pageType: inferPageType()
    });
  }

  window.UCP_SOURCE_TRACKER = {
    decorateUrl: decorateUrl,
    logPageOpen: logPageOpen,
    logCtaClick: logCtaClick,
    postEvent: postEvent,
    readTags: getTags
  };

  document.addEventListener("click", onClick, true);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", logPageOpen, { once: true });
  } else {
    logPageOpen();
  }
})();
