const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { config } = require("../config");

let cachedToken = null;
let cachedTokenExpiry = 0;
const brandHandleCache = new Map();
const productBrandCache = new Map();

function asTrimmedString_(value) {
  return String(value || "").trim();
}

function asBooleanString_(value) {
  const normalized = asTrimmedString_(value).toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return "true";
  if (["false", "0", "no", "off"].includes(normalized)) return "false";
  return "";
}

function normalizeHandle_(value) {
  return asTrimmedString_(value)
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isGlobalId_(value) {
  return /^gid:\/\/shopify\/[A-Za-z]+\/\d+$/i.test(asTrimmedString_(value));
}

function normalizeProductReference_(value) {
  const raw = asTrimmedString_(value);
  if (!raw) return "";
  if (isGlobalId_(raw)) return raw;
  if (/^\d+$/.test(raw)) return `gid://shopify/Product/${raw}`;
  return "";
}

function buildListingTitle_(submission) {
  return (
    asTrimmedString_(submission.manualTitle) ||
    asTrimmedString_(submission.referencedProductTitle) ||
    `Upgrade Assist ${String(submission.id || "").slice(0, 8) || "submission"}`
  );
}

function buildListingHandle_(submission) {
  const source = asTrimmedString_(submission.id || crypto.randomUUID())
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return `ua-${source || "submission"}`;
}

function toAbsoluteStoreUrl_(value) {
  const raw = asTrimmedString_(value);
  if (!raw) return "";
  if (/^(https?:|mailto:|sms:|tel:)/i.test(raw)) return raw;
  if (raw.startsWith("/") && config.shopifyStoreDomain) {
    return `https://${config.shopifyStoreDomain}${raw}`;
  }
  return "";
}

function formatStatusValue_(status) {
  const normalized = asTrimmedString_(status).toLowerCase();
  if (normalized === "approved") return JSON.stringify(["Approved"]);
  if (normalized === "rejected") return JSON.stringify(["Rejected"]);
  if (normalized === "archived") return JSON.stringify(["Archived"]);
  return JSON.stringify(["Pending"]);
}

function formatSourceType_(sourceType) {
  const normalized = asTrimmedString_(sourceType).toLowerCase();
  if (normalized === "manual_entry") return "Manual";
  return "Reference";
}

function formatConditionGrade_(conditionGrade) {
  const normalized = asTrimmedString_(conditionGrade).toLowerCase();
  if (normalized === "like_new") return "Like new";
  if (normalized === "excellent") return "Excellent";
  if (normalized === "good") return "Good";
  if (normalized === "fair") return "Fair";
  if (normalized === "for_parts") return "For parts";
  return asTrimmedString_(conditionGrade);
}

function formatContactPreference_(contactPreference) {
  const normalized = asTrimmedString_(contactPreference).toLowerCase();
  if (normalized === "facebook") return "Fb";
  if (normalized === "email") return "Email";
  if (normalized === "phone") return "Phone";
  return asTrimmedString_(contactPreference);
}

function formatProofStatus_(proofStatus) {
  const normalized = asTrimmedString_(proofStatus).toLowerCase();
  if (normalized === "picture") return "Picture";
  if (normalized === "none") return "None";
  return asTrimmedString_(proofStatus);
}

function toIsoDateTime_(value) {
  const source = asTrimmedString_(value);
  const date = source ? new Date(source) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }
  return date.toISOString();
}

function addDaysIso_(isoValue, days) {
  const date = new Date(toIsoDateTime_(isoValue));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function sleep_(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getLocalUploadPath_(fileMeta) {
  const filename = path.basename(asTrimmedString_(fileMeta && fileMeta.filename));
  if (!filename) {
    throw new Error("shopify-local-file-missing:Missing local upload filename.");
  }

  const filePath = path.join(config.uploadsDir, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`shopify-local-file-missing:${filename}`);
  }

  return filePath;
}

function inferStagedUploadResource_(fileMeta) {
  const mimeType = asTrimmedString_(fileMeta && fileMeta.mimetype).toLowerCase();
  return mimeType.startsWith("image/") ? "IMAGE" : "FILE";
}

function inferFileContentType_(fileMeta) {
  const mimeType = asTrimmedString_(fileMeta && fileMeta.mimetype).toLowerCase();
  return mimeType.startsWith("image/") ? "IMAGE" : "FILE";
}

function buildFileAltText_(submission, kind, index = 0) {
  const title = buildListingTitle_(submission);
  if (kind === "proof") {
    return `Proof of purchase for ${title}`;
  }
  if (index > 0) {
    return `${title} photo ${index + 1}`;
  }
  return `${title} photo`;
}

function getPhotoFileIds_(submission) {
  const photos = Array.isArray(submission && submission.photos) ? submission.photos : [];
  return photos
    .map((photo) => asTrimmedString_(photo && photo.shopifyFileId))
    .filter(Boolean);
}

function getProofFileId_(submission) {
  return asTrimmedString_(
    submission && submission.proofOfPurchaseFile && submission.proofOfPurchaseFile.shopifyFileId
      ? submission.proofOfPurchaseFile.shopifyFileId
      : ""
  );
}

function buildMetaobjectCapabilities_(submission) {
  const normalizedStatus = asTrimmedString_(submission && submission.status).toLowerCase();
  return {
    publishable: {
      status: normalizedStatus === "approved" ? "ACTIVE" : "DRAFT"
    }
  };
}

function buildSavedBuildSummary_(node) {
  return summarizeSavedBuildRecord_(parseSavedBuildNode_(node));
}

function normalizeSavedBuildStatus_(value) {
  const normalized = asTrimmedString_(value).toLowerCase();
  return normalized === "archived" ? "archived" : "active";
}

function normalizeSavedBuildVisibility_(value) {
  const normalized = asTrimmedString_(value).toLowerCase();
  return normalized === "unlisted" ? "unlisted" : "private";
}

function parseJsonObject_(value) {
  const raw = asTrimmedString_(value);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    return null;
  }
}

function summarizeSavedBuildSnapshot_(snapshot) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return {
      summaryText: "",
      totalItems: 0
    };
  }

  const items = Array.isArray(snapshot.items) ? snapshot.items : [];
  const labelCounts = new Map();
  let totalItems = 0;

  items.forEach((item) => {
    if (!item || typeof item !== "object") return;
    const qtyRaw = Number(item.qty || 1);
    const qty = Number.isFinite(qtyRaw) && qtyRaw > 0 ? qtyRaw : 1;
    const label = asTrimmedString_(item.label || item.componentLabel || item.key || "Item");
    totalItems += qty;
    labelCounts.set(label, (labelCounts.get(label) || 0) + qty);
  });

  return {
    summaryText: Array.from(labelCounts.entries())
      .map(([label, count]) => (count > 1 ? `${label} x${count}` : label))
      .join(" - "),
    totalItems
  };
}

function parseSavedBuildNode_(node) {
  const buildName = asTrimmedString_(
    (node && node.buildName && node.buildName.value) || (node && node.displayName) || ""
  );
  const ownerCustomerId = asTrimmedString_(node && node.ownerCustomerId && node.ownerCustomerId.value);
  const ownerCustomerEmailSnapshot = asTrimmedString_(
    node && node.ownerCustomerEmailSnapshot && node.ownerCustomerEmailSnapshot.value
  );
  const ownerCustomerNameSnapshot = asTrimmedString_(
    node && node.ownerCustomerNameSnapshot && node.ownerCustomerNameSnapshot.value
  );
  const quoteCode = asTrimmedString_(node && node.quoteCode && node.quoteCode.value);
  const quoteVersion = asTrimmedString_(node && node.quoteVersion && node.quoteVersion.value);
  const status = normalizeSavedBuildStatus_(node && node.statusField && node.statusField.value);
  const visibility = normalizeSavedBuildVisibility_(node && node.visibilityField && node.visibilityField.value);
  const createdAt = asTrimmedString_(
    (node && node.createdAtField && node.createdAtField.value) || (node && node.createdAt) || ""
  );
  const updatedAt = asTrimmedString_(
    (node && node.updatedAtField && node.updatedAtField.value) || (node && node.updatedAt) || ""
  );
  const buildPayload = asTrimmedString_(node && node.buildPayload && node.buildPayload.value);
  const buildSnapshot = asTrimmedString_(node && node.buildSnapshot && node.buildSnapshot.value);
  const parsedBuildPayload = parseJsonObject_(buildPayload);
  const parsedBuildSnapshot = parseJsonObject_(buildSnapshot);

  const payloadSummary = summarizeSavedBuildPayload_(parsedBuildPayload);
  const snapshotSummary = summarizeSavedBuildSnapshot_(parsedBuildSnapshot);
  const encodedBuildPayload = encodeSavedBuildPayload_(parsedBuildPayload);

  return {
    id: asTrimmedString_(node && node.id),
    handle: asTrimmedString_(node && node.handle),
    buildName: buildName || "Saved build",
    ownerCustomerId,
    ownerCustomerEmailSnapshot,
    ownerCustomerNameSnapshot,
    quoteCode,
    quoteVersion,
    status,
    visibility,
    createdAt,
    updatedAt,
    buildPayload: parsedBuildPayload,
    buildSnapshot: parsedBuildSnapshot,
    hasBuildPayload: !!buildPayload,
    hasBuildSnapshot: !!parsedBuildSnapshot,
    summaryText: snapshotSummary.summaryText || payloadSummary.summaryText,
    totalItems: snapshotSummary.totalItems || payloadSummary.totalItems,
    buildPayloadEncoded: encodedBuildPayload
  };
}

function summarizeSavedBuildRecord_(savedBuild) {
  return {
    id: asTrimmedString_(savedBuild && savedBuild.id),
    handle: asTrimmedString_(savedBuild && savedBuild.handle),
    buildName: asTrimmedString_(savedBuild && savedBuild.buildName) || "Saved build",
    ownerCustomerId: asTrimmedString_(savedBuild && savedBuild.ownerCustomerId),
    ownerCustomerEmailSnapshot: asTrimmedString_(savedBuild && savedBuild.ownerCustomerEmailSnapshot),
    ownerCustomerNameSnapshot: asTrimmedString_(savedBuild && savedBuild.ownerCustomerNameSnapshot),
    quoteCode: asTrimmedString_(savedBuild && savedBuild.quoteCode),
    quoteVersion: asTrimmedString_(savedBuild && savedBuild.quoteVersion),
    status: normalizeSavedBuildStatus_(savedBuild && savedBuild.status),
    visibility: normalizeSavedBuildVisibility_(savedBuild && savedBuild.visibility),
    createdAt: asTrimmedString_(savedBuild && savedBuild.createdAt),
    updatedAt: asTrimmedString_(savedBuild && savedBuild.updatedAt),
    hasBuildPayload: !!(savedBuild && savedBuild.buildPayload && typeof savedBuild.buildPayload === "object"),
    hasBuildSnapshot: !!(savedBuild && savedBuild.buildSnapshot && typeof savedBuild.buildSnapshot === "object"),
    summaryText: asTrimmedString_(savedBuild && savedBuild.summaryText),
    totalItems: Number(savedBuild && savedBuild.totalItems) || 0,
    buildPayloadEncoded: asTrimmedString_(savedBuild && savedBuild.buildPayloadEncoded),
    buildSnapshot:
      savedBuild && savedBuild.buildSnapshot && typeof savedBuild.buildSnapshot === "object"
        ? savedBuild.buildSnapshot
        : null
  };
}

function encodeSavedBuildPayload_(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "";
  }

  try {
    return Buffer.from(JSON.stringify(payload), "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  } catch (error) {
    return "";
  }
}

function summarizeSavedBuildPayload_(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      summaryText: "",
      totalItems: 0
    };
  }

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

  const parts = [];
  let totalItems = 0;

  order.forEach(([key, label]) => {
    const value = payload[key];
    if (!value) return;

    if (Array.isArray(value)) {
      const count = value.reduce((sum, entry) => {
        const qty = Number(entry && entry.qty ? entry.qty : 1);
        return sum + (Number.isFinite(qty) && qty > 0 ? qty : 1);
      }, 0);

      if (!count) return;
      totalItems += count;
      parts.push(count > 1 ? `${label} x${count}` : label);
      return;
    }

    totalItems += 1;
    parts.push(label);
  });

  return {
    summaryText: parts.join(" • "),
    totalItems
  };
}

function buildSavedBuildHandle_(savedBuild) {
  const source = asTrimmedString_(savedBuild && savedBuild.id ? savedBuild.id : crypto.randomUUID())
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return `sb-${source || "build"}`;
}

async function querySavedBuildNodes_(queryValue, limit) {
  const payload = await shopifyGraphql(
    `
      query ListSavedBuilds($type: String!, $first: Int!, $query: String) {
        metaobjects(type: $type, first: $first, query: $query) {
          nodes {
            id
            handle
            displayName
            createdAt
            updatedAt
            buildName: field(key: "build_name") {
              value
            }
            ownerCustomerId: field(key: "owner_customer_id") {
              value
            }
            ownerCustomerEmailSnapshot: field(key: "owner_customer_email_snapshot") {
              value
            }
            ownerCustomerNameSnapshot: field(key: "owner_customer_name_snapshot") {
              value
            }
            buildPayload: field(key: "build_payload") {
              value
            }
            buildSnapshot: field(key: "build_snapshot") {
              value
            }
            quoteCode: field(key: "quote_code") {
              value
            }
            quoteVersion: field(key: "quote_version") {
              value
            }
            statusField: field(key: "status") {
              value
            }
            visibilityField: field(key: "visibility") {
              value
            }
            createdAtField: field(key: "created_at") {
              value
            }
            updatedAtField: field(key: "updated_at") {
              value
            }
          }
        }
      }
    `,
    {
      type: config.shopifySavedBuildType,
      first: Math.max(1, Math.min(100, Number(limit) || 24)),
      query: queryValue || null
    }
  );

  return payload && payload.metaobjects && Array.isArray(payload.metaobjects.nodes) ? payload.metaobjects.nodes : [];
}

async function listSavedBuildsForCustomer(customerId, options = {}) {
  const normalizedCustomerId = asTrimmedString_(customerId);
  if (!normalizedCustomerId) {
    return [];
  }

  const limit = Math.max(1, Math.min(100, Number(options.limit) || 24));
  let nodes = [];

  try {
    nodes = await querySavedBuildNodes_(`fields.owner_customer_id:${normalizedCustomerId}`, limit);
  } catch (error) {
  }

  if (!nodes.length) {
    nodes = await querySavedBuildNodes_(null, Math.max(limit * 3, 60));
  }

  return nodes
    .map(buildSavedBuildSummary_)
    .filter((item) => item.ownerCustomerId === normalizedCustomerId)
    .sort((left, right) => {
      const leftTime = new Date(left.updatedAt || left.createdAt || 0).getTime();
      const rightTime = new Date(right.updatedAt || right.createdAt || 0).getTime();
      return rightTime - leftTime;
    })
    .slice(0, limit);
}

async function getSavedBuildByHandle(handle) {
  const normalizedHandle = asTrimmedString_(handle);
  if (!normalizedHandle) {
    return null;
  }

  const payload = await shopifyGraphql(
    `
      query SavedBuildByHandle($handle: MetaobjectHandleInput!) {
        metaobjectByHandle(handle: $handle) {
          id
          handle
          displayName
          createdAt
          updatedAt
          buildName: field(key: "build_name") {
            value
          }
          ownerCustomerId: field(key: "owner_customer_id") {
            value
          }
          ownerCustomerEmailSnapshot: field(key: "owner_customer_email_snapshot") {
            value
          }
          ownerCustomerNameSnapshot: field(key: "owner_customer_name_snapshot") {
            value
          }
          buildPayload: field(key: "build_payload") {
            value
          }
          buildSnapshot: field(key: "build_snapshot") {
            value
          }
          quoteCode: field(key: "quote_code") {
            value
          }
          quoteVersion: field(key: "quote_version") {
            value
          }
          statusField: field(key: "status") {
            value
          }
          visibilityField: field(key: "visibility") {
            value
          }
          createdAtField: field(key: "created_at") {
            value
          }
          updatedAtField: field(key: "updated_at") {
            value
          }
        }
      }
    `,
    {
      handle: {
        type: config.shopifySavedBuildType,
        handle: normalizedHandle
      }
    }
  );

  const node = payload ? payload.metaobjectByHandle : null;
  return node && node.id ? parseSavedBuildNode_(node) : null;
}

async function getBrandMetaobjectByHandle_(handle) {
  const normalizedHandle = normalizeHandle_(handle);
  if (!normalizedHandle) {
    return null;
  }

  if (brandHandleCache.has(normalizedHandle)) {
    return brandHandleCache.get(normalizedHandle);
  }

  const payload = await shopifyGraphql(
    `
      query UpgradeAssistBrandByHandle($handle: MetaobjectHandleInput!) {
        metaobjectByHandle(handle: $handle) {
          id
          handle
          displayName
          fieldBrandHandle: field(key: "brand_handle") {
            value
          }
          fieldName: field(key: "name") {
            value
          }
        }
      }
    `,
    {
      handle: {
        type: "brand",
        handle: normalizedHandle
      }
    }
  );

  const node = payload ? payload.metaobjectByHandle : null;
  const result = node && node.id
    ? {
        id: asTrimmedString_(node.id),
        handle: asTrimmedString_(node.handle || (node.fieldBrandHandle && node.fieldBrandHandle.value) || normalizedHandle),
        name: asTrimmedString_(node.displayName || (node.fieldName && node.fieldName.value) || normalizedHandle)
      }
    : null;

  brandHandleCache.set(normalizedHandle, result);
  return result;
}

async function getProductBrandReference_(productId) {
  const normalizedProductId = normalizeProductReference_(productId);
  if (!normalizedProductId) {
    return null;
  }

  if (productBrandCache.has(normalizedProductId)) {
    return productBrandCache.get(normalizedProductId);
  }

  const payload = await shopifyGraphql(
    `
      query UpgradeAssistProductBrand($id: ID!) {
        node(id: $id) {
          ... on Product {
            id
            vendor
            brandRel: metafield(namespace: "relations", key: "brand") {
              reference {
                ... on Metaobject {
                  id
                  handle
                  displayName
                  fieldBrandHandle: field(key: "brand_handle") {
                    value
                  }
                  fieldName: field(key: "name") {
                    value
                  }
                }
              }
            }
          }
        }
      }
    `,
    {
      id: normalizedProductId
    }
  );

  const product = payload ? payload.node : null;
  const brandNode = product && product.brandRel ? product.brandRel.reference : null;
  let result = null;

  if (brandNode && brandNode.id) {
    result = {
      id: asTrimmedString_(brandNode.id),
      handle: asTrimmedString_(brandNode.handle || (brandNode.fieldBrandHandle && brandNode.fieldBrandHandle.value)),
      name: asTrimmedString_(brandNode.displayName || (brandNode.fieldName && brandNode.fieldName.value))
    };
  } else {
    result = await getBrandMetaobjectByHandle_(product && product.vendor ? product.vendor : "");
  }

  productBrandCache.set(normalizedProductId, result);
  return result;
}

async function resolveBrandForSubmission(submission) {
  const rawBrandReference = asTrimmedString_(submission && submission.brandReference);

  if (isGlobalId_(rawBrandReference)) {
    return {
      metaobjectId: rawBrandReference,
      patch: {
        resolvedBrandMetaobjectId: rawBrandReference
      }
    };
  }

  let resolvedBrand = null;

  if (submission && asTrimmedString_(submission.sourceType).toLowerCase() === "catalog_reference") {
    resolvedBrand = await getProductBrandReference_(submission.referencedProduct);
  }

  if (!resolvedBrand && rawBrandReference) {
    resolvedBrand = await getBrandMetaobjectByHandle_(rawBrandReference);
  }

  if (!resolvedBrand && submission && submission.brandNameFallback) {
    resolvedBrand = await getBrandMetaobjectByHandle_(submission.brandNameFallback);
  }

  const patch = resolvedBrand
    ? {
        resolvedBrandMetaobjectId: resolvedBrand.id,
        resolvedBrandHandle: resolvedBrand.handle || "",
        resolvedBrandName: resolvedBrand.name || ""
      }
    : {
        resolvedBrandMetaobjectId: "",
        resolvedBrandHandle: "",
        resolvedBrandName: ""
      };

  return {
    metaobjectId: resolvedBrand ? resolvedBrand.id : "",
    patch
  };
}

function pushMetaobjectField_(target, key, value) {
  const normalized = value === true ? "true" : value === false ? "false" : asTrimmedString_(value);
  if (!normalized) return;
  target.push({ key, value: normalized });
}

function buildSavedBuildFields_(savedBuild) {
  const fields = [];
  const buildName = asTrimmedString_(savedBuild && savedBuild.buildName ? savedBuild.buildName : "") || "My Build";
  const createdAt = toIsoDateTime_(savedBuild && savedBuild.createdAt ? savedBuild.createdAt : new Date().toISOString());
  const updatedAt = toIsoDateTime_(savedBuild && savedBuild.updatedAt ? savedBuild.updatedAt : createdAt);
  let buildPayloadJson = "";
  let buildSnapshotJson = "";

  try {
    buildPayloadJson = JSON.stringify(
      savedBuild && savedBuild.buildPayload && typeof savedBuild.buildPayload === "object" ? savedBuild.buildPayload : {}
    );
  } catch (error) {
    buildPayloadJson = "";
  }

  try {
    buildSnapshotJson =
      savedBuild && savedBuild.buildSnapshot && typeof savedBuild.buildSnapshot === "object"
        ? JSON.stringify(savedBuild.buildSnapshot)
        : "";
  } catch (error) {
    buildSnapshotJson = "";
  }

  pushMetaobjectField_(fields, "build_name", buildName);
  pushMetaobjectField_(fields, "owner_customer_id", savedBuild && savedBuild.ownerCustomerId);
  pushMetaobjectField_(fields, "owner_customer_email_snapshot", savedBuild && savedBuild.ownerCustomerEmailSnapshot);
  pushMetaobjectField_(fields, "owner_customer_name_snapshot", savedBuild && savedBuild.ownerCustomerNameSnapshot);
  pushMetaobjectField_(fields, "build_payload", buildPayloadJson);
  pushMetaobjectField_(fields, "build_snapshot", buildSnapshotJson);
  pushMetaobjectField_(fields, "quote_code", savedBuild && savedBuild.quoteCode);
  pushMetaobjectField_(fields, "quote_version", savedBuild && savedBuild.quoteVersion);
  pushMetaobjectField_(fields, "status", normalizeSavedBuildStatus_(savedBuild && savedBuild.status));
  pushMetaobjectField_(fields, "visibility", normalizeSavedBuildVisibility_(savedBuild && savedBuild.visibility));
  pushMetaobjectField_(fields, "created_at", createdAt);
  pushMetaobjectField_(fields, "updated_at", updatedAt);

  return fields;
}

function buildUsedListingFields_(submission) {
  const fields = [];
  const referencedProductGid = normalizeProductReference_(submission.referencedProduct);
  const brandReference = asTrimmedString_(submission.resolvedBrandMetaobjectId || submission.brandReference);
  const adminNotes = asTrimmedString_(submission.reviewNotes);
  const dateListed = toIsoDateTime_(submission.createdAt);
  const photoFileIds = getPhotoFileIds_(submission);
  const proofFileId = getProofFileId_(submission);

  pushMetaobjectField_(fields, "status", formatStatusValue_(submission.status || "pending_review"));
  pushMetaobjectField_(fields, "seller_customer_id", submission.sellerCustomerId);
  pushMetaobjectField_(fields, "date_listed", dateListed);
  pushMetaobjectField_(fields, "expiry_date", addDaysIso_(dateListed, 7));
  pushMetaobjectField_(fields, "source_type", formatSourceType_(submission.sourceType));
  pushMetaobjectField_(fields, "referenced_product", referencedProductGid);
  pushMetaobjectField_(fields, "manual_title", buildListingTitle_(submission));
  pushMetaobjectField_(fields, "manual_model", submission.manualModel);
  pushMetaobjectField_(fields, "external_product_url", toAbsoluteStoreUrl_(submission.externalProductUrl));
  if (isGlobalId_(brandReference)) {
    pushMetaobjectField_(fields, "brand", brandReference);
  }
  pushMetaobjectField_(fields, "asking_price", submission.askingPrice);
  pushMetaobjectField_(fields, "condition_grade", formatConditionGrade_(submission.conditionGrade));
  pushMetaobjectField_(fields, "city_region", submission.cityRegion);
  pushMetaobjectField_(fields, "usage_notes", submission.usageNotes);
  pushMetaobjectField_(fields, "issue_disclosures", submission.issueDisclosures);
  if (photoFileIds.length) {
    pushMetaobjectField_(fields, "photos", JSON.stringify(photoFileIds));
  }
  pushMetaobjectField_(fields, "proof_of_purchase_status", formatProofStatus_(submission.proofOfPurchaseStatus));
  pushMetaobjectField_(fields, "proof_of_purchase_file", proofFileId);
  pushMetaobjectField_(fields, "personal_warranty_offered", asBooleanString_(submission.personalWarrantyOffered));
  pushMetaobjectField_(fields, "still_in_warranty", asBooleanString_(submission.stillInWarranty));
  pushMetaobjectField_(fields, "contact_preference", formatContactPreference_(submission.contactPreference));
  pushMetaobjectField_(fields, "seller_agreement_accepted", asBooleanString_(submission.sellerAgreementAccepted));
  pushMetaobjectField_(fields, "admin_notes", adminNotes);

  return fields;
}

function extractUserErrors_(payload, rootKey) {
  const errors =
    payload && payload[rootKey] && Array.isArray(payload[rootKey].userErrors) ? payload[rootKey].userErrors : [];

  if (!errors.length) return;

  throw new Error(`${rootKey}-user-errors:${JSON.stringify(errors)}`);
}

function summarizeUserErrors_(rawValue) {
  const markerIndex = rawValue.indexOf(":[");
  if (markerIndex < 0) return "";

  try {
    const parsed = JSON.parse(rawValue.slice(markerIndex + 1));
    if (!Array.isArray(parsed) || !parsed.length) return "";
    return parsed.map((entry) => asTrimmedString_(entry.message)).filter(Boolean).join("; ");
  } catch (error) {
    return "";
  }
}

function summarizeShopifyError(errorLike) {
  const rawReason = asTrimmedString_(errorLike && errorLike.message ? errorLike.message : errorLike);
  if (!rawReason) return "Unknown Shopify error.";

  if (rawReason.includes("used-listing-photos-field-must-be-list-file-reference")) {
    return "The used_listing.photos field is still configured as a single file. Change it to a list of files in Shopify Admin, then re-sync the listing.";
  }

  if (rawReason === "Client credentials not configured yet." || rawReason.includes("shopify-client-credentials-missing")) {
    return "Shopify client credentials are not configured yet.";
  }

  if (rawReason.includes("app_not_installed")) {
    return "The Shopify app is not installed on this store yet.";
  }

  if (rawReason.includes("Missing or invalid client secret")) {
    return "Shopify client secret is missing or invalid.";
  }

  if (rawReason.includes("shopify-token-request-failed")) {
    return "Shopify token request failed.";
  }

  if (rawReason.includes("shopify-token-missing")) {
    return "Shopify did not return an admin access token.";
  }

  if (rawReason.includes("shopify-graphql-failed")) {
    return "Shopify Admin API request failed.";
  }

  if (rawReason.includes("shopify-local-file-missing")) {
    return "A local upload file is missing, so Shopify media sync could not continue.";
  }

  if (rawReason.includes("shopify-staged-upload-failed")) {
    return "Uploading the file to Shopify failed.";
  }

  if (rawReason.includes("shopify-file-processing-timeout")) {
    return "Shopify file processing timed out before the file became ready.";
  }

  if (
    rawReason.includes("metaobjectCreate-user-errors:") ||
    rawReason.includes("metaobjectUpdate-user-errors:") ||
    rawReason.includes("metaobjectDelete-user-errors:") ||
    rawReason.includes("stagedUploadsCreate-user-errors:") ||
    rawReason.includes("fileCreate-user-errors:") ||
    rawReason.includes("fileDelete-user-errors:")
  ) {
    const summarized = summarizeUserErrors_(rawReason);
    if (summarized.includes("build_snapshot")) {
      return "The saved_build metaobject is missing the optional build_snapshot JSON field. Add it in Shopify Admin, then try saving again.";
    }
    return summarized || "Shopify metaobject validation failed.";
  }

  if (rawReason.includes("metaobjectCreate-empty-response") || rawReason.includes("metaobjectUpdate-empty-response")) {
    return "Shopify did not return the saved used listing payload.";
  }

  return rawReason;
}

function canUseClientCredentials() {
  return !!(config.shopifyStoreDomain && config.shopifyClientId && config.shopifyClientSecret);
}

async function getAdminAccessToken() {
  if (!canUseClientCredentials()) {
    throw new Error("shopify-client-credentials-missing");
  }

  const now = Date.now();
  if (cachedToken && cachedTokenExpiry > now + 60 * 1000) {
    return cachedToken;
  }

  const response = await fetch(`https://${config.shopifyStoreDomain}/admin/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: config.shopifyClientId,
      client_secret: config.shopifyClientSecret
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`shopify-token-request-failed:${response.status}:${body}`);
  }

  const json = await response.json();
  cachedToken = String(json.access_token || "").trim();
  cachedTokenExpiry = now + Math.max(1, Number(json.expires_in) || 86399) * 1000;

  if (!cachedToken) {
    throw new Error("shopify-token-missing");
  }

  return cachedToken;
}

async function shopifyGraphql(query, variables = {}) {
  const accessToken = await getAdminAccessToken();
  const response = await fetch(`https://${config.shopifyStoreDomain}/admin/api/2026-04/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken
    },
    body: JSON.stringify({ query, variables })
  });

  const json = await response.json();
  if (!response.ok || json.errors) {
    throw new Error(`shopify-graphql-failed:${response.status}:${JSON.stringify(json.errors || json)}`);
  }
  return json.data;
}

async function fetchShopifyStatus() {
  if (!canUseClientCredentials()) {
    return {
      ok: false,
      reason: "Client credentials not configured yet."
    };
  }

  try {
    const data = await shopifyGraphql(`
      query UpgradeAssistAppStatus {
        shop {
          name
          myshopifyDomain
        }
        products(first: 1) {
          nodes {
            id
            title
          }
        }
      }
    `);

    return {
      ok: true,
      shopName: data.shop ? data.shop.name : "",
      myshopifyDomain: data.shop ? data.shop.myshopifyDomain : "",
      sampleProductTitle:
        data.products && Array.isArray(data.products.nodes) && data.products.nodes[0]
          ? data.products.nodes[0].title
          : ""
    };
  } catch (error) {
    return {
      ok: false,
      reason: error.message
    };
  }
}

async function createStagedUploadTarget_(fileMeta) {
  const payload = await shopifyGraphql(
    `
      mutation CreateUpgradeAssistStagedUpload($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets {
            url
            resourceUrl
            parameters {
              name
              value
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      input: [
        {
          filename: asTrimmedString_(fileMeta && fileMeta.originalName) || asTrimmedString_(fileMeta && fileMeta.filename),
          mimeType: asTrimmedString_(fileMeta && fileMeta.mimetype) || "application/octet-stream",
          resource: inferStagedUploadResource_(fileMeta)
        }
      ]
    }
  );

  extractUserErrors_(payload, "stagedUploadsCreate");
  const target =
    payload &&
    payload.stagedUploadsCreate &&
    Array.isArray(payload.stagedUploadsCreate.stagedTargets) &&
    payload.stagedUploadsCreate.stagedTargets[0]
      ? payload.stagedUploadsCreate.stagedTargets[0]
      : null;

  if (!target || !target.url || !target.resourceUrl) {
    throw new Error("stagedUploadsCreate-empty-response");
  }

  return target;
}

async function uploadStagedFile_(target, fileMeta) {
  const filePath = getLocalUploadPath_(fileMeta);
  const fileBuffer = fs.readFileSync(filePath);
  const parameters = Array.isArray(target.parameters) ? target.parameters : [];
  const usePutUpload =
    parameters.length > 0 && parameters.every((parameter) => ["content_type", "acl"].includes(asTrimmedString_(parameter.name)));

  if (usePutUpload) {
    const headers = {};
    parameters.forEach((parameter) => {
      headers[parameter.name] = parameter.value;
    });

    const response = await fetch(target.url, {
      method: "PUT",
      headers,
      body: fileBuffer
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`shopify-staged-upload-failed:${response.status}:${body}`);
    }

    return;
  }

  const formData = new FormData();
  parameters.forEach((parameter) => {
    formData.append(parameter.name, parameter.value);
  });
  formData.append(
    "file",
    new Blob([fileBuffer], { type: asTrimmedString_(fileMeta && fileMeta.mimetype) || "application/octet-stream" }),
    asTrimmedString_(fileMeta && fileMeta.originalName) || asTrimmedString_(fileMeta && fileMeta.filename) || "upload.bin"
  );

  const response = await fetch(target.url, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`shopify-staged-upload-failed:${response.status}:${body}`);
  }
}

async function createShopifyFile_(resourceUrl, fileMeta, altText) {
  const payload = await shopifyGraphql(
    `
      mutation CreateUpgradeAssistFile($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
          files {
            id
            alt
            fileStatus
            ... on MediaImage {
              image {
                url
              }
            }
            ... on GenericFile {
              url
              preview {
                image {
                  url
                }
              }
            }
          }
          userErrors {
            field
            message
            code
          }
        }
      }
    `,
    {
      files: [
        {
          originalSource: resourceUrl,
          alt: altText,
          contentType: inferFileContentType_(fileMeta)
        }
      ]
    }
  );

  extractUserErrors_(payload, "fileCreate");
  const createdFile =
    payload && payload.fileCreate && Array.isArray(payload.fileCreate.files) && payload.fileCreate.files[0]
      ? payload.fileCreate.files[0]
      : null;

  if (!createdFile || !createdFile.id) {
    throw new Error("fileCreate-empty-response");
  }

  return createdFile;
}

function extractShopifyFileUrls_(fileNode) {
  const directUrl = asTrimmedString_(fileNode && fileNode.url ? fileNode.url : "");
  const imageUrl = asTrimmedString_(
    fileNode && fileNode.image && fileNode.image.url ? fileNode.image.url : directUrl
  );
  const previewUrl = asTrimmedString_(
    fileNode && fileNode.preview && fileNode.preview.image && fileNode.preview.image.url
      ? fileNode.preview.image.url
      : imageUrl
  );

  return {
    directUrl: directUrl || imageUrl || previewUrl,
    previewUrl: previewUrl || imageUrl || directUrl
  };
}

async function waitForShopifyFileReady_(fileId) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const payload = await shopifyGraphql(
      `
        query UpgradeAssistFileStatus($id: ID!) {
          node(id: $id) {
            ... on MediaImage {
              id
              fileStatus
              image {
                url
              }
              preview {
                image {
                  url
                }
              }
              fileErrors {
                code
                message
              }
            }
            ... on GenericFile {
              id
              fileStatus
              url
              preview {
                image {
                  url
                }
              }
              fileErrors {
                code
                message
              }
            }
          }
        }
      `,
      {
        id: fileId
      }
    );

    const fileNode = payload ? payload.node : null;
    const status = asTrimmedString_(fileNode && fileNode.fileStatus).toUpperCase();

    if (status === "READY") {
      return {
        id: asTrimmedString_(fileNode.id),
        fileStatus: status,
        ...extractShopifyFileUrls_(fileNode)
      };
    }

    if (status === "FAILED") {
      const fileErrors = Array.isArray(fileNode && fileNode.fileErrors) ? fileNode.fileErrors : [];
      const message = fileErrors.map((entry) => asTrimmedString_(entry.message)).filter(Boolean).join("; ");
      throw new Error(message || "Shopify file processing failed.");
    }

    await sleep_(1000);
  }

  throw new Error("shopify-file-processing-timeout");
}

async function uploadLocalFileToShopify_(submission, fileMeta, kind, index = 0) {
  const stagedTarget = await createStagedUploadTarget_(fileMeta);
  await uploadStagedFile_(stagedTarget, fileMeta);
  const createdFile = await createShopifyFile_(stagedTarget.resourceUrl, fileMeta, buildFileAltText_(submission, kind, index));
  return waitForShopifyFileReady_(createdFile.id);
}

async function syncSubmissionFilesToShopify(submission) {
  const patch = {};
  let hasPatch = false;
  const nextPhotos = Array.isArray(submission && submission.photos) ? submission.photos.map((photo) => ({ ...photo })) : [];

  for (let index = 0; index < nextPhotos.length; index += 1) {
    const photo = nextPhotos[index];
    if (asTrimmedString_(photo && photo.shopifyFileId)) {
      continue;
    }

    const uploaded = await uploadLocalFileToShopify_(submission, photo, "photo", index);
    photo.shopifyFileId = uploaded.id;
    photo.shopifyFileStatus = uploaded.fileStatus;
    photo.shopifyFileUrl = uploaded.directUrl;
    photo.shopifyFilePreviewUrl = uploaded.previewUrl;
    photo.shopifySyncedAt = new Date().toISOString();
    hasPatch = true;
  }

  if (hasPatch) {
    patch.photos = nextPhotos;
  }

  if (
    submission &&
    submission.proofOfPurchaseStatus === "picture" &&
    submission.proofOfPurchaseFile &&
    !asTrimmedString_(submission.proofOfPurchaseFile.shopifyFileId)
  ) {
    const nextProof = { ...submission.proofOfPurchaseFile };
    const uploadedProof = await uploadLocalFileToShopify_(submission, nextProof, "proof");
    nextProof.shopifyFileId = uploadedProof.id;
    nextProof.shopifyFileStatus = uploadedProof.fileStatus;
    nextProof.shopifyFileUrl = uploadedProof.directUrl;
    nextProof.shopifyFilePreviewUrl = uploadedProof.previewUrl;
    nextProof.shopifySyncedAt = new Date().toISOString();
    patch.proofOfPurchaseFile = nextProof;
    hasPatch = true;
  }

  return {
    patch,
    hasPatch
  };
}

async function createUsedListingMetaobject(submission) {
  const payload = await shopifyGraphql(
    `
      mutation CreateUpgradeAssistUsedListing($metaobject: MetaobjectCreateInput!) {
        metaobjectCreate(metaobject: $metaobject) {
          metaobject {
            id
            handle
            updatedAt
          }
          userErrors {
            field
            message
            code
          }
        }
      }
    `,
    {
      metaobject: {
        type: config.shopifyUsedListingType,
        handle: buildListingHandle_(submission),
        fields: buildUsedListingFields_(submission),
        capabilities: buildMetaobjectCapabilities_(submission)
      }
    }
  );

  try {
    extractUserErrors_(payload, "metaobjectCreate");
  } catch (error) {
    if (getPhotoFileIds_(submission).length && asTrimmedString_(error.message).includes("Value is invalid JSON")) {
      throw new Error("used-listing-photos-field-must-be-list-file-reference");
    }
    throw error;
  }
  const metaobject = payload.metaobjectCreate ? payload.metaobjectCreate.metaobject : null;
  if (!metaobject || !metaobject.id) {
    throw new Error("metaobjectCreate-empty-response");
  }
  return metaobject;
}

async function createSavedBuildMetaobject(savedBuild) {
  const payload = await shopifyGraphql(
    `
      mutation CreateSavedBuild($metaobject: MetaobjectCreateInput!) {
        metaobjectCreate(metaobject: $metaobject) {
          metaobject {
            id
            handle
            updatedAt
          }
          userErrors {
            field
            message
            code
          }
        }
      }
    `,
    {
      metaobject: {
        type: config.shopifySavedBuildType,
        handle: buildSavedBuildHandle_(savedBuild),
        fields: buildSavedBuildFields_(savedBuild)
      }
    }
  );

  extractUserErrors_(payload, "metaobjectCreate");
  const metaobject = payload.metaobjectCreate ? payload.metaobjectCreate.metaobject : null;
  if (!metaobject || !metaobject.id) {
    throw new Error("savedBuildCreate-empty-response");
  }
  return metaobject;
}

async function updateSavedBuildMetaobject(savedBuild) {
  const metaobjectId = asTrimmedString_(savedBuild && savedBuild.id);
  if (!metaobjectId) {
    throw new Error("savedBuildUpdate-missing-id");
  }

  const payload = await shopifyGraphql(
    `
      mutation UpdateSavedBuild($id: ID!, $metaobject: MetaobjectUpdateInput!) {
        metaobjectUpdate(id: $id, metaobject: $metaobject) {
          metaobject {
            id
            handle
            updatedAt
          }
          userErrors {
            field
            message
            code
          }
        }
      }
    `,
    {
      id: metaobjectId,
      metaobject: {
        fields: buildSavedBuildFields_(savedBuild)
      }
    }
  );

  extractUserErrors_(payload, "metaobjectUpdate");
  const metaobject = payload.metaobjectUpdate ? payload.metaobjectUpdate.metaobject : null;
  if (!metaobject || !metaobject.id) {
    throw new Error("savedBuildUpdate-empty-response");
  }
  return metaobject;
}

async function deleteSavedBuildMetaobject(metaobjectId) {
  const normalizedId = asTrimmedString_(metaobjectId);
  if (!normalizedId) {
    throw new Error("savedBuildDelete-missing-id");
  }

  const payload = await shopifyGraphql(
    `
      mutation DeleteSavedBuild($id: ID!) {
        metaobjectDelete(id: $id) {
          deletedId
          userErrors {
            field
            message
            code
          }
        }
      }
    `,
    {
      id: normalizedId
    }
  );

  extractUserErrors_(payload, "metaobjectDelete");
  return payload.metaobjectDelete ? payload.metaobjectDelete.deletedId : "";
}

async function updateUsedListingMetaobject(metaobjectId, submission) {
  const payload = await shopifyGraphql(
    `
      mutation UpdateUpgradeAssistUsedListing($id: ID!, $metaobject: MetaobjectUpdateInput!) {
        metaobjectUpdate(id: $id, metaobject: $metaobject) {
          metaobject {
            id
            handle
            updatedAt
          }
          userErrors {
            field
            message
            code
          }
        }
      }
    `,
    {
      id: metaobjectId,
      metaobject: {
        fields: buildUsedListingFields_(submission),
        capabilities: buildMetaobjectCapabilities_(submission)
      }
    }
  );

  try {
    extractUserErrors_(payload, "metaobjectUpdate");
  } catch (error) {
    if (getPhotoFileIds_(submission).length && asTrimmedString_(error.message).includes("Value is invalid JSON")) {
      throw new Error("used-listing-photos-field-must-be-list-file-reference");
    }
    throw error;
  }
  const metaobject = payload.metaobjectUpdate ? payload.metaobjectUpdate.metaobject : null;
  if (!metaobject || !metaobject.id) {
    throw new Error("metaobjectUpdate-empty-response");
  }
  return metaobject;
}

async function deleteUsedListingMetaobject(metaobjectId) {
  const payload = await shopifyGraphql(
    `
      mutation DeleteUpgradeAssistUsedListing($id: ID!) {
        metaobjectDelete(id: $id) {
          deletedId
          userErrors {
            field
            message
            code
          }
        }
      }
    `,
    {
      id: metaobjectId
    }
  );

  extractUserErrors_(payload, "metaobjectDelete");
  return payload.metaobjectDelete ? payload.metaobjectDelete.deletedId : "";
}

async function deleteShopifyFiles(fileIds) {
  const normalizedFileIds = Array.from(new Set((Array.isArray(fileIds) ? fileIds : []).map(asTrimmedString_).filter(Boolean)));
  if (!normalizedFileIds.length) {
    return [];
  }

  const payload = await shopifyGraphql(
    `
      mutation DeleteUpgradeAssistFiles($fileIds: [ID!]!) {
        fileDelete(fileIds: $fileIds) {
          deletedFileIds
          userErrors {
            field
            message
            code
          }
        }
      }
    `,
    {
      fileIds: normalizedFileIds
    }
  );

  extractUserErrors_(payload, "fileDelete");
  return payload && payload.fileDelete && Array.isArray(payload.fileDelete.deletedFileIds)
    ? payload.fileDelete.deletedFileIds
    : [];
}

function verifyProxySignature(query) {
  if (config.allowUnsignedProxy && !query.signature && !query.hmac) {
    return true;
  }

  const providedSignature = String(query.signature || query.hmac || "").trim();
  if (!providedSignature || !config.shopifyClientSecret) {
    return false;
  }

  const params = { ...query };
  delete params.signature;
  delete params.hmac;

  const message = Object.keys(params)
    .sort()
    .map((key) => {
      const value = params[key];
      if (Array.isArray(value)) {
        return value.map((entry) => `${key}=${entry}`).join("");
      }
      return `${key}=${value}`;
    })
    .join("");

  const digest = crypto.createHmac("sha256", config.shopifyClientSecret).update(message, "utf8").digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(digest, "utf8"), Buffer.from(providedSignature, "utf8"));
  } catch (error) {
    return false;
  }
}

module.exports = {
  canUseClientCredentials,
  getAdminAccessToken,
  shopifyGraphql,
  fetchShopifyStatus,
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
  summarizeShopifyError,
  verifyProxySignature
};
