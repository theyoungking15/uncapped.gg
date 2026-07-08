/* File: assets/ucp-pcb-onboarding.js */
(() => {
  if (window.__UCP_PCB_ONBOARDING_BOOT__) return;
  window.__UCP_PCB_ONBOARDING_BOOT__ = true;

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

  function getLogger_() {
    try {
      if (typeof window.UCP_PCB_LOG_EVENT === "function") {
        return window.UCP_PCB_LOG_EVENT;
      }
      if (typeof window.__UCP_PCB_LOG_EVENT__ !== "function") {
        window.__UCP_PCB_LOG_EVENT__ = function () {};
      }
      return window.__UCP_PCB_LOG_EVENT__;
    } catch (e) {
      return function () {};
    }
  }

  const logEvent = getLogger_();

  function ucpPcbHasSharedParams_() {
    try {
      const params = new URLSearchParams(window.location.search);
      const keys = [
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
        "cpucooler",
        "quote",
        "v",
        "build",
        "buildId"
      ];
      return keys.some((k) => params.has(k));
    } catch (e) {
      return false;
    }
  }

  function ucpPcbShouldShowOnboarding_(cfg) {
    if (!cfg || cfg.onboarding_enabled === false) return false;
    if (ucpPcbHasSharedParams_()) return false;
    try {
      return localStorage.getItem("ucp_pcb_onboarded") !== "1";
    } catch (e) {
      return true;
    }
  }

  function ucpPcbOpenOnboard_() {
    if (!onboardOverlay || !onboardModal) return;
    onboardOverlay.hidden = false;
    onboardModal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function ucpPcbCloseOnboard_() {
    if (!onboardOverlay || !onboardModal) return;
    onboardOverlay.hidden = true;
    onboardModal.hidden = true;
    document.body.style.overflow = "";
  }

  function ucpPcbMarkOnboarded_() {
    try {
      localStorage.setItem("ucp_pcb_onboarded", "1");
    } catch (e) {}
  }

  function ucpPcbFlashEl_(el) {
    if (!el) return;
    el.classList.remove("ucp-pcb__flash");
    void el.offsetWidth;
    el.classList.add("ucp-pcb__flash");
    setTimeout(() => {
      el.classList.remove("ucp-pcb__flash");
    }, 1500);
  }

  function ucpPcbScrollToShare_() {
    const shareBtn = document.getElementById("ucp-pcb-share");
    if (!shareBtn) return;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile) {
      const openBtn = document.getElementById("ucp-pcb-mobilebar-open");
      if (openBtn) openBtn.click();
      setTimeout(() => {
        shareBtn.scrollIntoView({ behavior: "smooth", block: "center" });
        ucpPcbFlashEl_(shareBtn);
      }, 350);
      return;
    }

    shareBtn.scrollIntoView({ behavior: "smooth", block: "center" });
    ucpPcbFlashEl_(shareBtn);
  }

  function ucpPcbApplyHints_(cfg) {
    const shareHint = document.getElementById("ucp-pcb-hint-share");
    const quoteHint = document.getElementById("ucp-pcb-hint-quote");
    const enabled = cfg && cfg.hints_enabled !== false;

    if (shareHint) {
      const text = enabled ? String(cfg.hint_share_text || "").trim() : "";
      shareHint.textContent = text;
      shareHint.hidden = !text;
    }
    if (quoteHint) {
      const text = enabled ? String(cfg.hint_quote_text || "").trim() : "";
      quoteHint.textContent = text;
      quoteHint.hidden = !text;
    }
  }

  function ucpPcbApplyGif_(cfg) {
    if (!gifWrap || !gifImg || !viewDemoBtn) return;

    const enabled = cfg && cfg.onboarding_gif_enabled === true;
    const mode = String(cfg.onboarding_gif_mode || "embed").trim().toLowerCase();
    const src = String(cfg.onboarding_gif_src || "").trim();

    if (!enabled || !src) {
      gifWrap.hidden = true;
      viewDemoBtn.hidden = true;
      gifImg.removeAttribute("src");
      return;
    }

    if (mode === "link") {
      gifWrap.hidden = true;
      viewDemoBtn.hidden = false;
      viewDemoBtn.textContent = String(cfg.onboarding_view_demo_label || "View demo");
      viewDemoBtn.setAttribute("href", src);
      viewDemoBtn.setAttribute("target", "_blank");
      viewDemoBtn.setAttribute("rel", "noopener");
      gifImg.removeAttribute("src");
      return;
    }

    gifImg.src = src;
    gifWrap.hidden = false;
    viewDemoBtn.hidden = true;
  }

  function ucpPcbBindEventLogging_() {
    document.addEventListener("click", (e) => {
      const shareBtn = e.target.closest("#ucp-pcb-share, #ucp-pcb-mobilebar-share");
      if (shareBtn) {
        logEvent("share_clicked", { pageUrl: window.location.href });
      }

      const quoteBtn = e.target.closest("#ucp-pcb-request-quote, #ucp-pcb-mobilebar-quote");
      if (quoteBtn) {
        logEvent("request_quote_clicked", { pageUrl: window.location.href });
      }
    });

    document.addEventListener("ucp:pcb:share_copied", () => {
      logEvent("share_copied", { pageUrl: window.location.href });
    });
  }

  const onboardOverlay = document.getElementById("ucp-pcb-onboard-overlay");
  const onboardModal = document.getElementById("ucp-pcb-onboard-modal");
  const onboardTitle = document.getElementById("ucp-pcb-onboard-title");
  const onboardBullets = document.getElementById("ucp-pcb-onboard-bullets");
  const gifWrap = document.getElementById("ucp-pcb-onboard-gif-wrap");
  const gifImg = document.getElementById("ucp-pcb-onboard-gif");
  const onboardClose = document.getElementById("ucp-pcb-onboard-close");
  const onboardTryShare = document.getElementById("ucp-pcb-onboard-try-share");
  const viewDemoBtn = document.getElementById("ucp-pcb-onboard-view-demo");

  function applyOnboardCopy_() {
    if (onboardTitle) {
      onboardTitle.textContent = String(cfg.onboarding_title || "How this PC Builder works");
    }

    if (onboardBullets) {
      const bulletsRaw = Array.isArray(cfg.onboarding_bullets) ? cfg.onboarding_bullets : [];
      const bullets = bulletsRaw.map((b) => String(b || "").trim()).filter(Boolean);
      onboardBullets.innerHTML = bullets.map((b) => `<li>${b}</li>`).join("");
    }

    if (onboardClose) {
      onboardClose.textContent = String(cfg.onboarding_got_it_label || "Got it");
    }

    if (onboardTryShare) {
      const showTry = cfg.onboarding_show_try_share !== false;
      onboardTryShare.hidden = !showTry;
      onboardTryShare.textContent = String(cfg.onboarding_try_share_label || "Try sharing");
    }
  }

  ucpPcbBindEventLogging_();
  ucpPcbApplyHints_(cfg);
  ucpPcbApplyGif_(cfg);
  applyOnboardCopy_();

  if (onboardClose) {
    onboardClose.addEventListener("click", () => {
      ucpPcbMarkOnboarded_();
      ucpPcbCloseOnboard_();
    });
  }

  if (onboardTryShare) {
    onboardTryShare.addEventListener("click", () => {
      ucpPcbMarkOnboarded_();
      ucpPcbCloseOnboard_();
      ucpPcbScrollToShare_();
    });
  }

  if (onboardOverlay) {
    onboardOverlay.addEventListener("click", () => {
      ucpPcbMarkOnboarded_();
      ucpPcbCloseOnboard_();
    });
  }

  if (ucpPcbShouldShowOnboarding_(cfg)) {
    ucpPcbOpenOnboard_();
  }

  window.ucpPcbHasSharedParams_ = ucpPcbHasSharedParams_;
  window.ucpPcbShouldShowOnboarding_ = ucpPcbShouldShowOnboarding_;
  window.ucpPcbOpenOnboard_ = ucpPcbOpenOnboard_;
  window.ucpPcbCloseOnboard_ = ucpPcbCloseOnboard_;
  window.ucpPcbMarkOnboarded_ = ucpPcbMarkOnboarded_;
  window.ucpPcbFlashEl_ = ucpPcbFlashEl_;
  window.ucpPcbScrollToShare_ = ucpPcbScrollToShare_;
  window.ucpPcbApplyHints_ = ucpPcbApplyHints_;
  window.ucpPcbApplyGif_ = ucpPcbApplyGif_;
  window.ucpPcbBindEventLogging_ = ucpPcbBindEventLogging_;
})();
