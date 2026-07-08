const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const multer = require("multer");

const { config } = require("./config");
const {
  listSubmissions,
  createSubmission,
  patchSubmission,
  updateSubmissionStatus,
  deleteSubmission,
  getSubmissionCounts,
  ensureStorage_
} = require("./lib/submission-store");
const { normalizePayload, validatePayload } = require("./lib/validation");
const {
  fetchShopifyStatus,
  verifyProxySignature,
  listSavedBuildsForCustomer,
  getSavedBuildByHandle,
  summarizeSavedBuildRecord_,
  createSavedBuildMetaobject,
  updateSavedBuildMetaobject,
  deleteSavedBuildMetaobject,
  resolveBrandForSubmission,
  syncSubmissionFilesToShopify,
  createUsedListingMetaobject,
  updateUsedListingMetaobject,
  deleteUsedListingMetaobject,
  deleteShopifyFiles,
  summarizeShopifyError
} = require("./lib/shopify-admin");

ensureStorage_();

const app = express();

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function summarizeText_(value, maxLength = 220) {
  const stripped = String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (stripped.length <= maxLength) return stripped;
  return `${stripped.slice(0, maxLength - 3)}...`;
}

function normalizeFilterToken_(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function buildAdminSearchText_(parts) {
  return normalizeFilterToken_(parts.filter(Boolean).join(" "));
}

const uploadStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, config.uploadsDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname || "");
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  }
});

const upload = multer({
  storage: uploadStorage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 8
  }
});

const submissionUpload = upload.fields([
  { name: "photos", maxCount: 6 },
  { name: "proof_of_purchase_file", maxCount: 1 }
]);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use("/uploads", express.static(config.uploadsDir));
app.use((req, res, next) => {
  const origin = String(req.headers.origin || "").trim();
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,Accept");
  }

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
});

function basicAuth(req, res, next) {
  const header = String(req.headers.authorization || "");
  if (!header.startsWith("Basic ")) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Upgrade Assist Admin"');
    return res.status(401).send("Authentication required.");
  }

  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  const separatorIndex = decoded.indexOf(":");
  const username = separatorIndex >= 0 ? decoded.slice(0, separatorIndex) : decoded;
  const password = separatorIndex >= 0 ? decoded.slice(separatorIndex + 1) : "";

  if (username !== config.adminUsername || password !== config.adminPassword) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Upgrade Assist Admin"');
    return res.status(401).send("Invalid credentials.");
  }

  next();
}

function mapFilesByField(req) {
  if (!req.files) return {};
  if (Array.isArray(req.files)) return {};
  return req.files;
}

function deleteUploadedFiles_(req) {
  const allFiles = [];
  if (Array.isArray(req.files)) {
    allFiles.push(...req.files);
  } else if (req.files && typeof req.files === "object") {
    Object.keys(req.files).forEach((key) => {
      const value = req.files[key];
      if (Array.isArray(value)) allFiles.push(...value);
    });
  }

  allFiles.forEach((file) => {
    try {
      fs.unlinkSync(file.path);
    } catch (error) {}
  });
}

function buildSyncSummary_(item) {
  const status = String(item && item.shopifySyncStatus ? item.shopifySyncStatus : "pending").trim() || "pending";
  const error = summarizeText_(item && item.shopifySyncError ? item.shopifySyncError : "", 180);
  const metaobjectHandle = String(item && item.shopifyMetaobjectHandle ? item.shopifyMetaobjectHandle : "").trim();
  const lastSyncedAt = String(item && item.shopifyLastSyncedAt ? item.shopifyLastSyncedAt : "").trim();

  if (status === "synced") {
    return {
      label: "Synced",
      detail: metaobjectHandle ? `Handle: ${metaobjectHandle}` : "Stored in Shopify."
    };
  }

  if (status === "error") {
    return {
      label: "Sync error",
      detail: error || "Shopify sync failed."
    };
  }

  if (status === "pending") {
    return {
      label: "Pending sync",
      detail: lastSyncedAt ? `Last attempt: ${lastSyncedAt}` : "Waiting for the first Shopify sync attempt."
    };
  }

  return {
    label: status,
    detail: error || "-"
  };
}

function collectSubmissionShopifyFileIds_(submission) {
  const ids = new Set();

  if (Array.isArray(submission && submission.photos)) {
    submission.photos.forEach((photo) => {
      const fileId = String(photo && photo.shopifyFileId ? photo.shopifyFileId : "").trim();
      if (fileId) ids.add(fileId);
    });
  }

  const proofFileId = String(
    submission && submission.proofOfPurchaseFile && submission.proofOfPurchaseFile.shopifyFileId
      ? submission.proofOfPurchaseFile.shopifyFileId
      : ""
  ).trim();

  if (proofFileId) {
    ids.add(proofFileId);
  }

  return Array.from(ids);
}

function normalizeSavedBuildName_(value) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "My Build";
  return normalized.slice(0, 80);
}

function normalizeSavedBuildPayload_(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const keys = Object.keys(value);
  if (!keys.length) {
    return null;
  }

  return value;
}

function normalizeSavedBuildSnapshot_(value, quoteCode = "") {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const rawItems = Array.isArray(value.items) ? value.items : [];
  const items = rawItems
    .slice(0, 80)
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const qtyRaw = Number(item.qty || 1);
      const qty = Number.isFinite(qtyRaw) && qtyRaw > 0 ? Math.min(qtyRaw, 99) : 1;
      const normalized = {
        key: String(item.key || "").trim().slice(0, 80),
        label: String(item.label || item.componentLabel || "").trim().slice(0, 80),
        title: String(item.title || "").replace(/\s+/g, " ").trim().slice(0, 240),
        variantTitle: String(item.variantTitle || item.variant_title || "").replace(/\s+/g, " ").trim().slice(0, 160),
        image: String(item.image || "").trim().slice(0, 800),
        quick_description: String(item.quick_description || item.quickDescription || "").trim().slice(0, 1200),
        vendor: String(item.vendor || "").replace(/\s+/g, " ").trim().slice(0, 160),
        qty,
        priceBase: Number(item.priceBase ?? item.price_base ?? 0) || 0,
        priceEffective: Number(item.priceEffective ?? item.price_effective ?? 0) || 0,
        productId: String(item.productId || item.product_id || "").trim().slice(0, 120),
        variantId: String(item.variantId || item.variant_id || "").trim().slice(0, 120),
        handle: String(item.handle || item.productHandle || "").trim().slice(0, 180),
        productUrl: String(item.productUrl || item.product_url || item.url || "").trim().slice(0, 800)
      };

      return normalized.title || normalized.label || normalized.image ? normalized : null;
    })
    .filter(Boolean);

  const totals = value.totals && typeof value.totals === "object" && !Array.isArray(value.totals) ? value.totals : {};
  const meta = value.meta && typeof value.meta === "object" && !Array.isArray(value.meta) ? value.meta : {};
  const selected = value.selected && typeof value.selected === "object" && !Array.isArray(value.selected) ? value.selected : {};
  const normalized = {
    version: 1,
    selected,
    meta: {
      subtotalDisplay: String(meta.subtotalDisplay || "").trim().slice(0, 80),
      quoteCode: String(meta.quoteCode || quoteCode || "").trim().slice(0, 64),
      generatedAt: String(meta.generatedAt || new Date().toISOString()).trim().slice(0, 40),
      promoHandle: String(meta.promoHandle || meta.promo_handle || "").trim().slice(0, 120),
      promoLabel: String(meta.promoLabel || meta.promo_label || "").trim().slice(0, 180),
      promoBadgeLabel: String(meta.promoBadgeLabel || meta.promo_badge_label || "").trim().slice(0, 120),
      promoValid: !!(meta.promoValid || meta.promo_valid),
      addonRuleHandles: Array.isArray(meta.addonRuleHandles)
        ? meta.addonRuleHandles.map((value) => String(value || "").trim().slice(0, 120)).filter(Boolean).slice(0, 24)
        : [],
      addonRuleLabels: Array.isArray(meta.addonRuleLabels)
        ? meta.addonRuleLabels.map((value) => String(value || "").trim().slice(0, 180)).filter(Boolean).slice(0, 24)
        : []
    },
    items,
    totals: {
      subtotalBase: Number(totals.subtotalBase ?? totals.subtotal ?? 0) || 0,
      rawBundleDiscount: Number(totals.rawBundleDiscount ?? totals.raw_bundle_discount ?? 0) || 0,
      savings: Number(totals.savings ?? 0) || 0,
      promoDiscount: Number(totals.promoDiscount ?? totals.promo_discount ?? 0) || 0,
      promoValid: !!(totals.promoValid || totals.promo_valid),
      promoStackWithBundleDiscount: !!(totals.promoStackWithBundleDiscount ?? totals.promo_stack_with_bundle_discount),
      promoSuppressedByAddon: !!(totals.promoSuppressedByAddon ?? totals.promo_suppressed_by_addon),
      addonDiscountTotal: Number(totals.addonDiscountTotal ?? totals.addon_discount_total ?? 0) || 0,
      addonDiscountCount: Number(totals.addonDiscountCount ?? totals.addon_discount_count ?? 0) || 0,
      addonDiscountRows: Array.isArray(totals.addonDiscountRows ?? totals.addon_discount_rows)
        ? (totals.addonDiscountRows ?? totals.addon_discount_rows)
            .map((row) => {
              if (!row || typeof row !== "object" || Array.isArray(row)) return null;
              return {
                handle: String(row.handle || "").trim().slice(0, 120),
                ruleLabel: String(row.ruleLabel || row.rule_label || "").trim().slice(0, 180),
                label: String(row.label || "").trim().slice(0, 220),
                discountAmount: Number(row.discountAmount ?? row.discount_amount ?? 0) || 0,
                tab: String(row.tab || "").trim().slice(0, 80),
                productId: String(row.productId || row.product_id || "").trim().slice(0, 120),
                variantId: String(row.variantId || row.variant_id || "").trim().slice(0, 120),
                targetLabel: String(row.targetLabel || row.target_label || "").trim().slice(0, 220)
              };
            })
            .filter((row) => row && row.label && row.discountAmount > 0)
            .slice(0, 32)
        : [],
      addonSuppressesBundleDiscount: !!(
        totals.addonSuppressesBundleDiscount ?? totals.addon_suppresses_bundle_discount
      ),
      addonSuppressesPrimaryPromo: !!(
        totals.addonSuppressesPrimaryPromo ?? totals.addon_suppresses_primary_promo
      ),
      manualOff: Number(totals.manualOff ?? 0) || 0,
      payableSubtotal: Number(totals.payableSubtotal ?? totals.total ?? 0) || 0,
      total: Number(totals.total ?? totals.payableSubtotal ?? 0) || 0
    }
  };

  try {
    return JSON.stringify(normalized).length <= 120000 ? normalized : null;
  } catch (error) {
    return null;
  }
}

function buildCustomerNameSnapshot_(body) {
  const direct = String(body && body.customer_name_snapshot ? body.customer_name_snapshot : "")
    .replace(/\s+/g, " ")
    .trim();
  if (direct) return direct.slice(0, 120);

  const firstName = String(body && body.customer_first_name ? body.customer_first_name : "")
    .replace(/\s+/g, " ")
    .trim();
  const lastName = String(body && body.customer_last_name ? body.customer_last_name : "")
    .replace(/\s+/g, " ")
    .trim();
  const joined = `${firstName} ${lastName}`.replace(/\s+/g, " ").trim();
  return joined.slice(0, 120);
}

function buildSubmissionFileHref_(file) {
  const shopifyFileUrl = String(file && file.shopifyFileUrl ? file.shopifyFileUrl : "").trim();
  if (shopifyFileUrl) return shopifyFileUrl;

  const localFilename = String(file && file.filename ? file.filename : "").trim();
  if (!localFilename) return "";

  return `/uploads/${encodeURIComponent(localFilename)}`;
}

function buildSubmissionFileOriginLabel_(file) {
  return String(file && file.shopifyFileUrl ? "Shopify" : "Local").trim();
}

async function syncSubmissionToShopify_(submission) {
  if (!submission || !submission.id) {
    return {
      ok: false,
      error: "Submission not found for Shopify sync."
    };
  }

  try {
    let submissionForRemote = submission;
    const brandResolution = await resolveBrandForSubmission(submissionForRemote);

    if (brandResolution && brandResolution.patch) {
      submissionForRemote = patchSubmission(submission.id, brandResolution.patch) || submissionForRemote;
    }

    const fileSync = await syncSubmissionFilesToShopify(submissionForRemote);

    if (fileSync && fileSync.hasPatch) {
      submissionForRemote = patchSubmission(submission.id, fileSync.patch) || submissionForRemote;
    }

    const remoteMetaobject = submissionForRemote.shopifyMetaobjectId
      ? await updateUsedListingMetaobject(submissionForRemote.shopifyMetaobjectId, submissionForRemote)
      : await createUsedListingMetaobject(submissionForRemote);

    const patched = patchSubmission(submission.id, {
      shopifyMetaobjectId: remoteMetaobject && remoteMetaobject.id ? String(remoteMetaobject.id) : "",
      shopifyMetaobjectHandle: remoteMetaobject && remoteMetaobject.handle ? String(remoteMetaobject.handle) : "",
      shopifySyncStatus: "synced",
      shopifySyncError: "",
      shopifyLastSyncedAt: new Date().toISOString()
    });

    return {
      ok: true,
      submission: patched || submission
    };
  } catch (error) {
    const summary = summarizeShopifyError(error);
    const patched = patchSubmission(submission.id, {
      shopifySyncStatus: "error",
      shopifySyncError: summary
    });

    return {
      ok: false,
      submission: patched || submission,
      error: summary
    };
  }
}

async function deleteSubmissionFromShopify_(submission) {
  try {
    const fileIds = collectSubmissionShopifyFileIds_(submission);

    if (submission && submission.shopifyMetaobjectId) {
      await deleteUsedListingMetaobject(submission.shopifyMetaobjectId);
    }

    if (fileIds.length) {
      await deleteShopifyFiles(fileIds);
    }

    if (!submission || (!submission.shopifyMetaobjectId && !fileIds.length)) {
      return { ok: true, skipped: true };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: summarizeShopifyError(error)
    };
  }
}

async function createSubmissionFromRequest(req, res, { proxyMode = false } = {}) {
  if (proxyMode && !verifyProxySignature(req.query || {})) {
    deleteUploadedFiles_(req);
    return res.status(401).json({
      ok: false,
      error: "invalid_proxy_signature"
    });
  }

  const body = { ...(req.body || {}) };
  if (!body.seller_customer_id && req.query && req.query.logged_in_customer_id) {
    body.seller_customer_id = req.query.logged_in_customer_id;
  }
  if (!body.customer_email && req.query && req.query.email) {
    body.customer_email = req.query.email;
  }

  const normalized = normalizePayload(body, mapFilesByField(req));
  const validation = validatePayload(normalized);

  if (!validation.isValid) {
    deleteUploadedFiles_(req);
    return res.status(422).json({
      ok: false,
      errors: validation.errors
    });
  }

  const submission = createSubmission({
    sellerCustomerId: normalized.sellerCustomerId,
    sourceType: normalized.sourceType,
    referencedProduct: normalized.referencedProduct,
    referencedProductTitle: normalized.referencedProductTitle,
    referencedProductUrl: normalized.referencedProductUrl,
    manualTitle: normalized.manualTitle,
    manualModel: normalized.manualModel,
    externalProductUrl: normalized.externalProductUrl,
    brandReference: normalized.brandReference,
    brandNameFallback: normalized.brandNameFallback,
    askingPrice: normalized.askingPrice,
    conditionGrade: normalized.conditionGrade,
    cityRegion: normalized.cityRegion,
    usageNotes: normalized.usageNotes,
    issueDisclosures: normalized.issueDisclosures,
    photos: normalized.photos,
    proofOfPurchaseStatus: normalized.proofOfPurchaseStatus,
    proofOfPurchaseFile: normalized.proofOfPurchaseFile,
    personalWarrantyOffered: normalized.personalWarrantyOffered,
    personalWarrantyDuration: normalized.personalWarrantyDuration,
    stillInWarranty: normalized.stillInWarranty,
    contactPreference: normalized.contactPreference,
    contactValue: normalized.contactValue,
    sellerAgreementAccepted: normalized.sellerAgreementAccepted,
    integrationState: proxyMode ? "shopify_app_proxy_local" : normalized.integrationState,
    rawCustomerEmail: normalized.rawCustomerEmail,
    rawCustomerFirstName: normalized.rawCustomerFirstName,
    rawCustomerLastName: normalized.rawCustomerLastName,
    rawCustomerPhone: normalized.rawCustomerPhone,
    proxyRequestMeta: proxyMode
      ? {
          shop: String(req.query.shop || "").trim(),
          pathPrefix: String(req.query.path_prefix || "").trim(),
          loggedInCustomerId: String(req.query.logged_in_customer_id || "").trim()
        }
      : null
  });

  const syncResult = await syncSubmissionToShopify_(submission);
  const latestSubmission = syncResult.submission || submission;

  return res.status(201).json({
    ok: true,
    submission: {
      id: latestSubmission.id,
      status: latestSubmission.status,
      createdAt: latestSubmission.createdAt,
      shopifySyncStatus: latestSubmission.shopifySyncStatus || "pending",
      shopifyMetaobjectId: latestSubmission.shopifyMetaobjectId || "",
      shopifyMetaobjectHandle: latestSubmission.shopifyMetaobjectHandle || "",
      shopifySyncError: latestSubmission.shopifySyncError || ""
    },
    shopifySync: {
      ok: !!syncResult.ok,
      error: syncResult.ok ? "" : syncResult.error || ""
    }
  });
}

async function createSavedBuildFromRequest(req, res) {
  if (!verifyProxySignature(req.query || {})) {
    return res.status(401).json({
      ok: false,
      error: "invalid_proxy_signature"
    });
  }

  const customerId = String(req.query.logged_in_customer_id || "").trim();
  if (!customerId) {
    return res.status(401).json({
      ok: false,
      error: "not_logged_in"
    });
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const buildPayload = normalizeSavedBuildPayload_(body.build_payload);
  if (!buildPayload) {
    return res.status(422).json({
      ok: false,
      error: "invalid_build_payload"
    });
  }

  const buildName = normalizeSavedBuildName_(body.build_name);
  const createdAt = new Date().toISOString();
  const customerEmailSnapshot = String(body.customer_email_snapshot || "").trim().slice(0, 160);
  const customerNameSnapshot = buildCustomerNameSnapshot_(body);
  const quoteCode = String(body.quote_code || "").trim().slice(0, 64);
  const quoteVersion = String(body.quote_version || "").trim().slice(0, 32);
  const buildSnapshot = normalizeSavedBuildSnapshot_(body.build_snapshot, quoteCode);

  try {
    const savedBuild = await createSavedBuildMetaobject({
      id: crypto.randomUUID(),
      buildName,
      ownerCustomerId: customerId,
      ownerCustomerEmailSnapshot: customerEmailSnapshot,
      ownerCustomerNameSnapshot: customerNameSnapshot,
      buildPayload,
      buildSnapshot,
      quoteCode,
      quoteVersion,
      status: "active",
      visibility: "private",
      createdAt,
      updatedAt: createdAt
    });

    return res.json({
      ok: true,
      savedBuildId: String(savedBuild.id || "").trim(),
      savedBuildHandle: String(savedBuild.handle || "").trim(),
      buildName,
      createdAt
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: summarizeShopifyError(error)
    });
  }
}

function buildSavedBuildActionResponse_(savedBuild, extra = {}) {
  return {
    ok: true,
    build: summarizeSavedBuildRecord_(savedBuild),
    ...extra
  };
}

async function requireOwnedSavedBuild_(req, res) {
  if (!verifyProxySignature(req.query || {})) {
    res.status(401).json({
      ok: false,
      error: "invalid_proxy_signature"
    });
    return null;
  }

  const customerId = String(req.query.logged_in_customer_id || "").trim();
  if (!customerId) {
    res.status(401).json({
      ok: false,
      error: "not_logged_in"
    });
    return null;
  }

  const handle = String(req.params.handle || "").trim();
  if (!handle) {
    res.status(400).json({
      ok: false,
      error: "invalid_handle"
    });
    return null;
  }

  try {
    const savedBuild = await getSavedBuildByHandle(handle);
    if (!savedBuild) {
      res.status(404).json({
        ok: false,
        error: "not_found"
      });
      return null;
    }

    if (savedBuild.ownerCustomerId !== customerId) {
      res.status(403).json({
        ok: false,
        error: "forbidden"
      });
      return null;
    }

    return {
      customerId,
      handle,
      savedBuild
    };
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: summarizeShopifyError(error)
    });
    return null;
  }
}

function groupByStatus_(submissions) {
  return {
    pending_review: submissions.filter((item) => item.status === "pending_review"),
    approved: submissions.filter((item) => item.status === "approved"),
    rejected: submissions.filter((item) => item.status === "rejected"),
    archived: submissions.filter((item) => item.status === "archived")
  };
}

function buildShopifyStatusView_(shopifyStatus) {
  if (shopifyStatus && shopifyStatus.ok) {
    return {
      summary: `Connected to ${shopifyStatus.shopName || config.shopifyStoreDomain}`,
      debug: ""
    };
  }

  const rawReason = String((shopifyStatus && shopifyStatus.reason) || "").trim();
  if (!rawReason) {
    return {
      summary: "Not configured yet.",
      debug: ""
    };
  }

  return {
    summary: summarizeShopifyError(rawReason),
    debug: rawReason
  };
}

function renderSubmissionCard_(item) {
  const title = item.manualTitle || item.referencedProductTitle || "Untitled submission";
  const bodyId = `ua-card-body-${String(item.id || "").replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const syncView = buildSyncSummary_(item);
  const displayBrand =
    item.resolvedBrandName || item.resolvedBrandHandle || item.brandNameFallback || item.brandReference || "-";
  const contactDetail =
    item.contactPreference === "email"
      ? item.rawCustomerEmail || "-"
      : item.contactValue || "-";
  const dataSearch = buildAdminSearchText_([
    title,
    item.id,
    item.sellerCustomerId,
    item.sourceType,
    displayBrand,
    item.cityRegion,
    item.conditionGrade,
    item.contactPreference,
    item.rawCustomerEmail,
    item.rawCustomerFirstName,
    item.rawCustomerLastName,
    item.rawCustomerPhone,
    item.contactValue,
    item.shopifyMetaobjectHandle
  ]);
  const photosHtml = Array.isArray(item.photos) && item.photos.length
    ? item.photos
        .map(
          (photo) => {
            const href = buildSubmissionFileHref_(photo);
            const originLabel = buildSubmissionFileOriginLabel_(photo);
            return href
              ? `<li><a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${escapeHtml(
              photo.originalName
            )}</a> <span class="ua-muted">(${escapeHtml(originLabel)})</span></li>`
              : `<li>${escapeHtml(photo.originalName || "Unnamed photo")}</li>`;
          }
        )
        .join("")
    : "<li>No photos uploaded.</li>";

  const proofHtml =
    item.proofOfPurchaseFile && buildSubmissionFileHref_(item.proofOfPurchaseFile)
      ? `<a href="${escapeHtml(buildSubmissionFileHref_(item.proofOfPurchaseFile))}" target="_blank" rel="noreferrer">${escapeHtml(
          item.proofOfPurchaseFile.originalName
        )}</a> <span class="ua-muted">(${escapeHtml(buildSubmissionFileOriginLabel_(item.proofOfPurchaseFile))})</span>`
      : "No proof file uploaded.";

  return `
    <article
      class="ua-card"
      data-submission-card
      data-submission-id="${escapeHtml(item.id)}"
      data-submission-status="${escapeHtml(normalizeFilterToken_(item.status))}"
      data-submission-source="${escapeHtml(normalizeFilterToken_(item.sourceType))}"
      data-submission-sync="${escapeHtml(normalizeFilterToken_(item.shopifySyncStatus || "pending"))}"
      data-submission-search="${escapeHtml(dataSearch)}"
    >
      <div class="ua-card__head">
        <div class="ua-card__headPrimary">
          <h3>${escapeHtml(title)}</h3>
          <p class="ua-muted">ID: ${escapeHtml(item.id)} • ${escapeHtml(item.createdAt)}</p>
        </div>
        <div class="ua-card__headActions">
          <span class="ua-status ua-status--${escapeHtml(item.status)}">${escapeHtml(item.status)}</span>
          <button type="button" class="ua-cardToggle" data-card-toggle aria-expanded="true" aria-controls="${escapeHtml(bodyId)}">Minimize</button>
        </div>
      </div>

      <div class="ua-card__body" id="${escapeHtml(bodyId)}" data-card-body>
        <dl class="ua-grid">
          <div><dt>Source type</dt><dd>${escapeHtml(item.sourceType)}</dd></div>
          <div><dt>Customer ID</dt><dd>${escapeHtml(item.sellerCustomerId)}</dd></div>
          <div><dt>Customer name</dt><dd>${escapeHtml([item.rawCustomerFirstName, item.rawCustomerLastName].filter(Boolean).join(" ") || "-")}</dd></div>
          <div><dt>Customer phone</dt><dd>${escapeHtml(item.rawCustomerPhone || "-")}</dd></div>
          <div><dt>Brand</dt><dd>${escapeHtml(displayBrand)}</dd></div>
          <div><dt>Asking price</dt><dd>${escapeHtml(item.askingPrice || "-")}</dd></div>
          <div><dt>Condition</dt><dd>${escapeHtml(item.conditionGrade || "-")}</dd></div>
          <div><dt>Location</dt><dd>${escapeHtml(item.cityRegion || "-")}</dd></div>
          <div><dt>Still in warranty</dt><dd>${escapeHtml(item.stillInWarranty || "-")}</dd></div>
          <div><dt>Personal warranty</dt><dd>${escapeHtml(item.personalWarrantyOffered || "-")}${item.personalWarrantyDuration ? ` (${escapeHtml(item.personalWarrantyDuration)})` : ""}</dd></div>
          <div><dt>Contact preference</dt><dd>${escapeHtml(item.contactPreference || "-")}</dd></div>
          <div><dt>Contact detail</dt><dd>${escapeHtml(contactDetail)}</dd></div>
          <div><dt>Proof status</dt><dd>${escapeHtml(item.proofOfPurchaseStatus || "-")}</dd></div>
          <div><dt>Shopify sync</dt><dd>${escapeHtml(syncView.label)}</dd></div>
          <div><dt>Shopify handle</dt><dd>${escapeHtml(item.shopifyMetaobjectHandle || "-")}</dd></div>
        </dl>

        <div class="ua-block">
          <strong>Shopify sync detail</strong>
          <p>${escapeHtml(syncView.detail)}</p>
          ${
            item.shopifyMetaobjectId
              ? `<p class="ua-muted">Metaobject ID: <code>${escapeHtml(item.shopifyMetaobjectId)}</code></p>`
              : ""
          }
        </div>

        <div class="ua-block">
          <strong>Usage notes</strong>
          <p>${escapeHtml(item.usageNotes || "-")}</p>
        </div>

        <div class="ua-block">
          <strong>Issue disclosures</strong>
          <p>${escapeHtml(item.issueDisclosures || "-")}</p>
        </div>

        <div class="ua-block">
          <strong>Photos</strong>
          <ul>${photosHtml}</ul>
        </div>

        <div class="ua-block">
          <strong>Proof of purchase</strong>
          <p>${proofHtml}</p>
        </div>

        <div class="ua-reviewRow">
          <form class="ua-reviewForm" method="post" action="/admin/submissions/${encodeURIComponent(item.id)}/status">
            <label>
              <span>Review notes</span>
              <textarea name="review_notes" rows="3" placeholder="Optional internal note">${escapeHtml(item.reviewNotes || "")}</textarea>
            </label>
            <div class="ua-reviewActions">
              <button type="submit" name="status" value="approved">Approve</button>
              <button type="submit" name="status" value="rejected">Reject</button>
              <button type="submit" name="status" value="pending_review">Set pending</button>
              <button type="submit" name="status" value="archived">Archive</button>
            </div>
          </form>

          <form class="ua-resyncForm" method="post" action="/admin/submissions/${encodeURIComponent(item.id)}/resync">
            <button type="submit" class="ua-resyncButton">Re-sync Shopify</button>
          </form>

          <form class="ua-deleteForm" method="post" action="/admin/submissions/${encodeURIComponent(item.id)}/delete" data-delete-form>
            <button type="submit" class="ua-deleteButton">Delete</button>
          </form>
        </div>
      </div>
    </article>
  `;
}

function renderCardsOrEmpty_(items, emptyText) {
  return items.length ? items.map(renderSubmissionCard_).join("") : `<div class="ua-card"><p class="ua-muted">${escapeHtml(emptyText)}</p></div>`;
}

function renderAdminPage_(submissions, shopifyStatus, flashMessage) {
  const grouped = groupByStatus_(submissions);
  const counts = getSubmissionCounts();
  const shopifyStatusView = buildShopifyStatusView_(shopifyStatus);
  const appProxyPublicUrl =
    config.shopifyStoreDomain && config.appProxyPrefix && config.appProxySubpath
      ? `https://${config.shopifyStoreDomain}/${config.appProxyPrefix}/${config.appProxySubpath}/submit`
      : "";

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Upgrade Assist Admin</title>
      <style>
        body { margin: 0; font: 14px/1.5 Inter, Segoe UI, Arial, sans-serif; background: #f5f6f8; color: #111; }
        .ua-shell { max-width: 1180px; margin: 0 auto; padding: 24px; }
        .ua-hero, .ua-panel, .ua-card { background: #fff; border: 1px solid rgba(0,0,0,.08); border-radius: 18px; box-shadow: 0 10px 30px rgba(0,0,0,.04); }
        .ua-hero, .ua-panel { padding: 18px 20px; margin-bottom: 18px; }
        .ua-panel { display: grid; gap: 14px; }
        .ua-filterBar { display: grid; gap: 12px; }
        .ua-filterGrid { display: grid; grid-template-columns: minmax(220px, 2fr) repeat(3, minmax(160px, 1fr)) auto; gap: 12px; }
        .ua-filterField { display: grid; gap: 6px; }
        .ua-filterField label { font-size: 12px; font-weight: 700; color: rgba(0,0,0,.62); text-transform: uppercase; letter-spacing: .04em; }
        .ua-filterField input, .ua-filterField select { width: 100%; min-height: 42px; border: 1px solid rgba(0,0,0,.14); border-radius: 12px; padding: 0 12px; background: #fff; color: #111; font: inherit; }
        .ua-filterReset { align-self: end; min-height: 42px; border: 1px solid rgba(0,0,0,.14); border-radius: 12px; padding: 0 14px; background: #fff; color: #111; cursor: pointer; font: 600 13px/1 Inter, Segoe UI, Arial, sans-serif; }
        .ua-filterSummary { margin: 0; color: rgba(0,0,0,.62); }
        .ua-grid3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; }
        .ua-kpi { padding: 14px; border-radius: 14px; background: #f8f8fa; }
        .ua-kpi strong { display: block; font-size: 24px; }
        .ua-muted { color: rgba(0,0,0,.62); }
        .ua-flash { padding: 12px 14px; border-radius: 12px; background: #ecfdf3; border: 1px solid rgba(18, 183, 106, .24); color: #067647; margin-bottom: 16px; }
        .ua-columns { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; align-items: start; }
        .ua-column h2 { margin: 0 0 10px; font-size: 18px; }
        .ua-card { padding: 16px; margin-bottom: 14px; }
        .ua-card__head { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; margin-bottom: 14px; }
        .ua-card__headPrimary { min-width: 0; }
        .ua-card__headActions { display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
        .ua-card h3 { margin: 0 0 4px; font-size: 16px; }
        .ua-card__body[hidden] { display: none !important; }
        .ua-cardToggle { border: 1px solid rgba(0,0,0,.12); border-radius: 999px; padding: 6px 10px; background: #fff; color: #111; cursor: pointer; font: 600 12px/1 Inter, Segoe UI, Arial, sans-serif; }
        .ua-status { display: inline-flex; padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: capitalize; }
        .ua-status--pending_review { background: #fff6df; color: #7a5a00; }
        .ua-status--approved { background: #ecfdf3; color: #067647; }
        .ua-status--rejected { background: #fef3f2; color: #b42318; }
        .ua-status--archived { background: #eef2f6; color: #344054; }
        .ua-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 14px; margin: 0 0 14px; }
        .ua-grid dt { font-size: 12px; color: rgba(0,0,0,.55); }
        .ua-grid dd { margin: 0; font-weight: 600; }
        .ua-block { margin-bottom: 14px; }
        .ua-block p, .ua-block ul { margin: 6px 0 0; padding-left: 18px; }
        .ua-reviewRow { display: grid; gap: 10px; }
        .ua-reviewForm { display: grid; gap: 10px; }
        .ua-reviewForm textarea { width: 100%; min-height: 84px; border: 1px solid rgba(0,0,0,.14); border-radius: 12px; padding: 10px 12px; font: inherit; resize: vertical; }
        .ua-reviewActions { display: flex; gap: 8px; flex-wrap: wrap; }
        .ua-reviewActions button { border: 0; border-radius: 10px; padding: 10px 14px; background: #111; color: #fff; cursor: pointer; font: 600 13px/1 Inter, Segoe UI, Arial, sans-serif; }
        .ua-reviewActions button[value="rejected"] { background: #b42318; }
        .ua-reviewActions button[value="pending_review"] { background: #475467; }
        .ua-reviewActions button[value="archived"] { background: #667085; }
        .ua-resyncForm { display: flex; justify-content: flex-start; }
        .ua-resyncButton { border: 1px solid rgba(11, 87, 208, .16); border-radius: 10px; padding: 10px 14px; background: #eff6ff; color: #0b57d0; cursor: pointer; font: 600 13px/1 Inter, Segoe UI, Arial, sans-serif; }
        .ua-deleteForm { display: flex; justify-content: flex-end; }
        .ua-deleteButton { border: 1px solid rgba(180, 35, 24, .18); border-radius: 10px; padding: 10px 14px; background: #fff; color: #b42318; cursor: pointer; font: 600 13px/1 Inter, Segoe UI, Arial, sans-serif; }
        .ua-debug { margin-top: 10px; }
        .ua-debug summary { cursor: pointer; color: rgba(0,0,0,.7); }
        .ua-debug pre { margin: 10px 0 0; padding: 12px; border-radius: 12px; background: #111; color: #f5f5f5; overflow: auto; font: 400 12px/1.55 Consolas, Monaco, monospace; white-space: pre-wrap; }
        .ua-archivedWrap { margin-top: 18px; }
        .ua-archivedSection { background: #fff; border: 1px solid rgba(0,0,0,.08); border-radius: 18px; box-shadow: 0 10px 30px rgba(0,0,0,.04); padding: 18px 20px; }
        .ua-archivedSection summary { cursor: pointer; font-weight: 700; }
        .ua-archivedCards { margin-top: 14px; }
        code { font-family: Consolas, Monaco, monospace; }
        a { color: #0b57d0; }
        @media (max-width: 980px) {
          .ua-grid3, .ua-columns, .ua-filterGrid { grid-template-columns: 1fr; }
        }
      </style>
    </head>
    <body>
      <main class="ua-shell">
        <section class="ua-hero">
          <h1>Upgrade Assist Admin</h1>
          <p class="ua-muted">Local-first review panel for pending submissions. This app is ready for a later move to hosted infrastructure without changing the route structure.</p>
        </section>

        ${flashMessage ? `<div class="ua-flash">${escapeHtml(flashMessage)}</div>` : ""}

        <section class="ua-panel">
          <div class="ua-grid3">
            <div class="ua-kpi"><span class="ua-muted">Total submissions</span><strong>${counts.total}</strong></div>
            <div class="ua-kpi"><span class="ua-muted">Pending review</span><strong>${counts.pending_review}</strong></div>
            <div class="ua-kpi"><span class="ua-muted">Approved</span><strong>${counts.approved}</strong></div>
            <div class="ua-kpi"><span class="ua-muted">Rejected</span><strong>${counts.rejected}</strong></div>
            <div class="ua-kpi"><span class="ua-muted">Archived</span><strong>${counts.archived}</strong></div>
          </div>
          <div>
            <strong>Local server</strong>
            <p class="ua-muted">Health route: <code>/health</code></p>
            <p class="ua-muted">Proxy-compatible submit route: <code>${escapeHtml(config.appProxyBasePath)}/submit</code></p>
            ${appProxyPublicUrl ? `<p class="ua-muted">Storefront proxy target once configured: <code>${escapeHtml(appProxyPublicUrl)}</code></p>` : ""}
          </div>
          <div>
            <strong>Shopify status</strong>
            <p class="ua-muted">${escapeHtml(shopifyStatusView.summary)}</p>
            ${shopifyStatusView.debug ? `<details class="ua-debug"><summary>Show debug details</summary><pre>${escapeHtml(shopifyStatusView.debug)}</pre></details>` : ""}
            ${config.publicAppUrl ? `<p class="ua-muted">Configured public app URL: <code>${escapeHtml(config.publicAppUrl)}</code></p>` : `<p class="ua-muted">Public app URL not set yet. Add your tunnel URL to <code>.env</code>.</p>`}
            ${config.redirectUrl ? `<p class="ua-muted">Suggested redirect URL: <code>${escapeHtml(config.redirectUrl)}</code></p>` : ""}
          </div>
        </section>

        <section class="ua-panel ua-filterBar">
          <div class="ua-filterGrid">
            <div class="ua-filterField">
              <label for="ua-admin-filter-search">Search</label>
              <input id="ua-admin-filter-search" type="search" placeholder="Title, ID, brand, customer, handle" data-admin-filter-search>
            </div>
            <div class="ua-filterField">
              <label for="ua-admin-filter-status">Status</label>
              <select id="ua-admin-filter-status" data-admin-filter-status>
                <option value="">All statuses</option>
                <option value="pending_review">Pending review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div class="ua-filterField">
              <label for="ua-admin-filter-source">Source</label>
              <select id="ua-admin-filter-source" data-admin-filter-source>
                <option value="">All sources</option>
                <option value="catalog_reference">Catalog reference</option>
                <option value="manual_entry">Manual entry</option>
              </select>
            </div>
            <div class="ua-filterField">
              <label for="ua-admin-filter-sync">Shopify sync</label>
              <select id="ua-admin-filter-sync" data-admin-filter-sync>
                <option value="">All sync states</option>
                <option value="synced">Synced</option>
                <option value="pending">Pending</option>
                <option value="error">Error</option>
              </select>
            </div>
            <button type="button" class="ua-filterReset" data-admin-filter-reset>Reset filters</button>
          </div>
          <p class="ua-filterSummary" data-admin-filter-summary>Showing ${submissions.length} of ${submissions.length} submissions.</p>
        </section>

        <section class="ua-columns">
          <div class="ua-column">
            <h2>Pending review</h2>
            ${renderCardsOrEmpty_(grouped.pending_review, "No pending submissions yet.")}
          </div>
          <div class="ua-column">
            <h2>Approved</h2>
            ${renderCardsOrEmpty_(grouped.approved, "No approved submissions yet.")}
          </div>
          <div class="ua-column">
            <h2>Rejected</h2>
            ${renderCardsOrEmpty_(grouped.rejected, "No rejected submissions yet.")}
          </div>
        </section>

        <section class="ua-archivedWrap">
          <details class="ua-archivedSection">
            <summary>Archived (${counts.archived})</summary>
            <div class="ua-archivedCards">
              ${renderCardsOrEmpty_(grouped.archived, "No archived submissions.")}
            </div>
          </details>
        </section>
      </main>
      <script>
        (() => {
          const storageKey = "upgrade-assist-admin-collapsed:v1";
          const cards = Array.from(document.querySelectorAll("[data-submission-card]"));
          const filterSearch = document.querySelector("[data-admin-filter-search]");
          const filterStatus = document.querySelector("[data-admin-filter-status]");
          const filterSource = document.querySelector("[data-admin-filter-source]");
          const filterSync = document.querySelector("[data-admin-filter-sync]");
          const filterSummary = document.querySelector("[data-admin-filter-summary]");
          const filterReset = document.querySelector("[data-admin-filter-reset]");
          let collapsedMap = {};

          try {
            const raw = window.localStorage.getItem(storageKey);
            collapsedMap = raw ? JSON.parse(raw) : {};
          } catch (error) {
            collapsedMap = {};
          }

          function saveCollapsedMap_() {
            try {
              window.localStorage.setItem(storageKey, JSON.stringify(collapsedMap));
            } catch (error) {}
          }

          function applyCardState_(card) {
            const id = card.getAttribute("data-submission-id");
            const body = card.querySelector("[data-card-body]");
            const button = card.querySelector("[data-card-toggle]");
            const collapsed = !!collapsedMap[id];

            if (body) body.hidden = collapsed;
            if (button) {
              button.textContent = collapsed ? "Expand" : "Minimize";
              button.setAttribute("aria-expanded", collapsed ? "false" : "true");
            }
            card.classList.toggle("is-collapsed", collapsed);
          }

          document.querySelectorAll("[data-submission-card]").forEach((card) => {
            applyCardState_(card);
          });

          function applyAdminFilters_() {
            const query = (filterSearch && filterSearch.value ? filterSearch.value : "").trim().toLowerCase();
            const status = filterStatus && filterStatus.value ? filterStatus.value.trim().toLowerCase() : "";
            const source = filterSource && filterSource.value ? filterSource.value.trim().toLowerCase() : "";
            const sync = filterSync && filterSync.value ? filterSync.value.trim().toLowerCase() : "";
            let visibleCount = 0;

            cards.forEach((card) => {
              const cardStatus = (card.getAttribute("data-submission-status") || "").toLowerCase();
              const cardSource = (card.getAttribute("data-submission-source") || "").toLowerCase();
              const cardSync = (card.getAttribute("data-submission-sync") || "").toLowerCase();
              const cardSearch = (card.getAttribute("data-submission-search") || "").toLowerCase();

              const matches =
                (!query || cardSearch.includes(query)) &&
                (!status || cardStatus === status) &&
                (!source || cardSource === source) &&
                (!sync || cardSync === sync);

              card.hidden = !matches;
              if (matches) visibleCount += 1;
            });

            if (filterSummary) {
              filterSummary.textContent = "Showing " + visibleCount + " of " + cards.length + " submissions.";
            }
          }

          document.addEventListener("click", (event) => {
            const toggle = event.target.closest("[data-card-toggle]");
            if (!toggle) return;

            const card = toggle.closest("[data-submission-card]");
            if (!card) return;

            const id = card.getAttribute("data-submission-id");
            collapsedMap[id] = !collapsedMap[id];
            saveCollapsedMap_();
            applyCardState_(card);
          });

          document.querySelectorAll("[data-delete-form]").forEach((form) => {
            form.addEventListener("submit", (event) => {
              const confirmed = window.confirm("Delete this listing and its uploaded files permanently?");
              if (!confirmed) {
                event.preventDefault();
              }
            });
          });

          [filterSearch, filterStatus, filterSource, filterSync].forEach((input) => {
            if (!input) return;
            const eventName = input.tagName === "SELECT" ? "change" : "input";
            input.addEventListener(eventName, applyAdminFilters_);
          });

          if (filterReset) {
            filterReset.addEventListener("click", () => {
              if (filterSearch) filterSearch.value = "";
              if (filterStatus) filterStatus.value = "";
              if (filterSource) filterSource.value = "";
              if (filterSync) filterSync.value = "";
              applyAdminFilters_();
            });
          }

          applyAdminFilters_();
        })();
      </script>
    </body>
  </html>`;
}

app.get("/health", async (req, res) => {
  const counts = getSubmissionCounts();
  const shopifyStatus = await fetchShopifyStatus();
  res.json({
    ok: true,
    app: "upgrade-assist-local-app",
    now: new Date().toISOString(),
    counts,
    shopifyStatus,
    publicAppUrl: config.publicAppUrl,
    redirectUrl: config.redirectUrl,
    appProxyBasePath: config.appProxyBasePath
  });
});

app.get("/", (req, res) => {
  res.type("html").send(`<!doctype html>
    <html lang="en">
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Upgrade Assist Local App</title></head>
      <body style="font:14px/1.5 Inter, Segoe UI, Arial, sans-serif; padding:24px;">
        <h1>Upgrade Assist Local App</h1>
        <p>This server is running.</p>
        <ul>
          <li><a href="/health">Health JSON</a></li>
          <li><a href="/admin">Admin review UI</a></li>
        </ul>
      </body>
    </html>`);
});

app.get("/auth/callback", (req, res) => {
  res.type("html").send(`<!doctype html>
    <html lang="en">
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Upgrade Assist Auth Callback</title></head>
      <body style="font:14px/1.5 Inter, Segoe UI, Arial, sans-serif; padding:24px;">
        <h1>Upgrade Assist callback placeholder</h1>
        <p>This route exists so you can register a valid redirect URL in Shopify Dev Dashboard.</p>
      </body>
    </html>`);
});

app.get("/admin", basicAuth, async (req, res) => {
  const submissions = listSubmissions();
  const shopifyStatus = await fetchShopifyStatus();
  const flashMessage = req.query.message ? String(req.query.message) : "";
  res.type("html").send(renderAdminPage_(submissions, shopifyStatus, flashMessage));
});

app.get("/api/submissions", basicAuth, (req, res) => {
  res.json({
    ok: true,
    submissions: listSubmissions()
  });
});

app.post("/api/submissions", submissionUpload, async (req, res) => {
  return createSubmissionFromRequest(req, res, { proxyMode: false });
});

app.get(`${config.appProxyBasePath}`, (req, res) => {
  res.json({
    ok: true,
    route: config.appProxyBasePath,
    message: "Upgrade Assist app proxy base route is live."
  });
});

app.get(`${config.appProxyBasePath}/my-builds/list`, async (req, res) => {
  if (!verifyProxySignature(req.query || {})) {
    return res.status(401).json({
      ok: false,
      error: "invalid_proxy_signature"
    });
  }

  const customerId = String(req.query.logged_in_customer_id || "").trim();
  if (!customerId) {
    return res.json({
      ok: true,
      loggedIn: false,
      builds: []
    });
  }

  try {
    const builds = await listSavedBuildsForCustomer(customerId, { limit: 24 });
    return res.json({
      ok: true,
      loggedIn: true,
      customerId,
      count: builds.length,
      builds
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      loggedIn: true,
      error: summarizeText_(error && error.message ? error.message : "Failed to load saved builds.", 220)
    });
  }
});

app.post(`${config.appProxyBasePath}/my-builds/save`, async (req, res) => {
  return createSavedBuildFromRequest(req, res);
});

app.post(`${config.appProxyBasePath}/my-builds/:handle/rename`, async (req, res) => {
  const owned = await requireOwnedSavedBuild_(req, res);
  if (!owned) return;

  const nextBuildName = normalizeSavedBuildName_(req.body && req.body.build_name);
  const updatedBuild = {
    ...owned.savedBuild,
    buildName: nextBuildName,
    updatedAt: new Date().toISOString()
  };

  try {
    const saved = await updateSavedBuildMetaobject(updatedBuild);
    return res.json(
      buildSavedBuildActionResponse_({
        ...updatedBuild,
        id: String(saved.id || "").trim() || updatedBuild.id,
        handle: String(saved.handle || "").trim() || updatedBuild.handle,
        updatedAt: String(saved.updatedAt || "").trim() || updatedBuild.updatedAt
      })
    );
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: summarizeShopifyError(error)
    });
  }
});

app.post(`${config.appProxyBasePath}/my-builds/:handle/archive`, async (req, res) => {
  const owned = await requireOwnedSavedBuild_(req, res);
  if (!owned) return;

  const updatedBuild = {
    ...owned.savedBuild,
    status: "archived",
    updatedAt: new Date().toISOString()
  };

  try {
    const saved = await updateSavedBuildMetaobject(updatedBuild);
    return res.json(
      buildSavedBuildActionResponse_({
        ...updatedBuild,
        id: String(saved.id || "").trim() || updatedBuild.id,
        handle: String(saved.handle || "").trim() || updatedBuild.handle,
        updatedAt: String(saved.updatedAt || "").trim() || updatedBuild.updatedAt
      })
    );
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: summarizeShopifyError(error)
    });
  }
});

app.post(`${config.appProxyBasePath}/my-builds/:handle/unarchive`, async (req, res) => {
  const owned = await requireOwnedSavedBuild_(req, res);
  if (!owned) return;

  const updatedBuild = {
    ...owned.savedBuild,
    status: "active",
    updatedAt: new Date().toISOString()
  };

  try {
    const saved = await updateSavedBuildMetaobject(updatedBuild);
    return res.json(
      buildSavedBuildActionResponse_({
        ...updatedBuild,
        id: String(saved.id || "").trim() || updatedBuild.id,
        handle: String(saved.handle || "").trim() || updatedBuild.handle,
        updatedAt: String(saved.updatedAt || "").trim() || updatedBuild.updatedAt
      })
    );
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: summarizeShopifyError(error)
    });
  }
});

app.post(`${config.appProxyBasePath}/my-builds/:handle/share`, async (req, res) => {
  const owned = await requireOwnedSavedBuild_(req, res);
  if (!owned) return;

  const updatedBuild = {
    ...owned.savedBuild,
    visibility: owned.savedBuild.visibility === "private" ? "unlisted" : owned.savedBuild.visibility,
    updatedAt: new Date().toISOString()
  };

  try {
    const saved = await updateSavedBuildMetaobject(updatedBuild);
    return res.json(
      buildSavedBuildActionResponse_({
        ...updatedBuild,
        id: String(saved.id || "").trim() || updatedBuild.id,
        handle: String(saved.handle || "").trim() || updatedBuild.handle,
        updatedAt: String(saved.updatedAt || "").trim() || updatedBuild.updatedAt
      })
    );
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: summarizeShopifyError(error)
    });
  }
});

app.post(`${config.appProxyBasePath}/my-builds/:handle/delete`, async (req, res) => {
  const owned = await requireOwnedSavedBuild_(req, res);
  if (!owned) return;

  try {
    const deletedId = await deleteSavedBuildMetaobject(owned.savedBuild.id);
    return res.json({
      ok: true,
      deletedId: String(deletedId || "").trim() || owned.savedBuild.id,
      deletedHandle: owned.savedBuild.handle
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: summarizeShopifyError(error)
    });
  }
});

app.post(`${config.appProxyBasePath}/submit`, submissionUpload, async (req, res) => {
  return createSubmissionFromRequest(req, res, { proxyMode: true });
});

app.post("/admin/submissions/:id/status", basicAuth, async (req, res) => {
  const id = String(req.params.id || "").trim();
  const nextStatus = String(req.body.status || "").trim();
  const reviewNotes = String(req.body.review_notes || "").trim();

  if (!["approved", "rejected", "pending_review", "archived"].includes(nextStatus)) {
    return res.status(400).send("Invalid status.");
  }

  const updated = updateSubmissionStatus(id, nextStatus, reviewNotes);
  if (!updated) {
    return res.status(404).send("Submission not found.");
  }

  const syncResult = await syncSubmissionToShopify_(updated);
  const syncSuffix = syncResult.ok ? " Shopify sync updated." : ` Shopify sync failed: ${syncResult.error}.`;
  const message = encodeURIComponent(`Submission ${updated.id} updated to ${updated.status}.${syncSuffix}`);
  res.redirect(`/admin?message=${message}`);
});

app.post("/admin/submissions/:id/resync", basicAuth, async (req, res) => {
  const id = String(req.params.id || "").trim();
  const existing = listSubmissions().find((item) => item.id === id) || null;
  if (!existing) {
    return res.status(404).send("Submission not found.");
  }

  const syncResult = await syncSubmissionToShopify_(existing);
  const latest = syncResult.submission || existing;
  const message = encodeURIComponent(
    syncResult.ok
      ? `Submission ${latest.id} re-synced to Shopify successfully.`
      : `Submission ${latest.id} re-sync failed: ${syncResult.error}.`
  );
  res.redirect(`/admin?message=${message}`);
});

app.post("/admin/submissions/:id/delete", basicAuth, async (req, res) => {
  const id = String(req.params.id || "").trim();
  const existing = listSubmissions().find((item) => item.id === id) || null;
  if (!existing) {
    return res.status(404).send("Submission not found.");
  }

  const remoteDelete = await deleteSubmissionFromShopify_(existing);
  if (!remoteDelete.ok) {
    const message = encodeURIComponent(
      `Submission ${existing.id} was not deleted locally because Shopify delete failed: ${remoteDelete.error}.`
    );
    return res.redirect(`/admin?message=${message}`);
  }

  const deleted = deleteSubmission(id);
  if (!deleted) {
    return res.status(404).send("Submission not found.");
  }

  const message = encodeURIComponent(
    remoteDelete.skipped
      ? `Submission ${deleted.id} deleted.`
      : `Submission ${deleted.id} deleted locally and from Shopify.`
  );
  res.redirect(`/admin?message=${message}`);
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      ok: false,
      error: error.message
    });
  }

  deleteUploadedFiles_(req);

  const message = error && error.message ? error.message : "Unexpected server error";
  res.status(500).json({
    ok: false,
    error: message
  });
});

app.listen(config.port, () => {
  console.log(`[upgrade-assist] local app listening on http://localhost:${config.port}`);
  if (config.publicAppUrl) {
    console.log(`[upgrade-assist] public app url: ${config.publicAppUrl}`);
  }
});
