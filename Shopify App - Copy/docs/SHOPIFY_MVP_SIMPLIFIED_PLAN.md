# Shopify Workspace MVP Simplified Plan

## Purpose
This file is the simple version of what exists in this Shopify workspace, what is already working, and what we should build next.

The main goal is to keep the project grounded around a practical MVP for the Uncapped PC Shopify website.

## Workspace Summary

### `PC Builder 2`
Main custom PC Builder experience.

Current capability:
- product selection and compatibility flow
- quote generation and quote lookup support
- screenshot / image output for quotes
- approval flow and reopen behavior
- builder-related UI refinements

Why it matters:
- this is one of the core custom selling tools on the site

### `FPS Finder`
Recommendation system that helps users find a starting point based on game / performance goals.

Current capability:
- recommendation lanes like best value / budget / upgrade path
- handoff into PC Builder
- storefront section and supporting assets

Why it matters:
- helps users discover a build before entering the builder

### `Price list`
Main collection browsing / filtered product list tools.

Current capability:
- price list sections
- sticky helpers and filter logic
- performance-related add-ons

Why it matters:
- supports general storefront browsing and product discovery

### `Price list 2`
Variant / alternate implementation of the product list flow.

Why it matters:
- likely used for a second browsing layout or another storefront context

### `Performance Preview Price List`
Performance-focused sticky comparison / preview layer.

Why it matters:
- gives extra browsing support for performance-minded users

### `Bundle Page`
Bundle hub and bundle listing pages.

Why it matters:
- supports bundled product experiences

### `Upgrade Assist`
Used-parts intake and review workflow.

Current capability:
- customer-gated storefront submission form
- local review app
- Shopify sync for `used_listing`
- public approved listings page
- multi-photo support
- local admin review workflow

Why it matters:
- this is the clearest custom marketplace-style feature in the workspace

### `Apps Script`
Supporting scripts / integrations for builder-related data handling.

### `docs`
Project notes and architecture / changelog documentation.

## What Is Already Working

### Storefront Features
- PC Builder works as a custom build flow
- FPS Finder works as a recommendation and builder handoff feature
- product list pages have custom filtering / sticky helper behavior
- Upgrade Assist has a live customer submission flow
- approved Upgrade Assist listings can be shown publicly

### Admin / Internal Features
- Upgrade Assist has a local admin review UI
- submissions can be approved, rejected, archived, deleted, and re-synced
- approved listings sync into Shopify metaobjects
- uploaded photos and proof files can sync into Shopify Files

### Data / Integration Features
- Upgrade Assist is now tied to Shopify customer identity at submission time
- approved listing records exist in Shopify
- public listing media can come from uploaded seller photos
- brand resolution exists for catalog-linked submissions

## What The MVP Should Mean
For this project, the MVP should not mean "everything possible."

It should mean:
- a user can discover products or build options
- a user can create or submit something meaningful
- the business can review / operate that flow
- the system can tie actions back to a real customer account

So the MVP is not just theme pages.
The MVP is the minimum connected system that lets Uncapped PC:
- identify the customer
- capture the customer action
- keep the data tied to the customer
- use that account later for support, listings, quotes, and follow-up

## Why Customer Accounts Should Be The Next Major Step
Right now, several features already depend on identity:
- Upgrade Assist submissions
- future public seller contact
- future listing ownership
- possible saved PC Builder activity
- future quote history / listing history / support history

Without a stronger account model:
- data stays more manual
- contact information is less reliable
- ownership flows are weaker
- future customer-facing dashboards become harder

So the next MVP phase should be:
- define the customer account model for Uncapped PC
- then make the existing custom features plug into that model cleanly

## Customer Account MVP Goal
Create a simple but reliable customer account system that supports:
- account completeness
- contact reliability
- listing ownership
- future quote / listing history

## Recommended Customer Account MVP Scope

### 1. Required Account Fields
Every customer account should have:
- email
- first name
- last name
- phone number

Optional next field:
- custom username / handle

Why:
- these are the minimum fields needed for ownership and contact

### 2. Account Completeness Rules
Important actions should require a complete account.

Start with:
- Upgrade Assist submission

Later:
- saved quotes
- seller-facing history pages
- direct contact features

### 3. Customer Identity Layer
Every major action should store:
- Shopify customer ID
- email snapshot
- name snapshot
- phone snapshot

Why:
- this keeps records usable even if the customer later edits their profile

### 4. Customer Account Pages
The MVP customer account experience should eventually give users:
- basic profile completeness guidance
- my submissions
- my approved listings
- my quote history

Not all of this must ship at once, but this should be the target shape.

## Recommended Build Order

### Phase A
Standardize customer account requirements across features.

Tasks:
- keep required fields strict
- define which flows require a complete account
- add a single account-completeness standard

### Phase B
Create customer-facing account data views.

Tasks:
- "My Upgrade Assist submissions"
- status visibility for pending / approved / rejected
- basic listing ownership visibility

### Phase C
Connect more custom features to the same customer account layer.

Tasks:
- quote history
- saved builder state
- future contact-release rules for approved listings

### Phase D
Add optional extended identity features.

Examples:
- username / public handle
- Discord posting tied to approved listings
- seller reputation / transaction history later

## Recommended Next Concrete Task
The next best implementation task is:

**Create the customer-account MVP spec before adding more features.**

That spec should define:
- required customer fields
- what counts as a complete account
- which actions are blocked until the account is complete
- which customer-facing account pages we need first
- which existing features must store the customer snapshot

## Suggested Immediate Deliverables
If we continue from here, the next practical documents / implementations should be:

1. `Customer account MVP spec`
2. `My submissions` page for Upgrade Assist
3. `Customer data model` for quotes + listings + support

Current foundation doc:
- `docs/CUSTOMER_ACCOUNT_FOUNDATION_SETUP.md`
  This is the manual Shopify Admin setup reference for the first customer-account foundation pass.

## Out Of Scope For The Immediate MVP
These are useful, but should not come before the account foundation:
- Discord posting
- public seller messaging system
- advanced marketplace-style listing pages
- full username-based identity system
- hosted production migration

## Bottom Line
The workspace already has strong custom feature work.

The next step is not another isolated storefront feature.
The next step is making customer accounts the shared foundation, so the current custom systems can become a real MVP instead of separate tools.
