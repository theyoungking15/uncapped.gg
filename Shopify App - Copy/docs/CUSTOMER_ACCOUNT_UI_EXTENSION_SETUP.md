# Customer Account UI Extension Setup

## Purpose
This file explains the first customer-account UI implementation added to the workspace.

It is a Shopify customer account profile-block extension that lets a signed-in customer edit:
- `Username`, stored in `custom.public_handle`
- `Preferred contact method`, stored in `custom.preferred_contact_method`

Important:
- the metafield key stays `custom.public_handle`
- only the label is changing from `Public handle` to `Username`

## What Was Added
Extension source lives in:
- [package.json](D:/Prince/Shopify%20App/Upgrade%20Assist/app/extensions/customer-account-settings/package.json)
- [shopify.extension.toml](D:/Prince/Shopify%20App/Upgrade%20Assist/app/extensions/customer-account-settings/shopify.extension.toml)
- [ProfileSettingsExtension.jsx](D:/Prince/Shopify%20App/Upgrade%20Assist/app/extensions/customer-account-settings/src/ProfileSettingsExtension.jsx)

Support files:
- [generate-shopify-app-config.js](D:/Prince/Shopify%20App/Upgrade%20Assist/app/scripts/generate-shopify-app-config.js)
- [shopify.app.customer-account.template.toml](D:/Prince/Shopify%20App/Upgrade%20Assist/app/shopify.app.customer-account.template.toml)

## What The Extension Does
The extension renders on:
- `customer-account.profile.block.render`

The UI:
- reads the current customer metafield values through the Customer Account API
- shows a `Username` field
- shows a `Preferred contact method` field
- saves both values back to the current logged-in customer

Current validation:
- username is normalized to lowercase
- username allows letters, numbers, hyphens, and underscores
- preferred contact method must be `email`, `phone`, or `messenger`

## Shopify Admin Prerequisites
These should already exist:
- customer metafield `custom.public_handle`
- customer metafield `custom.preferred_contact_method`

For both definitions:
- Customer Account API access should be `read_write`

For the `custom.public_handle` definition:
- rename the definition label in Shopify Admin from `Public handle` to `Username`
- do not change the key

## App Scope Requirements
The app that owns this extension needs these scopes for customer-account metafield writes:
- `customer_read_customers`
- `customer_write_customers`

The config generator will merge those scopes into the generated `shopify.app.toml`.

## How To Generate The Shopify App Config
From:
- `D:\Prince\Shopify App\Upgrade Assist\app`

Run:

```powershell
npm run generate:shopify-config
```

This writes:
- `Upgrade Assist/app/shopify.app.toml`

It reads from:
- `Upgrade Assist/app/.env`

It uses:
- `SHOPIFY_CLIENT_ID`
- `APP_PUBLIC_URL`
- `SHOPIFY_ACCESS_SCOPES`

## What The Generated Config Is For
The generated `shopify.app.toml` gives you the base app config needed to work with Shopify CLI when you are ready to actually preview or deploy the customer account extension.

This workspace did not previously have a Shopify CLI app structure, so this step avoids hand-maintaining a large config file.

## Deployment Caveat
This repo now contains the extension source, but the extension is not live until you do Shopify CLI setup and deploy it.

Current environment limitation:
- Shopify CLI is not installed in this workspace session

So the implementation here is:
- extension source: done
- deployment wiring files: done
- live extension deployment to Shopify: still a manual next step

## Recommended Next Manual Steps
1. In Shopify Admin, rename the metafield definition label:
- `custom.public_handle` -> `Username`

2. Make sure both customer metafields are set to:
- `Customer Account API access = Read and write`

3. Install Shopify CLI on the machine if it is not installed.

4. From the app folder, generate the config:

```powershell
cd "D:\Prince\Shopify App\Upgrade Assist\app"
npm run generate:shopify-config
```

5. Link the app in Shopify CLI and deploy the extension.

6. In the customer account editor, add the new profile block extension to the Profile page.

## Verification Checklist
After deployment, verify:
- the Profile page shows a new account-settings card
- the UI labels say `Username` and `Preferred contact method`
- saving a username writes to `custom.public_handle`
- saving a preferred contact method writes to `custom.preferred_contact_method`
- the values appear on the customer record in Shopify Admin

## Notes
- This does not make username a login credential.
- This does not enforce uniqueness yet.
- This is the first customer-account UI layer only, not the full customer account MVP.
