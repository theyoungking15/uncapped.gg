const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

function readNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readBoolean(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

const storageDir = path.resolve(__dirname, "..", "storage");

const config = {
  port: readNumber(process.env.PORT, 3000),
  publicAppUrl: String(process.env.APP_PUBLIC_URL || "").trim(),
  shopifyStoreDomain: String(process.env.SHOPIFY_STORE_DOMAIN || "").trim(),
  shopifyClientId: String(process.env.SHOPIFY_CLIENT_ID || "").trim(),
  shopifyClientSecret: String(process.env.SHOPIFY_CLIENT_SECRET || "").trim(),
  shopifyAccessScopes: String(process.env.SHOPIFY_ACCESS_SCOPES || "").trim(),
  shopifyUsedListingType: String(process.env.SHOPIFY_USED_LISTING_TYPE || "used_listing").trim() || "used_listing",
  shopifySavedBuildType: String(process.env.SHOPIFY_SAVED_BUILD_TYPE || "saved_build").trim() || "saved_build",
  appProxyPrefix: String(process.env.APP_PROXY_PREFIX || "apps").trim() || "apps",
  appProxySubpath: String(process.env.APP_PROXY_SUBPATH || "upgrade-assist").trim() || "upgrade-assist",
  appProxyBasePath:
    String(process.env.APP_PROXY_BASE_PATH || "/app-proxy/upgrade-assist").trim() || "/app-proxy/upgrade-assist",
  adminUsername: String(process.env.ADMIN_USERNAME || "admin").trim() || "admin",
  adminPassword: String(process.env.ADMIN_PASSWORD || "change-this").trim() || "change-this",
  allowUnsignedProxy: readBoolean(process.env.ALLOW_UNSIGNED_PROXY, true),
  storageDir,
  uploadsDir: path.join(storageDir, "uploads"),
  submissionsFile: path.join(storageDir, "submissions.json")
};

config.redirectUrl = config.publicAppUrl ? `${config.publicAppUrl.replace(/\/$/, "")}/auth/callback` : "";

module.exports = { config };
