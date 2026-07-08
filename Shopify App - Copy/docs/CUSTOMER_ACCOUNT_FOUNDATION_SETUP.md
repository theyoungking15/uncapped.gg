# Customer Account Foundation Setup

## Purpose
This document defines the first manual Shopify Admin setup for customer-account foundations in the Uncapped PC workspace.

This is intentionally lean.

It is meant to support:
- stricter account completeness
- future saved builds
- future customer-facing account pages
- future listing / quote / support ownership

It is not meant to create a full customer-profile system yet.

## Foundation Rule
Keep identity on the native Shopify customer record whenever Shopify already provides the field.

That means these stay native:
- `email`
- `first_name`
- `last_name`
- `phone`

Do not recreate those as customer metafields.

## What To Create Now
Create only:
- 2 customer metafield definitions
- 1 standalone metaobject definition for saved builds

Do not create:
- a customer-profile metaobject
- a customer metafield list of saved-build references
- quote-history metaobjects
- public profile/community metaobjects

The current foundation should stay simple enough that we do not create dual-write problems before the account features exist in code.

## Why This Shape
This workspace already has account-dependent flows:
- Upgrade Assist submission gating
- customer snapshot storage in Upgrade Assist
- saved-build planning that requires customer-ID-based ownership

The clean foundation is:
- native customer fields for identity
- customer metafields for future account preferences and public-facing identity
- standalone metaobjects for multi-record customer-owned assets

That is the right shape for `saved_build`, because one customer must be able to own multiple saved builds.

## Manual Shopify Admin Setup

### 1. Customer Metafields
Go to:
- `Shopify Admin -> Settings -> Custom data -> Customers`

Create these definitions.

#### A. Username
- Name: `Username`
- Namespace and key: `custom.public_handle`
- Type: `Single line text`
- Required: `No`

Purpose:
- reserve a future public identity field
- support future share attribution and public account presentation

Important:
- do not use this as the real ownership key for saved builds or listings

#### B. Preferred contact method
- Name: `Preferred contact method`
- Namespace and key: `custom.preferred_contact_method`
- Type: `Single line text`
- Required: `No`

Planned later values:
- `email`
- `phone`
- `messenger`

Purpose:
- future account-level default contact preference
- reusable across Upgrade Assist and future account features

### 2. Saved Build Metaobject
Go to:
- `Shopify Admin -> Settings -> Custom data -> Metaobjects`

Create a new definition:
- Name: `Saved build`
- Type: `saved_build`

Set the display field to:
- `build_name`

Create these fields.

#### Required fields
1. `build_name`
- Type: `Single line text`
- Required: `Yes`

2. `owner_customer_id`
- Type: `Single line text`
- Required: `Yes`
- Filterable: `Yes`, if Shopify offers the option

3. `owner_customer_email_snapshot`
- Type: `Single line text`
- Required: `Yes`

4. `owner_customer_name_snapshot`
- Type: `Single line text`
- Required: `Yes`

5. `build_payload`
- Type: `JSON`
- Required: `Yes`

6. `status`
- Type: `Single line text`
- Required: `Yes`

7. `visibility`
- Type: `Single line text`
- Required: `Yes`

8. `created_at`
- Type: `Date and time`
- Required: `Yes`

9. `updated_at`
- Type: `Date and time`
- Required: `Yes`

#### Optional field
10. `quote_code`
- Type: `Single line text`
- Required: `No`

Purpose:
- allows future linkage to existing quote flow without making quote linkage mandatory in the first Saved Builds pass

## Access Settings

### Saved build
For the `saved_build` metaobject definition:
- enable storefront read access if Shopify exposes a storefront / Storefront API access option
- do not publish entries as standalone web pages
- do not turn this into a renderable content type yet unless Shopify forces it

Reason:
- the first real use is account-owned data and saved-build reopen/share behavior, not standalone CMS pages

### Customer metafields
If Shopify exposes customer-account access controls for these metafields:
- set them to support future customer-account read/write use

Do not expose them publicly on the storefront yet unless a real UI needs them.

## Data Rules For Future Implementation

### Ownership
Real ownership key:
- `owner_customer_id`

Do not use:
- `public_handle`
- email alone
- customer name alone

Reason:
- Shopify customer ID is the only stable owner key across saved builds and future account assets

### Snapshot fields
Keep these snapshots in each saved build:
- email snapshot
- name snapshot

Reason:
- builds remain readable even if the customer later edits their profile

### Default values to use later in code
When Saved Builds is implemented, use these defaults:
- `status = active`
- `visibility = unlisted`

Possible future values:
- `status`: `active`, `archived`
- `visibility`: `private`, `unlisted`

## What Not To Build Into The Data Model Yet
Do not add these now:
- `owner_public_handle`
- customer reference lists back to every build
- public profile URLs
- social / community fields
- Discord fields

Those are future feature layers, not foundation requirements.

## How This Supports Future Features

### Upgrade Assist
- reuse native customer identity as the source of truth
- later reuse `preferred_contact_method`

### Saved Builds
- one customer can own multiple saved builds
- each build has enough data to reopen, list, and share

### Quote linkage
- `quote_code` leaves a clean hook for future connection to the builder/quote system

### Customer account pages
- future `My Builds` page can query by `owner_customer_id`
- future account dashboards can follow the same ownership pattern

### Public identity later
- `custom.public_handle` is reserved now without making it part of ownership

## Verification Checklist
After manual setup, confirm all of the following.

### Customer metafields
- `custom.public_handle` exists and is labeled `Username`
- `custom.preferred_contact_method` exists

### Saved build metaobject
- `saved_build` definition exists
- `build_name` is the display field
- all 10 fields exist
- `owner_customer_id` is filterable if Shopify allowed it
- storefront read access is enabled if available
- entries are not configured as standalone public pages

### Data hygiene
- no duplicate customer metafields were created for native fields like email or phone
- no separate customer-profile metaobject was created in this setup pass

## Recommended Next Implementation Order
After this Admin setup is done, the next code work should be:

1. Saved Builds MVP
- save multiple builds per logged-in customer
- tie ownership to Shopify customer ID
- create `My Builds`

2. Customer-facing account data views
- `My Upgrade Assist submissions`
- future listing ownership visibility

3. Shared account rules
- one account-completeness standard
- one ownership model across listings, builds, and future quotes

## Bottom Line
The correct foundation is not a large customer-profile system.

The correct foundation is:
- native Shopify customer identity
- a small number of customer metafields
- one clean `saved_build` metaobject

That gives the workspace a stable account base without overbuilding future features too early.
