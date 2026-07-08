const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const appRoot = path.resolve(__dirname, "..");
const envPath = path.join(appRoot, ".env");
const templatePath = path.join(appRoot, "shopify.app.customer-account.template.toml");
const outputPath = path.join(appRoot, "shopify.app.toml");

dotenv.config({ path: envPath });

function uniqueScopes(rawScopes) {
  const requiredScopes = ["customer_read_customers", "customer_write_customers"];
  const values = String(rawScopes || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  for (const scope of requiredScopes) {
    if (!values.includes(scope)) {
      values.push(scope);
    }
  }

  return values.join(",");
}

function escapeTomlString(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function ensureHttpUrl(value, fallback) {
  const normalized = String(value || "").trim();
  if (/^https?:\/\//i.test(normalized)) {
    return normalized.replace(/\/$/, "");
  }
  return fallback;
}

const template = fs.readFileSync(templatePath, "utf8");
const applicationUrl = ensureHttpUrl(process.env.APP_PUBLIC_URL, "https://replace-with-your-public-app-url.example");
const redirectUrl = `${applicationUrl}/auth/callback`;
const rendered = template
  .replace(/__APP_NAME__/g, escapeTomlString(process.env.SHOPIFY_APP_NAME || "upgrade-assist-local-app"))
  .replace(/__CLIENT_ID__/g, escapeTomlString(process.env.SHOPIFY_CLIENT_ID || "REPLACE_WITH_SHOPIFY_CLIENT_ID"))
  .replace(/__APPLICATION_URL__/g, escapeTomlString(applicationUrl))
  .replace(/__REDIRECT_URL__/g, escapeTomlString(redirectUrl))
  .replace(/__SCOPES__/g, escapeTomlString(uniqueScopes(process.env.SHOPIFY_ACCESS_SCOPES)));

fs.writeFileSync(outputPath, rendered);
process.stdout.write(`Generated ${outputPath}\n`);
