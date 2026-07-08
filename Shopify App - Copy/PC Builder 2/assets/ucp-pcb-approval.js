/* File: assets/ucp-pcb-approval.js */
(() => {
  if (window.__UCP_PCB_APPROVAL_BOOT__) return;
  window.__UCP_PCB_APPROVAL_BOOT__ = true;

  const params = new URLSearchParams(window.location.search);
  const approvedParam = params.get("approved") || params.get("approve");
  const quoteParam = params.get("quote");
  const versionParam = params.get("v");
  const hasBuildParam = params.has("build");
  let shouldStripApprovedParam = true;
  let reopenButtonEnabled = true;
  let approvalLoadingModalEnabled = true;
  let approvalQuoteCode = quoteParam || "";
  let approvalQuoteVersion = versionParam || "";
  const INTER_FONT_STACK = '"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
  const BODY_FONT_STACK = INTER_FONT_STACK;
  const REOPEN_LABEL_ACCESS = "Reopen approval";
  const REOPEN_LABEL_APPROVED = "Reopen approved build";

  function stripApprovedParam() {
    if (!shouldStripApprovedParam) return;
    try {
      const u = new URL(window.location.href);
      u.searchParams.delete("approved");
      u.searchParams.delete("approve");
      history.replaceState({}, "", u.toString());
    } catch (e) {}
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
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

  const cfg = readConfig_();
  shouldStripApprovedParam = cfg?.approval_strip_param_on_close !== false;
  reopenButtonEnabled = cfg?.approval_reopen_button_enabled !== false;
  approvalLoadingModalEnabled = cfg?.loading_modals?.approval !== false;

  function isMobile_() {
    return window.matchMedia("(max-width: 768px)").matches;
  }

  function approvalKey_() {
    if (!approvalQuoteCode || !approvalQuoteVersion) return "";
    return `ucp_pcb_approved:${approvalQuoteCode}:${approvalQuoteVersion}`;
  }

  function approvalAccessKey_() {
    if (!approvalQuoteCode || !approvalQuoteVersion) return "";
    return `ucp_pcb_approval_access:${approvalQuoteCode}:${approvalQuoteVersion}`;
  }

  function normalizeVariantTitle_(rawTitle) {
    const title = String(rawTitle || "").trim();
    if (!title) return "";
    if (title.toLowerCase() === "default title") return "";
    return title;
  }

  function setApprovalContext_(quoteCode, quoteVersion) {
    const code = String(quoteCode || "").trim();
    const version = String(quoteVersion || "").trim();
    if (code) approvalQuoteCode = code;
    if (version) approvalQuoteVersion = version;
  }

  function hasApprovedSession_() {
    const key = approvalKey_();
    if (!key) return false;
    try {
      return sessionStorage.getItem(key) === "1";
    } catch (e) {
      return false;
    }
  }

  function markApprovedSession_() {
    const key = approvalKey_();
    if (!key) return;
    try {
      sessionStorage.setItem(key, "1");
    } catch (e) {}
  }

  function hasApprovalAccess_() {
    const key = approvalAccessKey_();
    if (!key) return false;
    try {
      return sessionStorage.getItem(key) === "1";
    } catch (e) {
      return false;
    }
  }

  function markApprovalAccess_() {
    const key = approvalAccessKey_();
    if (!key) return;
    try {
      sessionStorage.setItem(key, "1");
    } catch (e) {}
  }

  function normalizePaymentMethods_(methods) {
    if (!Array.isArray(methods)) return [];
    return methods
      .map((m) => ({
        id: String(m?.id || "").trim(),
        label: String(m?.label || m?.name || "").trim(),
        logo: m?.logo || null,
        qr: m?.qr || null,
        accountName: String(m?.account_name || m?.accountName || "").trim(),
        accountNumber: String(m?.account_number || m?.accountNumber || "").trim()
      }))
      .filter((m) => m.id && m.label);
  }

  function readPaymentConfig_(cfgOverride) {
    const cfg = cfgOverride || readConfig_();
    const p = cfg && cfg.payment ? cfg.payment : {};
    const proofMode = String(p.proof_mode || p.proofMode || "messenger").trim().toLowerCase();

    return {
      enabled: p.enabled !== false,
      proofMode: proofMode === "facebook_page" ? "facebook_page" : "messenger",
      messengerUsername: String(p.messenger_username || p.messengerUsername || "UncappedPC").trim(),
      facebookPageUrl: String(p.facebook_page_url || p.facebookPageUrl || "https://www.facebook.com/UncappedPC").trim(),
      proofText: String(p.proof_text || p.proofText || "").trim(),
      methods: normalizePaymentMethods_(p.methods || [])
    };
  }

  function readMobilePaymentConfig_(cfgOverride) {
    const cfg = cfgOverride || readConfig_();
    const p = cfg && cfg.payment ? cfg.payment : {};
    const rawMode = String(cfg.payment_mobile_pdf_mode || cfg.paymentMobilePdfMode || "no_qr").trim().toLowerCase();
    const pdfMode = rawMode === "embed_qr" || rawMode === "hide_pdf" ? rawMode : "no_qr";

    return {
      qrDownloadEnabled: cfg.payment_mobile_qr_download_enabled !== false,
      pdfMode,
      methods: normalizePaymentMethods_(p.methods || cfg.payment_methods || cfg.paymentMethods || [])
    };
  }

  const reopenBtn = document.getElementById("ucp-pcb-approval-reopen");
  const shouldAutoOpen = approvedParam === "1" && !hasApprovedSession_();

  function setReopenButtonLabel_(nextLabel) {
    if (!reopenBtn) return;
    reopenBtn.textContent = String(nextLabel || "").trim() || REOPEN_LABEL_ACCESS;
  }

  function syncReopenButton_() {
    if (!reopenButtonEnabled || !reopenBtn) return;
    if (hasApprovedSession_()) {
      setReopenButtonLabel_(REOPEN_LABEL_APPROVED);
      reopenBtn.hidden = false;
      return;
    }
    if (hasApprovalAccess_()) {
      setReopenButtonLabel_(REOPEN_LABEL_ACCESS);
      reopenBtn.hidden = false;
      return;
    }
    setReopenButtonLabel_(REOPEN_LABEL_APPROVED);
    reopenBtn.hidden = true;
  }

  function showReopenButton_() {
    if (!reopenButtonEnabled || !reopenBtn) return;
    syncReopenButton_();
  }

  syncReopenButton_();

  function readLiveTotals_() {
    try {
      const fn = window.UCP_PCB_GET_TOTALS;
      if (typeof fn === "function") return fn();
    } catch (e) {}
    return null;
  }

  function readDpPct_() {
    try {
      const raw = params.get("dp");
      if (raw !== null && raw !== undefined && raw !== "") {
        const n = Number(raw);
        if (Number.isFinite(n)) return Math.round(Math.max(0, Math.min(100, n)));
      }
    } catch (e) {}

    try {
      const n = Number(window.__UCP_PCB_DP_PCT__);
      if (Number.isFinite(n)) return Math.round(Math.max(0, Math.min(100, n)));
    } catch (e) {}

    return null;
  }

  function formatMoney_(value) {
    try {
      const fn = window.UCP_PCB_FORMAT_MONEY;
      if (typeof fn === "function") return fn(value);
    } catch (e) {}
    try {
      const num = Number(value);
      if (!Number.isFinite(num)) return "";
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0
      }).format(num);
    } catch (e) {}
    try {
      const num = Number(value);
      if (!Number.isFinite(num)) return "";
      return `PHP ${Math.round(num)}`;
    } catch (e) {}
    return "";
  }

  function parseMoneyText_(text) {
    const raw = String(text || "").trim();
    if (!raw) return null;
    const cleaned = raw.replace(/[^0-9.\-]/g, "");
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }

  function getLiveTotalNumber_() {
    const totals = readLiveTotals_();
    if (totals && totals.total !== undefined && totals.total !== null) {
      const n = Number(totals.total);
      if (Number.isFinite(n)) return n;
    }
    const subtotalEl = document.getElementById("ucp-pcb-subtotal");
    if (subtotalEl && subtotalEl.textContent) {
      const n = parseMoneyText_(subtotalEl.textContent);
      if (Number.isFinite(n)) return n;
    }
    return null;
  }

  function getDpBreakdown_(totalOverride) {
    const pct = readDpPct_();
    if (!Number.isFinite(pct) || pct <= 0) return null;

    const total = Number.isFinite(totalOverride) ? totalOverride : getLiveTotalNumber_();
    if (!Number.isFinite(total)) return null;

    const dpAmountRaw = Math.round((total * pct) / 100);
    const dpAmount = Math.max(0, Math.min(total, dpAmountRaw));
    const balance = Math.max(0, total - dpAmount);

    return { pct, total, dpAmount, balance };
  }

  function getLiveTotalDisplay_() {
    const totals = readLiveTotals_();
    if (totals && totals.total !== undefined && totals.total !== null) {
      const formatted = formatMoney_(totals.total);
      if (formatted) return formatted;
    }

    const subtotalEl = document.getElementById("ucp-pcb-subtotal");
    if (subtotalEl && subtotalEl.textContent) return subtotalEl.textContent.trim();

    return "";
  }

  function formatAmountText_() {
    const dp = getDpBreakdown_();
    if (dp) {
      const dpDisplay = formatMoney_(dp.dpAmount);
      if (dpDisplay) return `Amount to pay now: ${dpDisplay}`;
    }

    const display = getLiveTotalDisplay_();
    return display ? `Total: ${display}` : "";
  }

  async function copyText_(text) {
    const t = String(text || "").trim();
    if (!t) return false;

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(t);
        return true;
      } catch (e) {}
    }

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
    } catch (e) {
      return false;
    }
  }

  function ucpCopyIconSvg_() {
    return (
      '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">' +
      '<rect x="9" y="9" width="10" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"></rect>' +
      '<rect x="5" y="5" width="10" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"></rect>' +
      "</svg>"
    );
  }

  function clearCopyFeedbackTimer_(button) {
    if (!button || !button.__ucpCopyResetTimer) return;
    window.clearTimeout(button.__ucpCopyResetTimer);
    button.__ucpCopyResetTimer = null;
  }

  function setCopyButtonFeedback_(button, actionTextEl, state) {
    if (!button || !actionTextEl) return;
    const nextState = state === "copied" || state === "error" ? state : "idle";
    const buttonLabel =
      nextState === "copied" ? "Copied" : nextState === "error" ? "Copy failed" : "Copy account number";

    button.setAttribute("data-copy-state", nextState);
    button.setAttribute("aria-label", buttonLabel);
    button.setAttribute("title", buttonLabel);
    actionTextEl.textContent = nextState === "copied" ? "Copied" : nextState === "error" ? "Copy failed" : "Copy";
  }

  function bindCopyButton_(button, actionTextEl) {
    if (!button || button.__ucpCopyBound) return;
    button.__ucpCopyBound = true;
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      if (button.disabled) return;

      const raw = String(button.getAttribute("data-copy-value") || "");
      if (!raw.trim()) return;

      clearCopyFeedbackTimer_(button);
      const ok = await copyText_(raw);
      setCopyButtonFeedback_(button, actionTextEl, ok ? "copied" : "error");
      button.__ucpCopyResetTimer = window.setTimeout(() => {
        setCopyButtonFeedback_(button, actionTextEl, "idle");
        button.__ucpCopyResetTimer = null;
      }, 1200);
    });
  }

  function createCopyAccountUi_() {
    const accountBlock = document.createElement("div");
    accountBlock.className = "ucp-pcb__copyAccountBlock";
    accountBlock.hidden = true;

    const accountNameEl = document.createElement("div");
    accountNameEl.className = "ucp-pcb__copyAccountName";
    accountNameEl.hidden = true;

    const accountCopyBtn = document.createElement("button");
    accountCopyBtn.type = "button";
    accountCopyBtn.className = "ucp-pcb__copyAccountBtn";

    const accountCopyMain = document.createElement("span");
    accountCopyMain.className = "ucp-pcb__copyAccountMain";

    const accountCopyLabel = document.createElement("span");
    accountCopyLabel.className = "ucp-pcb__copyAccountLabel";
    accountCopyLabel.textContent = "Number to copy";

    const accountNumberEl = document.createElement("span");
    accountNumberEl.className = "ucp-pcb__copyAccountNumber";

    accountCopyMain.appendChild(accountCopyLabel);
    accountCopyMain.appendChild(accountNumberEl);

    const accountCopyAction = document.createElement("span");
    accountCopyAction.className = "ucp-pcb__copyAccountAction";

    const accountCopyIcon = document.createElement("span");
    accountCopyIcon.className = "ucp-pcb__copyAccountIcon";
    accountCopyIcon.innerHTML = ucpCopyIconSvg_();

    const accountCopyActionTextEl = document.createElement("span");
    accountCopyActionTextEl.className = "ucp-pcb__copyAccountActionText";

    accountCopyAction.appendChild(accountCopyIcon);
    accountCopyAction.appendChild(accountCopyActionTextEl);
    accountCopyBtn.appendChild(accountCopyMain);
    accountCopyBtn.appendChild(accountCopyAction);
    accountBlock.appendChild(accountNameEl);
    accountBlock.appendChild(accountCopyBtn);

    setCopyButtonFeedback_(accountCopyBtn, accountCopyActionTextEl, "idle");
    bindCopyButton_(accountCopyBtn, accountCopyActionTextEl);

    return {
      accountBlock,
      accountNameEl,
      accountNumberEl,
      accountCopyBtn,
      accountCopyActionTextEl
    };
  }

  function setCopyAccountUiContent_(copyUi, accountName, accountNumber) {
    if (!copyUi) return;

    const name = accountName === null || accountName === undefined ? "" : String(accountName);
    const number = accountNumber === null || accountNumber === undefined ? "" : String(accountNumber);
    const hasName = !!name.trim();
    const hasNumber = !!number.trim();

    clearCopyFeedbackTimer_(copyUi.accountCopyBtn);
    setCopyButtonFeedback_(copyUi.accountCopyBtn, copyUi.accountCopyActionTextEl, "idle");

    copyUi.accountNameEl.hidden = !hasName;
    copyUi.accountNameEl.textContent = hasName ? name : "";
    copyUi.accountNumberEl.textContent = hasNumber ? number : "";
    copyUi.accountCopyBtn.hidden = !hasNumber;
    copyUi.accountCopyBtn.disabled = !hasNumber;
    copyUi.accountCopyBtn.setAttribute("data-copy-value", hasNumber ? number : "");
    copyUi.accountBlock.hidden = !(hasName || hasNumber);
  }

  function loadImageWithCors_(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  async function buildQrDownloadUrl_(qrUrl, amountText) {
    if (!qrUrl || !amountText) return null;

    try {
      const img = await loadImageWithCors_(qrUrl);
      const qrW = img.naturalWidth || img.width || 0;
      const qrH = img.naturalHeight || img.height || 0;
      if (!qrW || !qrH) return null;

      const padding = 16;
      const fontSize = 18;
      const textHeight = fontSize + 12;
      const width = Math.max(qrW, 320);
      const height = qrH + padding * 2 + textHeight;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      const qrX = Math.floor((width - qrW) / 2);
      ctx.drawImage(img, qrX, padding, qrW, qrH);

      ctx.fillStyle = "#111111";
      ctx.font = `600 18px ${INTER_FONT_STACK}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(amountText, width / 2, qrH + padding + textHeight / 2);

      const blob = await new Promise((resolve) => {
        try {
          canvas.toBlob(resolve, "image/png");
        } catch (e) {
          resolve(null);
        }
      });

      if (!blob) return null;
      return URL.createObjectURL(blob);
    } catch (e) {
      return null;
    }
  }

  function triggerDownload_(href, filename) {
    if (!href) return;
    const link = document.createElement("a");
    link.href = href;
    if (filename) link.download = filename;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function buildProofLink_(paymentCfg, quoteCode, quoteVersion) {
    const code = String(quoteCode || "").trim();
    const version = String(quoteVersion || "").trim();

    if (paymentCfg.proofMode === "facebook_page") {
      const base = paymentCfg.facebookPageUrl || "https://www.facebook.com/UncappedPC";
      try {
        const u = new URL(base, window.location.origin);
        u.searchParams.set("source", "pcbuilder_pdf");
        if (code) u.searchParams.set("quote", code);
        if (version) u.searchParams.set("v", version);
        return u.toString();
      } catch (e) {
        return base;
      }
    }

    const user = paymentCfg.messengerUsername || "UncappedPC";
    const base = `https://m.me/${encodeURIComponent(user)}`;
    try {
      const u = new URL(base);
      u.searchParams.set("ref", "pcbuilder_pdf");
      u.searchParams.set("source", "pcbuilder_pdf");
      if (code) u.searchParams.set("quote", code);
      if (version) u.searchParams.set("v", version);
      return u.toString();
    } catch (e) {
      return base;
    }
  }

  function proofCtaLabel_(paymentCfg) {
    return paymentCfg.proofMode === "facebook_page" ? "Send proof on Facebook" : "Send proof on Messenger";
  }

  async function ensureBuildAppliedFromUrl() {
    try {
      const api = window.UCP_PCB_BuildLink;
      if (api && typeof api.applyBuildFromUrl === "function") {
        await api.applyBuildFromUrl({ timeoutMs: 8000 });
      }
    } catch (e) {}
  }

  async function waitForSnapshot(timeoutMs = 15000, intervalMs = 120) {
    const start = Date.now();
    let lastSnap = null;

    while (Date.now() - start < timeoutMs) {
      const getter = window.__UCP_PCB_GET_BUILD_SNAPSHOT__;
      if (typeof getter === "function") {
        try {
          const snap = getter();
          if (snap) lastSnap = snap;
          if (snap && Array.isArray(snap.items) && snap.items.length > 0 && isBuildRestoreDone_()) {
            return snap;
          }
        } catch (e) {}
      }
      await sleep(intervalMs);
    }

    return lastSnap;
  }

  function isBuildRestoreDone_() {
    if (!hasBuildParam && !quoteParam) return true;
    try {
      if (window.__UCP_PCB_BUILD_RESTORE_DONE__ === true) return true;
      if (window.__UCP_PCB_BUILD_RESTORE_PROMISE__) return false;
      if (window.__UCP_PCB_QUOTE_LOOKUP_DONE__ === true) return true;
      if (window.__UCP_PCB_QUOTE_LOOKUP_PROMISE__) return false;
      return false;
    } catch (e) {
      return true;
    }
  }

  function renderModal(snap) {
    if (!snap) return null;

     /* DON'T REMOVE THIS COMMENT: this is where I should edit the modal UI*/
    const overlay = document.createElement("div");
    overlay.id = "ucp-pcb-approve-overlay";
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:2500;background:rgba(0,0,0,.55);backdrop-filter:blur(2px);";

    const isMobile = isMobile_();
    const modalWidth = isMobile ? "min(600px,calc(100% - 32px))" : "min(760px,calc(100% - 48px))";

    const modal = document.createElement("div");
    modal.id = "ucp-pcb-approve-modal";
    modal.style.cssText =
      `position:fixed;z-index:2501;left:50%;top:50%;transform:translate(-50%,-50%);width:${modalWidth};max-height:80vh;overflow:auto;background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.25);padding:16px;font-family:${INTER_FONT_STACK};`;

    const closeX = document.createElement("button");
    closeX.type = "button";
    closeX.setAttribute("aria-label", "Close");
    closeX.textContent = "X";
    closeX.style.cssText =
      `position:absolute;top:10px;right:10px;width:32px;height:32px;border-radius:999px;border:1px solid rgba(0,0,0,.12);background:#fff;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-size:14px;line-height:1;font-family:${INTER_FONT_STACK};`;

    const title = document.createElement("div");
    title.textContent = "Review this build";
    title.style.cssText = `font-weight:800;font-size:18px;margin-bottom:4px;font-family:${INTER_FONT_STACK};`;

    const sub = document.createElement("div");
    sub.textContent = "Confirm the parts below.";
    sub.style.cssText = `font-size:13px;opacity:.75;margin-bottom:12px;font-family:${BODY_FONT_STACK};`;

    let delayedNotice = null;
    if (snap.hasDelayedItems) {
      delayedNotice = document.createElement("div");
      delayedNotice.textContent =
        "Some items in this build are not available immediately. Check the availability notes below before continuing.";
      delayedNotice.style.cssText =
        `font-size:12px;line-height:1.45;margin-bottom:12px;padding:10px 12px;border-radius:12px;background:#fff6df;border:1px solid rgba(181,137,0,.28);color:#6b5200;font-family:${BODY_FONT_STACK};`;
    }

    const list = document.createElement("div");
    list.style.cssText = "display:flex;flex-direction:column;gap:10px;";

    if (!snap.items.length) {
      const empty = document.createElement("div");
      empty.textContent = "No items to approve.";
      empty.style.cssText = `font-size:13px;opacity:.8;font-family:${BODY_FONT_STACK};`;
      list.appendChild(empty);
    } else {
      snap.items.forEach((it) => {
        const row = document.createElement("div");
        row.style.cssText = "display:grid;grid-template-columns:48px 1fr auto;gap:10px;align-items:center;border:1px solid rgba(0,0,0,.08);border-radius:12px;padding:8px 10px;";

        const imgWrap = document.createElement("div");
        imgWrap.style.cssText = "width:48px;height:48px;border-radius:10px;overflow:hidden;background:#f6f6f6;display:flex;align-items:center;justify-content:center;border:1px solid rgba(0,0,0,.08);";
        if (it.image) {
          const img = document.createElement("img");
          img.src = it.image;
          img.alt = it.title || "";
          img.style.cssText = "width:100%;height:100%;object-fit:cover;";
          imgWrap.appendChild(img);
        } else {
          imgWrap.textContent = "";
        }

        const mid = document.createElement("div");
        const variantTitle = normalizeVariantTitle_(it.variantTitle);
        const label = document.createElement("div");
        label.textContent = it.label || it.key;
        label.style.cssText = `font-size:11px;opacity:.65;font-family:${BODY_FONT_STACK};`;
        const titleEl = document.createElement("div");
        titleEl.textContent = it.title || "";
        titleEl.style.cssText = `font-size:13px;font-weight:700;font-family:${BODY_FONT_STACK};`;
        const variantEl = document.createElement("div");
        variantEl.textContent = variantTitle;
        variantEl.style.cssText = `font-size:12px;opacity:.7;font-family:${BODY_FONT_STACK};`;
        const availabilityEl = document.createElement("div");
        availabilityEl.textContent = it.availabilityLabel ? `Availability: ${it.availabilityLabel}` : "";
        availabilityEl.style.cssText = `font-size:12px;color:#7a5a00;margin-top:2px;font-family:${BODY_FONT_STACK};`;
        mid.appendChild(label);
        mid.appendChild(titleEl);
        if (variantTitle) mid.appendChild(variantEl);
        if (it.isImmediate === false && it.availabilityLabel) mid.appendChild(availabilityEl);

        const price = document.createElement("div");
        price.textContent = it.priceDisplay || "";
        price.style.cssText = `font-size:13px;font-weight:700;text-align:right;font-family:${BODY_FONT_STACK};`;

        row.appendChild(imgWrap);
        row.appendChild(mid);
        row.appendChild(price);
        list.appendChild(row);
      });
    }

    const totals = document.createElement("div");
    totals.style.cssText = "margin-top:12px;border-top:1px solid rgba(0,0,0,.08);padding-top:10px;display:flex;flex-direction:column;gap:6px;";
    const subtotalRow = document.createElement("div");
    subtotalRow.style.cssText = "display:flex;justify-content:space-between;font-size:13px;";
    subtotalRow.innerHTML = `<span>Subtotal</span><strong>${snap.subtotalBaseDisplay || snap.subtotalDisplay || ""}</strong>`;
    const savingsRow = document.createElement("div");
    savingsRow.style.cssText = "display:flex;justify-content:space-between;font-size:13px;";
    savingsRow.innerHTML = `<span>Bundle discount</span><strong>${snap.savingsDisplay || ""}</strong>`;
    const totalRow = document.createElement("div");
    totalRow.style.cssText = "display:flex;justify-content:space-between;font-size:14px;font-weight:800;";
    totalRow.innerHTML = `<span>Payable subtotal</span><strong>${snap.payableSubtotalDisplay || snap.totalDisplay || snap.subtotalDisplay || ""}</strong>`;
    totals.appendChild(subtotalRow);
    totals.appendChild(savingsRow);
    const promoDiscount = Number(snap.promoDiscount || 0);
    if (Number.isFinite(promoDiscount) && promoDiscount > 0) {
      const promoRow = document.createElement("div");
      promoRow.style.cssText = "display:flex;justify-content:space-between;font-size:13px;";
      const promoDisplay = snap.promoDiscountDisplay || formatMoney_(promoDiscount) || "";
      const promoLabel = String(snap.promoLabel || "Promo discount").trim();
      const promoName = document.createElement("span");
      promoName.textContent = promoLabel;
      const promoAmount = document.createElement("strong");
      promoAmount.textContent = promoDisplay;
      promoRow.appendChild(promoName);
      promoRow.appendChild(promoAmount);
      totals.appendChild(promoRow);
    }
    const addonRows = Array.isArray(snap.addonDiscountRows) ? snap.addonDiscountRows : [];
    addonRows.forEach((row) => {
      const amount = Number(row?.discountAmount || 0);
      if (!(Number.isFinite(amount) && amount > 0)) return;
      const label = String(row?.label || "Add-on discount").trim() || "Add-on discount";
      const addonRow = document.createElement("div");
      addonRow.style.cssText = "display:flex;justify-content:space-between;font-size:13px;";
      const addonName = document.createElement("span");
      addonName.textContent = label;
      const addonAmount = document.createElement("strong");
      addonAmount.textContent = formatMoney_(amount) || "";
      addonRow.appendChild(addonName);
      addonRow.appendChild(addonAmount);
      totals.appendChild(addonRow);
    });
    const manualOff = Number(snap.manualOff || 0);
    if (Number.isFinite(manualOff) && manualOff > 0) {
      const manualRow = document.createElement("div");
      manualRow.style.cssText = "display:flex;justify-content:space-between;font-size:13px;";
      const manualDisplay = snap.manualOffDisplay || formatMoney_(manualOff) || "";
      manualRow.innerHTML = `<span>Additional discount</span><strong>${manualDisplay}</strong>`;
      totals.appendChild(manualRow);
    }
    totals.appendChild(totalRow);

    const snapTotal = Number(snap.total ?? snap.subtotal ?? snap.payableSubtotal ?? "");
    const dpInfo = getDpBreakdown_(snapTotal);
    if (dpInfo) {
      const dpRow = document.createElement("div");
      dpRow.style.cssText = "display:flex;justify-content:space-between;font-size:13px;";
      const dpDisplay = formatMoney_(dpInfo.dpAmount) || "";
      dpRow.innerHTML = `<span>Down payment (${dpInfo.pct}%)</span><strong>${dpDisplay}</strong>`;
      totals.appendChild(dpRow);

      const balRow = document.createElement("div");
      balRow.style.cssText = "display:flex;justify-content:space-between;font-size:13px;";
      const balDisplay = formatMoney_(dpInfo.balance) || "";
      balRow.innerHTML = `<span>Balance</span><strong>${balDisplay}</strong>`;
      totals.appendChild(balRow);
    }

    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;justify-content:flex-end;gap:8px;margin-top:14px;";
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Back";
    closeBtn.style.cssText = `padding:8px 12px;border-radius:10px;border:1px solid rgba(0,0,0,.12);background:#fff;cursor:pointer;font-family:${INTER_FONT_STACK};`;
    const approveBtn = document.createElement("button");
    approveBtn.textContent = "Approve this build";
    approveBtn.style.cssText = `padding:10px 14px;border-radius:10px;border:0;background:#111;color:#fff;font-weight:800;cursor:pointer;font-family:${INTER_FONT_STACK};`;
    approveBtn.disabled = snap.items.length === 0;

    actions.appendChild(closeBtn);
    actions.appendChild(approveBtn);

    modal.appendChild(closeX);
    modal.appendChild(title);
    modal.appendChild(sub);
    if (delayedNotice) modal.appendChild(delayedNotice);
    modal.appendChild(list);
    modal.appendChild(totals);
    modal.appendChild(actions);

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    return { overlay, modal, closeBtn, approveBtn, closeX };
  }

  function renderPaymentModal(snap, paymentCfg, preselectedIds) {
    if (!snap) return null;

    const overlay = document.createElement("div");
    overlay.id = "ucp-pcb-payment-overlay";
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:2500;background:rgba(0,0,0,.55);backdrop-filter:blur(2px);";

    const isMobile = isMobile_();
    const modalWidth = isMobile ? "min(600px,calc(100% - 32px))" : "min(720px,calc(100% - 48px))";

    const modal = document.createElement("div");
    modal.id = "ucp-pcb-payment-modal";
    modal.style.cssText =
      `position:fixed;z-index:2501;left:50%;top:50%;transform:translate(-50%,-50%);width:${modalWidth};max-height:80vh;overflow:auto;background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.25);padding:16px;font-family:${INTER_FONT_STACK};`;

    const title = document.createElement("div");
    title.textContent = "Choose payment method";
    title.style.cssText = `font-weight:800;font-size:18px;margin-bottom:8px;font-family:${INTER_FONT_STACK};`;

    const total = document.createElement("div");
    const totalDisplay = getLiveTotalDisplay_();
    total.textContent = totalDisplay ? `Total: ${totalDisplay}` : "Total";
    total.style.cssText = `font-size:15px;font-weight:800;margin-bottom:12px;font-family:${INTER_FONT_STACK};`;

    const dpSummary = document.createElement("div");
    dpSummary.style.cssText =
      `display:none;flex-direction:column;gap:4px;margin-bottom:12px;font-size:13px;font-family:${INTER_FONT_STACK};`;

    const dpRow = document.createElement("div");
    dpRow.style.cssText = "display:flex;justify-content:space-between;";
    const balanceRow = document.createElement("div");
    balanceRow.style.cssText = "display:flex;justify-content:space-between;";

    dpSummary.appendChild(dpRow);
    dpSummary.appendChild(balanceRow);

    const dpInfoInit = getDpBreakdown_();
    if (dpInfoInit) {
      dpSummary.style.display = "flex";
      const dpDisplay = formatMoney_(dpInfoInit.dpAmount) || "";
      const balanceDisplay = formatMoney_(dpInfoInit.balance) || "";
      dpRow.innerHTML = `<span>Down payment (${dpInfoInit.pct}%)</span><strong>${dpDisplay}</strong>`;
      balanceRow.innerHTML = `<span>Balance</span><strong>${balanceDisplay}</strong>`;
    }

    const copyAccountUi = createCopyAccountUi_();
    const { accountBlock, accountNameEl, accountNumberEl, accountCopyBtn, accountCopyActionTextEl } = copyAccountUi;

    const list = document.createElement("div");
    list.style.cssText = "display:flex;flex-direction:column;gap:10px;max-height:42vh;overflow:auto;";

    const groupName = "ucp-pcb-payment-method";

    paymentCfg.methods.forEach((m) => {
      const row = document.createElement("label");
      row.style.cssText =
        "display:flex;align-items:center;gap:10px;border:1px solid rgba(0,0,0,.08);border-radius:12px;padding:10px 12px;cursor:pointer;";

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = groupName;
      radio.setAttribute("data-method-id", m.id);
      radio.style.cssText = "width:18px;height:18px;";
      if (Array.isArray(preselectedIds) && preselectedIds.includes(m.id)) {
        radio.checked = true;
      }

      const logoWrap = document.createElement("div");
      logoWrap.style.cssText = "width:36px;height:36px;border-radius:8px;background:#f6f6f6;display:flex;align-items:center;justify-content:center;overflow:hidden;border:1px solid rgba(0,0,0,.08);";
      if (m.logo) {
        const img = document.createElement("img");
        img.src = m.logo;
        img.alt = m.label || "";
        img.style.cssText = "width:100%;height:100%;object-fit:contain;";
        logoWrap.appendChild(img);
      }

      const label = document.createElement("div");
      label.textContent = m.label || "";
      label.style.cssText = `font-size:14px;font-weight:700;font-family:${INTER_FONT_STACK};`;

      const textWrap = document.createElement("div");
      textWrap.style.cssText = "display:flex;flex-direction:column;gap:2px;";
      textWrap.appendChild(label);

      row.appendChild(radio);
      row.appendChild(logoWrap);
      row.appendChild(textWrap);
      list.appendChild(row);
    });

    const previewWrap = document.createElement("div");
    previewWrap.style.cssText =
      "display:none;flex-direction:column;align-items:center;gap:8px;margin-top:12px;" +
      "border:1px solid rgba(0,0,0,.08);border-radius:12px;padding:10px;background:#fafafa;";

    const previewImg = document.createElement("img");
    previewImg.style.cssText =
      "width:min(320px,100%);height:auto;border-radius:12px;border:1px solid rgba(0,0,0,.08);" +
      "background:#fff;object-fit:contain;";

    const previewAmount = document.createElement("div");
    previewAmount.style.cssText = `font-size:13px;font-weight:700;text-align:center;font-family:${INTER_FONT_STACK};`;

    const previewProof = document.createElement("div");
    previewProof.style.cssText = `font-size:12px;opacity:.75;text-align:center;font-family:${BODY_FONT_STACK};`;
    previewProof.textContent =
      paymentCfg.proofText || "Please send proof of payment to our Facebook page to validate your payment.";

    const previewNote = document.createElement("div");
    previewNote.style.cssText = `font-size:12px;opacity:.7;text-align:center;font-family:${BODY_FONT_STACK};`;

    previewWrap.appendChild(previewImg);
    previewWrap.appendChild(previewAmount);
    previewWrap.appendChild(accountBlock);
    previewWrap.appendChild(previewProof);
    previewWrap.appendChild(previewNote);

    const helper = document.createElement("div");
    helper.textContent = "Select a payment method.";
    helper.style.cssText = `font-size:12px;color:#b00020;margin-top:8px;display:none;font-family:${BODY_FONT_STACK};`;

    const actions = document.createElement("div");
    actions.style.cssText = isMobile
      ? "display:grid;gap:8px;margin-top:14px;"
      : "display:flex;justify-content:flex-end;gap:8px;margin-top:14px;";

    const backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.textContent = "Back";
    backBtn.style.cssText =
      `padding:8px 12px;border-radius:10px;border:1px solid rgba(0,0,0,.12);background:#fff;cursor:pointer;font-family:${INTER_FONT_STACK};`;

    const downloadBtn = document.createElement("button");
    downloadBtn.type = "button";
    downloadBtn.textContent = "Download QR";
    downloadBtn.style.cssText =
      `padding:10px 14px;border-radius:10px;border:0;background:#111;color:#fff;font-weight:800;cursor:pointer;font-family:${INTER_FONT_STACK};`;

    const pdfBtn = document.createElement("button");
    pdfBtn.type = "button";
    pdfBtn.textContent = "Generate PDF";
    pdfBtn.style.cssText =
      `padding:8px 12px;border-radius:10px;border:1px solid rgba(0,0,0,.12);background:#fff;cursor:pointer;font-family:${INTER_FONT_STACK};`;

    if (isMobile) {
      backBtn.style.width = "100%";
      downloadBtn.style.width = "100%";
      pdfBtn.style.width = "100%";
    }

    actions.appendChild(backBtn);
    actions.appendChild(pdfBtn);
    actions.appendChild(downloadBtn);

    modal.appendChild(title);
    modal.appendChild(total);
    modal.appendChild(dpSummary);
    modal.appendChild(list);
    modal.appendChild(previewWrap);
    modal.appendChild(helper);
    modal.appendChild(actions);

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    const amountText = formatAmountText_();
    return {
      overlay,
      modal,
      backBtn,
      downloadBtn,
      pdfBtn,
      helper,
      list,
      previewWrap,
      previewImg,
      previewAmount,
      previewProof,
      previewNote,
      accountBlock,
      accountNameEl,
      accountNumberEl,
      accountCopyBtn,
      accountCopyActionTextEl,
      dpSummary,
      dpRow,
      balanceRow,
      totalEl: total,
      amountText
    };
  }

  function showLoadingOverlay_() {
    if (!approvalLoadingModalEnabled) return;
    if (document.getElementById("ucp-pcb-approve-loading")) return;
    if (!document.getElementById("ucp-pcb-approve-loading-style")) {
      const style = document.createElement("style");
      style.id = "ucp-pcb-approve-loading-style";
      style.textContent =
        "@keyframes ucpPcbSpin{to{transform:rotate(360deg);}}" +
        ".ucp-pcb__loadingSpinner{width:26px;height:26px;border-radius:999px;border:3px solid #ddd;border-top-color:#111;animation:ucpPcbSpin .9s linear infinite;}" +
        ".ucp-pcb__loadingLogo{max-width:120px;max-height:40px;object-fit:contain;display:block;margin:0 auto 8px;}";
      document.head.appendChild(style);
    }

    const overlay = document.createElement("div");
    overlay.id = "ucp-pcb-approve-loading";
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:2495;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;";

    const box = document.createElement("div");
    box.style.cssText =
      `background:#fff;border-radius:14px;padding:14px 16px;box-shadow:0 20px 60px rgba(0,0,0,.2);font:600 13px/1.3 ${INTER_FONT_STACK};display:flex;flex-direction:column;gap:8px;align-items:center;min-width:180px;`;

    const logoUrl = cfg && cfg.brand_logo ? String(cfg.brand_logo || "").trim() : "";
    if (logoUrl) {
      const logo = document.createElement("img");
      logo.className = "ucp-pcb__loadingLogo";
      logo.src = logoUrl;
      logo.alt = "Brand logo";
      box.appendChild(logo);
    }

    const spinner = document.createElement("div");
    spinner.className = "ucp-pcb__loadingSpinner";

    const text = document.createElement("div");
    text.textContent = "Loading build...";

    box.appendChild(spinner);
    box.appendChild(text);

    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  function hideLoadingOverlay_() {
    document.getElementById("ucp-pcb-approve-loading")?.remove();
  }

  function triggerPdf() {
    try {
      const btn = document.getElementById("ucp-pcb-pdf");
      if (btn) {
        btn.click();
        return;
      }
    } catch (e) {}
  }

  async function run() {
    const paymentCfg = readPaymentConfig_(cfg);
    const mobileCfg = readMobilePaymentConfig_(cfg);
    const mobileQrEnabled = false;
    let snap = null;
    let ui = null;
    let lastSelectedMethodIds = [];
    let paymentTotalsHandler = null;

    function clearPaymentTotalsHandler_() {
      if (!paymentTotalsHandler) return;
      document.removeEventListener("ucp:pcb:build_changed", paymentTotalsHandler);
      paymentTotalsHandler = null;
    }

    async function getSnap_() {
      if (snap) return snap;
      await ensureBuildAppliedFromUrl();
      let next = await waitForSnapshot();
      if (next && Array.isArray(next.items) && next.items.length === 0) {
        // Give it one more short pass in case products finished loading just after the first wait.
        next = (await waitForSnapshot(6000, 150)) || next;
      }
      if (next) {
        snap = next;
        setApprovalContext_(next.quoteCode, next.quoteVersion);
      }
      return next;
    }

    function cleanupAll() {
      hideLoadingOverlay_();
      clearPaymentTotalsHandler_();
      document.getElementById("ucp-pcb-approve-overlay")?.remove();
      document.getElementById("ucp-pcb-approve-modal")?.remove();
      document.getElementById("ucp-pcb-payment-overlay")?.remove();
      document.getElementById("ucp-pcb-payment-modal")?.remove();
      ui = null;
      const payOverlay = document.getElementById("ucp-pcb-pay-overlay");
      const payModal = document.getElementById("ucp-pcb-pay-modal");
      const payMethods = document.getElementById("ucp-pcb-pay-methods");
      if (payOverlay) payOverlay.hidden = true;
      if (payModal) payModal.hidden = true;
      if (payMethods) payMethods.textContent = "";
      document.body.style.overflow = "";
      stripApprovedParam();
      syncReopenButton_();
    }

    function setApprovalVisible(next) {
      if (!ui) return;
      ui.overlay.style.display = next ? "" : "none";
      ui.modal.style.display = next ? "" : "none";
    }

    function destroyApprovalUi_() {
      document.getElementById("ucp-pcb-approve-overlay")?.remove();
      document.getElementById("ucp-pcb-approve-modal")?.remove();
      ui = null;
    }

    function bindApprovalUi_(nextUi) {
      if (!nextUi) return;

      nextUi.overlay.addEventListener("click", cleanupAll);
      nextUi.closeBtn.addEventListener("click", cleanupAll);
      if (nextUi.closeX) nextUi.closeX.addEventListener("click", cleanupAll);

      nextUi.approveBtn.addEventListener("click", async () => {
        if (typeof window.UCP_PCB_LOG_EVENT === "function") {
          window.UCP_PCB_LOG_EVENT("approve_build_click", {
            quoteCode: snap?.quoteCode || "",
            quoteVersion: snap?.quoteVersion || "",
            buildLink: snap?.buildLink || "",
            approvalLink: snap?.approvalLink || "",
            pageUrl: window.location.href
          });
        }

        markApprovedSession_();
        showReopenButton_();
        lastSelectedMethodIds = [];
        stripApprovedParam();
        if (paymentCfg.enabled && paymentCfg.methods.length) {
          setApprovalVisible(false);
          snap = null;
          snap = await getSnap_();
          if (!snap) return;
          openPaymentStep(lastSelectedMethodIds, true);
          return;
        }
        triggerPdf();
        cleanupAll();
      });
    }

    async function ensureApprovalUi_(opts = {}) {
      if (opts && (opts.quoteCode || opts.quoteVersion)) {
        setApprovalContext_(opts.quoteCode, opts.quoteVersion);
      }

      snap = null;
      showLoadingOverlay_();
      try {
        const nextSnap = await getSnap_();
        if (!nextSnap) return null;
        clearPaymentTotalsHandler_();
        document.getElementById("ucp-pcb-payment-overlay")?.remove();
        document.getElementById("ucp-pcb-payment-modal")?.remove();
        const payOverlay = document.getElementById("ucp-pcb-pay-overlay");
        const payModal = document.getElementById("ucp-pcb-pay-modal");
        if (payOverlay) payOverlay.hidden = true;
        if (payModal) payModal.hidden = true;
        destroyApprovalUi_();
        ui = renderModal(nextSnap);
        if (!ui) return null;
        bindApprovalUi_(ui);
        return ui;
      } finally {
        hideLoadingOverlay_();
      }
    }

    async function openApprovalFlow_(opts = {}) {
      const nextUi = await ensureApprovalUi_(opts);
      if (!nextUi) return false;
      if (opts && opts.markAccess) {
        markApprovalAccess_();
      }
      setApprovalVisible(true);
      return true;
    }

    window.UCP_PCB_APPROVAL = window.UCP_PCB_APPROVAL || {};
    window.UCP_PCB_APPROVAL.open = openApprovalFlow_;

    if (shouldAutoOpen) {
      const opened = await openApprovalFlow_({ markAccess: true });
      if (!opened) {
        stripApprovedParam();
        return;
      }
    }

    function renderMobilePaymentQrStep(selectedMethodIds) {
      const overlay = document.getElementById("ucp-pcb-pay-overlay");
      const modal = document.getElementById("ucp-pcb-pay-modal");
      const methodsEl = document.getElementById("ucp-pcb-pay-methods");
      const closeBtn = document.getElementById("ucp-pcb-pay-close");
      const proofBtn = document.getElementById("ucp-pcb-pay-proof");
      const proofNote = document.getElementById("ucp-pcb-pay-proof-note");
      const pdfBtn = document.getElementById("ucp-pcb-pay-pdf");

      if (!snap) return null;
      if (!overlay || !modal || !methodsEl || !closeBtn || !proofBtn || !proofNote) return null;

      const methodCatalog = new Map();
      mobileCfg.methods.forEach((m) => methodCatalog.set(m.id, m));
      paymentCfg.methods.forEach((m) => {
        if (!methodCatalog.has(m.id)) methodCatalog.set(m.id, m);
      });

      const selected = (Array.isArray(selectedMethodIds) ? selectedMethodIds : [])
        .map((id) => methodCatalog.get(id))
        .filter(Boolean);
      const amountText = formatAmountText_();

      methodsEl.textContent = "";

      if (!selected.length) {
        const empty = document.createElement("div");
        empty.textContent = "No payment methods selected.";
        empty.style.cssText = "font-size:13px;opacity:.75;";
        methodsEl.appendChild(empty);
      } else {
        selected.forEach((method) => {
          const card = document.createElement("div");
          card.className = "ucp-pcb__payCard";

          const head = document.createElement("div");
          head.className = "ucp-pcb__payCardHead";

          const logoWrap = document.createElement("div");
          logoWrap.className = "ucp-pcb__payLogo";
          if (method.logo) {
            const logo = document.createElement("img");
            logo.src = method.logo;
            logo.alt = method.label || "";
            logoWrap.appendChild(logo);
          }

          const info = document.createElement("div");
          const name = document.createElement("div");
          name.className = "ucp-pcb__payName";
          name.textContent = method.label || "";
          info.appendChild(name);

          head.appendChild(logoWrap);
          head.appendChild(info);
          card.appendChild(head);

          if (method.qr) {
            const qr = document.createElement("img");
            qr.className = "ucp-pcb__payQr";
            qr.src = method.qr;
            qr.alt = `${method.label || ""} QR`;
            card.appendChild(qr);

            const links = document.createElement("div");
            links.className = "ucp-pcb__payLinks";

            const download = document.createElement("a");
            download.className = "ucp-pcb__btn ucp-pcb__btn--solid ucp-pcb__payLink";
            download.href = method.qr;
            download.setAttribute("download", `UCP-${method.id}-QR.png`);
            download.textContent = "Download QR";
            download.addEventListener("click", async (event) => {
              event.preventDefault();
              if (typeof window.UCP_PCB_LOG_EVENT === "function") {
                window.UCP_PCB_LOG_EVENT("download_qr", {
                  quoteCode: snap.quoteCode || "",
                  quoteVersion: snap.quoteVersion || "",
                  payment_method_id: method.id || "",
                  pageUrl: window.location.href
                });
              }
              const customUrl = await buildQrDownloadUrl_(method.qr, amountText);
              if (customUrl) {
                triggerDownload_(customUrl, `UCP-${method.id}-QR.png`);
                setTimeout(() => URL.revokeObjectURL(customUrl), 1200);
                return;
              }
              window.open(method.qr, "_blank", "noopener");
            });

            const open = document.createElement("a");
            open.className = "ucp-pcb__btn ucp-pcb__payLink";
            open.href = method.qr;
            open.target = "_blank";
            open.rel = "noopener";
            open.textContent = "Open QR";

            links.appendChild(download);
            links.appendChild(open);
            card.appendChild(links);
          } else {
            const noQr = document.createElement("div");
            noQr.className = "ucp-pcb__payMeta";
            noQr.textContent = "QR not available.";
            card.appendChild(noQr);
          }

          if (amountText) {
            const amount = document.createElement("div");
            amount.className = "ucp-pcb__payAmount";
            amount.textContent = amountText;
            card.appendChild(amount);
          }

          if (method.accountName || method.accountNumber) {
            const cardCopyUi = createCopyAccountUi_();
            setCopyAccountUiContent_(cardCopyUi, method.accountName, method.accountNumber);
            card.appendChild(cardCopyUi.accountBlock);
          }

          methodsEl.appendChild(card);
        });
      }

      proofNote.textContent =
        paymentCfg.proofText || "Please send proof of payment to our Facebook page to validate your payment.";

      if (pdfBtn) {
        if (mobileCfg.pdfMode === "hide_pdf") {
          pdfBtn.hidden = true;
        } else {
          pdfBtn.hidden = false;
          pdfBtn.textContent =
            mobileCfg.pdfMode === "no_qr" ? "Download build PDF (no QR)" : "Download build PDF";
        }
      }

      overlay.hidden = false;
      modal.hidden = false;
      modal.scrollTop = 0;

      return { overlay, modal, closeBtn, proofBtn, pdfBtn, selectedMethods: selected };
    }

    function openQrStep(selectedIds, selectedMethods, proofLink, proofText) {
      const payStep = renderMobilePaymentQrStep(selectedIds);
      if (!payStep) {
        triggerPdf();
        cleanupAll();
        return;
      }

      const selectedIdsCsv = selectedIds.join(",");

      payStep.overlay.addEventListener("click", cleanupAll);
      payStep.closeBtn.addEventListener("click", cleanupAll);
      payStep.proofBtn.addEventListener("click", () => {
        if (typeof window.UCP_PCB_LOG_EVENT === "function") {
          window.UCP_PCB_LOG_EVENT("send_proof_click", {
            quoteCode: snap.quoteCode || "",
            quoteVersion: snap.quoteVersion || "",
            selectedPaymentMethodIds: selectedIdsCsv,
            pageUrl: window.location.href
          });
        }
        const win = window.open(proofLink, "_blank", "noopener");
        if (!win) window.location.href = proofLink;
      });

      if (payStep.pdfBtn && !payStep.pdfBtn.hidden) {
        payStep.pdfBtn.addEventListener("click", () => {
          const pdfMethods =
            mobileCfg.pdfMode === "no_qr"
              ? selectedMethods.map((m) => ({ ...m, qr: null }))
              : selectedMethods;

          if (typeof window.UCP_PCB_PDF?.open === "function") {
            window.UCP_PCB_PDF.open({
              paymentMethodsSelected: pdfMethods,
              proofText,
              proofLink,
              proofCtaLabel: proofCtaLabel_(paymentCfg)
            });
          } else {
            triggerPdf();
          }

          if (typeof window.UCP_PCB_LOG_EVENT === "function") {
            window.UCP_PCB_LOG_EVENT("approved_pdf_generated", {
              quoteCode: snap.quoteCode || "",
              quoteVersion: snap.quoteVersion || "",
              selectedPaymentMethodIds: selectedIdsCsv,
              pageUrl: window.location.href
            });
          }
        });
      }
    }

    function openPaymentStep(preselectedIds, returnToApproval) {
      if (!snap) return;
      const payUi = renderPaymentModal(snap, paymentCfg, preselectedIds);
      if (!payUi) return;
      clearPaymentTotalsHandler_();

      if (ui) {
        ui.overlay.style.display = "none";
        ui.modal.style.display = "none";
      }

      function setPaymentTotals_(display) {
        const totalLabel = display ? `Total: ${display}` : "Total";
        if (payUi.totalEl) payUi.totalEl.textContent = totalLabel;
        const dpInfo = getDpBreakdown_();
        if (payUi.dpSummary && payUi.dpRow && payUi.balanceRow) {
          if (dpInfo) {
            payUi.dpSummary.style.display = "flex";
            const dpDisplay = formatMoney_(dpInfo.dpAmount) || "";
            const balanceDisplay = formatMoney_(dpInfo.balance) || "";
            payUi.dpRow.innerHTML = `<span>Down payment (${dpInfo.pct}%)</span><strong>${dpDisplay}</strong>`;
            payUi.balanceRow.innerHTML = `<span>Balance</span><strong>${balanceDisplay}</strong>`;
          } else {
            payUi.dpSummary.style.display = "none";
          }
        }
        payUi.amountText = formatAmountText_();
        if (payUi.previewAmount) payUi.previewAmount.textContent = payUi.amountText || "";
      }

      function refreshPaymentTotals_() {
        const display = getLiveTotalDisplay_();
        setPaymentTotals_(display);
      }

      paymentTotalsHandler = (e) => {
        const totals = e && e.detail ? e.detail.totals : null;
        let display = "";
        if (totals && totals.total !== undefined && totals.total !== null) {
          display = formatMoney_(totals.total);
        }
        if (!display) display = getLiveTotalDisplay_();
        setPaymentTotals_(display);
      };

      document.addEventListener("ucp:pcb:build_changed", paymentTotalsHandler);
      refreshPaymentTotals_();

      function backToApproval() {
        clearPaymentTotalsHandler_();
        payUi.overlay.remove();
        payUi.modal.remove();
        if (returnToApproval && ui) {
          setApprovalVisible(true);
        } else {
          cleanupAll();
        }
      }

      function getSelectedId() {
        const input = payUi.list.querySelector('input[type="radio"]:checked');
        return input ? String(input.getAttribute("data-method-id") || "").trim() : "";
      }

      function ensureSelection() {
        const selectedId = getSelectedId();
        if (!selectedId) {
          payUi.helper.style.display = "block";
          return "";
        }
        payUi.helper.style.display = "none";
        return selectedId;
      }

      function setSelectedAccount_(selectedId) {
        if (
          !payUi.accountBlock ||
          !payUi.accountNameEl ||
          !payUi.accountNumberEl ||
          !payUi.accountCopyBtn ||
          !payUi.accountCopyActionTextEl
        ) {
          return;
        }

        const method = paymentCfg.methods.find((m) => m.id === selectedId);
        const accountName = method && method.accountName ? String(method.accountName) : "";
        const accountNumber = method && method.accountNumber ? String(method.accountNumber) : "";
        setCopyAccountUiContent_(payUi, accountName || (method ? method.label || "" : ""), accountNumber);
      }

      function updatePreview(selectedId) {
        if (!payUi.previewWrap) return;
        const method = paymentCfg.methods.find((m) => m.id === selectedId);
        if (!method) {
          payUi.previewWrap.style.display = "none";
          return;
        }

        payUi.previewWrap.style.display = "flex";
        if (payUi.previewAmount) payUi.previewAmount.textContent = payUi.amountText || "";

        if (method.qr) {
          if (payUi.previewImg) {
            payUi.previewImg.src = method.qr;
            payUi.previewImg.alt = `${method.label || ""} QR`;
            payUi.previewImg.style.display = "";
          }
          if (payUi.previewNote) payUi.previewNote.textContent = "";
          return;
        }

        if (payUi.previewImg) {
          payUi.previewImg.removeAttribute("src");
          payUi.previewImg.alt = "";
          payUi.previewImg.style.display = "none";
        }
        if (payUi.previewNote) payUi.previewNote.textContent = "QR not available for this method.";
      }

      payUi.overlay.addEventListener("click", backToApproval);
      payUi.backBtn.addEventListener("click", backToApproval);

      payUi.list.addEventListener("change", () => {
        const selectedId = getSelectedId();
        lastSelectedMethodIds = selectedId ? [selectedId] : [];
        payUi.helper.style.display = "none";
        setSelectedAccount_(selectedId);
        updatePreview(selectedId);
      });

      setSelectedAccount_(getSelectedId());
      updatePreview(getSelectedId());

      payUi.downloadBtn.addEventListener("click", () => {
        const selectedId = ensureSelection();
        if (!selectedId) return;

        const method = paymentCfg.methods.find((m) => m.id === selectedId);
        if (!method || !method.qr) {
          payUi.helper.textContent = "QR not available for this method.";
          payUi.helper.style.display = "block";
          return;
        }

        lastSelectedMethodIds = [selectedId];
        payUi.helper.textContent = "Select a payment method.";
        payUi.helper.style.display = "none";
        triggerDownload_(method.qr, `UCP-${method.id}-QR.png`);
      });

      payUi.pdfBtn.addEventListener("click", () => {
        const selectedId = ensureSelection();
        if (!selectedId) return;

        const method = paymentCfg.methods.find((m) => m.id === selectedId);
        if (!method) return;

        lastSelectedMethodIds = [selectedId];

        const proofLink = buildProofLink_(paymentCfg, snap.quoteCode, snap.quoteVersion);
        const proofText =
          paymentCfg.proofText ||
          "Please send proof of payment to our Facebook page to validate your payment.";

        if (typeof window.UCP_PCB_PDF?.open === "function") {
          window.UCP_PCB_PDF.open({
            paymentMethodsSelected: [method],
            proofText,
            proofLink,
            proofCtaLabel: proofCtaLabel_(paymentCfg)
          });
        } else {
          triggerPdf();
        }
      });
    }

    async function handleReopenClick() {
      if (!reopenButtonEnabled) return;
      if (typeof window.UCP_PCB_LOG_EVENT === "function") {
        window.UCP_PCB_LOG_EVENT("approval_reopen_click", {
          quoteCode: approvalQuoteCode || snap?.quoteCode || "",
          quoteVersion: approvalQuoteVersion || snap?.quoteVersion || "",
          buildLink: snap?.buildLink || "",
          approvalLink: snap?.approvalLink || window.location.href,
          pageUrl: window.location.href
        });
      }

      await openApprovalFlow_({
        quoteCode: approvalQuoteCode || snap?.quoteCode || "",
        quoteVersion: approvalQuoteVersion || snap?.quoteVersion || ""
      });
    }

    if (reopenButtonEnabled && reopenBtn) {
      reopenBtn.addEventListener("click", () => {
        handleReopenClick().catch(() => {});
      });
    }

  }

  run().catch(() => stripApprovedParam());
})();
