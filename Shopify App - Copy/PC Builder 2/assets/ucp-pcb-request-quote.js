/* File: assets/ucp-pcb-request-quote.js */
(() => {
  if (window.__UCP_PCB_QUOTE_BOOT__) return;
  window.__UCP_PCB_QUOTE_BOOT__ = true;

  const CFG = readJsonEl("ucp-pcb-config");

  const btnDesktop = document.getElementById("ucp-pcb-request-quote");
  if (!btnDesktop) return;

  const modal = document.getElementById("ucp-pcb-quote-modal");
  const overlay = document.getElementById("ucp-pcb-quote-overlay");
  const closeBtn = document.getElementById("ucp-pcb-quote-close");

  const codeEl = document.getElementById("ucp-pcb-quote-code");
  const copyCodeBtn = document.getElementById("ucp-pcb-quote-copy-code");

  const linkEl = document.getElementById("ucp-pcb-quote-link");
  const copyLinkBtn = document.getElementById("ucp-pcb-quote-copy-link");

  const chatBtn = document.getElementById("ucp-pcb-quote-chat");

  function readJsonEl(id) {
    try {
      const el = document.getElementById(id);
      if (!el || !el.textContent) return {};
      return JSON.parse(el.textContent);
    } catch (_) {
      return {};
    }
  }

  function makeCode() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoids I,O,0,1
    let s = "Q-";
    for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
    return s;
  }

  function textFrom(el) {
    return (el && el.textContent ? String(el.textContent) : "").trim();
  }

  function getMoneyFromDom(id) {
    const el = document.getElementById(id);
    return textFrom(el) || "";
  }

  function readPickedFromDom() {
    const root = document.getElementById("ucp-pcb-picked");
    if (!root) return [];
    const items = Array.from(root.querySelectorAll(".ucp-pcb__pickedItem"));
    return items.map((it) => {
      const label = textFrom(it.querySelector(".ucp-pcb__pickedLabel")) || "";
      const sel = textFrom(it.querySelector(".ucp-pcb__pickedSelection small")) || textFrom(it.querySelector(".ucp-pcb__pickedSelection")) || "";
      const price = textFrom(it.querySelector(".ucp-pcb__pickedPrice")) || "";
      return { label, selection: sel, price };
    }).filter((x) => x.label || x.selection || x.price);
  }

  function buildPayload(code, snapshot, buildLink) {
    return {
      code,
      created_at: new Date().toISOString(),
      page_url: String(window.location.href),
      build_link: buildLink,
      totals: {
        subtotal: getMoneyFromDom("ucp-pcb-subtotal"),
        savings: getMoneyFromDom("ucp-pcb-savings"),
      },
      selected: (snapshot && snapshot.selected) ? snapshot.selected : {},
      picked: readPickedFromDom(),
      user_agent: navigator.userAgent,
    };
  }

  async function postToContact(payload) {
    const messengerUrl = String((CFG && CFG.messenger_url) || "").trim();

    // You can override endpoint via cfg if you want later
    const endpoint = String((CFG && CFG.quote_contact_endpoint) || "/contact").trim() || "/contact";

    const bodyLines = [];
    bodyLines.push("UCP PC Builder Quote Request");
    bodyLines.push("");
    bodyLines.push("Quote Code: " + (payload.code || ""));
    bodyLines.push("Build Link: " + (payload.build_link || ""));
    bodyLines.push("Subtotal: " + (payload.totals && payload.totals.subtotal ? payload.totals.subtotal : ""));
    bodyLines.push("Promo Code Savings: " + (payload.totals && payload.totals.savings ? payload.totals.savings : ""));
    bodyLines.push("");
    bodyLines.push("Picked Items:");
    (payload.picked || []).forEach((p) => {
      const left = [p.label, p.selection].filter(Boolean).join(": ");
      const right = p.price ? " (" + p.price + ")" : "";
      bodyLines.push("- " + left + right);
    });
    bodyLines.push("");
    bodyLines.push("Selected Variant IDs JSON:");
    bodyLines.push(JSON.stringify(payload.selected || {}));
    bodyLines.push("");
    if (messengerUrl) bodyLines.push("Messenger: " + messengerUrl);

    const fd = new FormData();
    fd.append("form_type", "contact");
    fd.append("utf8", "✓");

    // These can be anything. Shopify uses them to send the email to store owner.
    fd.append("contact[name]", "UCP PC Builder");
    fd.append("contact[email]", "pcbuilder@uncappedpc.com"); // change if you want
    fd.append("contact[subject]", "Quote Request " + (payload.code || ""));
    fd.append("contact[body]", bodyLines.join("\n"));

    // Same-origin POST. If /contact does not exist, this can fail.
    const res = await fetch(endpoint, { method: "POST", body: fd, credentials: "same-origin" });

    // Shopify typically redirects on success. fetch will still resolve with 200 or 302.
    return res && (res.ok || res.status === 302);
  }

  function openModal(code, link) {
    if (!modal || !overlay) return;

    codeEl.textContent = code || "Q-XXXXXX";
    linkEl.value = link || "";

    overlay.hidden = false;
    modal.hidden = false;
    document.documentElement.style.overflow = "hidden";
  }

  function closeModal() {
    if (!modal || !overlay) return;
    overlay.hidden = true;
    modal.hidden = true;
    document.documentElement.style.overflow = "";
  }

  async function copyToClipboard(text) {
    const s = String(text || "").trim();
    if (!s) return false;

    try {
      await navigator.clipboard.writeText(s);
      return true;
    } catch (_) {
      try {
        const ta = document.createElement("textarea");
        ta.value = s;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand("copy");
        ta.remove();
        return !!ok;
      } catch (_) {
        return false;
      }
    }
  }

  function openMessenger(code) {
    const url = String((CFG && CFG.messenger_url) || "").trim();
    if (!url) return false;

    // Optional. If your m.me link supports ref, this is useful.
    // It does not break anything if unsupported.
    const u = new URL(url, window.location.origin);
    if (!u.searchParams.get("ref")) u.searchParams.set("ref", String(code || ""));
    window.open(u.toString(), "_blank", "noopener");
    return true;
  }

  async function onRequestQuote() {
    if (!window.UCP_PCB_API || typeof window.UCP_PCB_API.getSnapshot !== "function") return;

    btnDesktop.disabled = true;
    const oldText = btnDesktop.textContent;
    btnDesktop.textContent = "Generating…";

    const code = makeCode();

    let snapshot = {};
    try {
      snapshot = window.UCP_PCB_API.getSnapshot() || {};
    } catch (_) {}

    let buildLink = String(window.location.href);
    try {
      if (window.UCP_PCB_BuildLink && typeof window.UCP_PCB_BuildLink.generateBuildLink === "function") {
        buildLink = window.UCP_PCB_BuildLink.generateBuildLink(snapshot);
      }
    } catch (_) {}

    const payload = buildPayload(code, snapshot, buildLink);

    // Send to store inbox via /contact. Even if this fails, still show the code.
    try {
      await postToContact(payload);
    } catch (_) {}

    openModal(code, buildLink);

    btnDesktop.disabled = false;
    btnDesktop.textContent = oldText;
  }

  btnDesktop.addEventListener("click", (e) => {
    e.preventDefault();
    onRequestQuote().catch(() => {});
  });

  if (overlay) overlay.addEventListener("click", closeModal);
  if (closeBtn) closeBtn.addEventListener("click", closeModal);

  if (copyCodeBtn) {
    copyCodeBtn.addEventListener("click", async () => {
      const ok = await copyToClipboard(textFrom(codeEl));
      copyCodeBtn.textContent = ok ? "Copied" : "Copy failed";
      setTimeout(() => (copyCodeBtn.textContent = "Copy"), 1200);
    });
  }

  if (copyLinkBtn) {
    copyLinkBtn.addEventListener("click", async () => {
      const ok = await copyToClipboard(linkEl.value);
      copyLinkBtn.textContent = ok ? "Copied" : "Copy failed";
      setTimeout(() => (copyLinkBtn.textContent = "Copy"), 1200);
    });
  }

  if (chatBtn) {
    chatBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const code = textFrom(codeEl);
      const ok = openMessenger(code);
      if (!ok) {
        chatBtn.textContent = "Set Messenger URL";
        setTimeout(() => (chatBtn.textContent = "Chat on Messenger"), 1400);
      }
    });
  }
})();
