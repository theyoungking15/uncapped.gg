# Upgrade Assist MVP. Codex Implementation Prompt

## Role
You are a senior Shopify OS 2.0 theme developer. Make minimal, reversible changes. Do not break existing logic. Preserve existing page gating and current behavior unless this task explicitly changes it.

## Project Context
We are building a feature called **Upgrade Assist**.

Purpose:
- Help our buyers sell their old parts
- Do not position Uncapped PC as the direct seller or owner of second-hand inventory
- Use this as an upgrade-support feature, not a full marketplace

Current state:
- A gated page already exists for Upgrade Assist
- Logged-out users see sign in / create account
- Logged-in users currently see a placeholder message
- A `used_listing` metaobject definition already exists in Shopify admin
- One manual test entry has already been created
- The long-term plan includes customer-owned component records later, but that is **not** part of this implementation

Important business rules:
- This is not a full marketplace
- Do not add cart or checkout behavior for second-hand items
- Do not make listings instantly public from customer submission
- All customer submissions should be treated as pending review
- This iteration is focused on the **signed-in intake form UI**
- Do not invent backend endpoints that do not exist
- If backend submission is not already available in the repo, create the form UI and a clean integration seam for later backend wiring

## Goal for This Iteration
Implement the **Upgrade Assist intake form** inside the signed-in state of the existing Upgrade Assist page.

The page behavior should be:
- Logged out: keep current sign-in / create account flow
- Logged in: show the actual Upgrade Assist form instead of placeholder text

## Required UX
The signed-in form should clearly explain:
- We help list old parts
- Submission does not mean automatic approval
- Listings are reviewed before appearing publicly
- Uncapped PC helps facilitate visibility, but does not own the item

## Required Form Structure
Build the form in logical sections.

### Section 1. Item Identification
Fields:
- Source type
  - catalog_reference
  - manual_entry
- Referenced product selector, only shown when source type = catalog_reference
- Manual title, only shown when source type = manual_entry
- Manual model, only shown when source type = manual_entry
- External product URL, only shown when source type = manual_entry

### Section 2. Brand
Important:
- The store already has an existing Brand metaobject / brand data model
- Do not default to a plain `manual_brand` field as the main solution

Implementation rule:
- If existing brand data is already exposed to the theme and safe to use, use it as the primary brand selector for manual entries
- If that data is not yet available in the current frontend context, add a temporary fallback text field such as `brand_name_fallback`
- Keep the code structured so this can later map cleanly to `brand_reference`

### Section 3. Seller Details
Fields:
- Asking price
- Condition grade
- City / region
- Usage notes
- Issue disclosures

### Section 4. Photos and Proof
Fields:
- Photos upload UI
- Proof of purchase status
  - none
  - picture
- Proof of purchase upload, only shown when proof status = picture

Note:
- If direct file upload is not currently supported by the existing implementation path, still build the UI and leave a clearly marked integration note for future backend handling

### Section 5. Warranty
Fields:
- Still in warranty
- Personal warranty offered
- Personal warranty duration, only shown if personal warranty offered = yes

### Section 6. Contact and Agreement
Fields:
- Contact preference
- Seller agreement checkbox

## Form Behavior Requirements
- Keep the form hidden from logged-out users
- Add client-side required-field validation
- Add conditional visibility for fields based on source type and warranty / proof answers
- Add clear labels and helper text
- Keep the structure mobile-friendly
- Keep the design consistent with the current theme styling
- Do not add heavy styling that conflicts with the theme
- Do not add backend assumptions that are not already present

## Submission Behavior for This Iteration
Priority order:
1. If a safe existing backend submission mechanism already exists in the project and is clearly intended for this feature, wire the form to it
2. Otherwise, build the form as UI-only with a non-destructive submit pathway and a clearly documented placeholder for later backend/app-proxy integration

If no real backend is connected:
- The submit button may be disabled until valid
- On submit, show a developer-safe placeholder behavior such as logging serialized payload to console or displaying a non-persistent preview state
- Do not create fake network behavior
- Do not claim that real submission is working if it is not

## Data Mapping
Structure the frontend form so it can later map to the existing `used_listing` metaobject fields:

- status
- seller_customer_id
- source_type
- referenced_product
- manual_title
- manual_model
- external_product_url
- brand_reference or fallback brand text
- asking_price
- condition_grade
- city_region
- usage_notes
- issue_disclosures
- photos
- proof_of_purchase_status
- proof_of_purchase_file
- personal_warranty_offered
- personal_warranty_duration
- still_in_warranty
- contact_preference
- seller_agreement_accepted
- date_listed
- expiry_date
- admin_notes
- featured
- public_handle

## Technical Constraints
- Shopify OS 2.0 theme
- Keep changes minimal and reversible
- Reuse the existing Upgrade Assist page gate rather than rebuilding it
- Do not remove the login gate
- Do not create a customer account extension in this iteration
- Do not create a public listings page in this iteration
- Do not implement marketplace behavior
- Do not add checkout behavior
- Do not break other templates, sections, or global scripts

## File Handling Rules
- Inspect the existing theme structure first
- Prefer updating the existing Upgrade Assist section rather than creating duplicate logic
- When you modify a file, provide the **full updated file** with exact path
- Add concise comments only where they materially improve maintainability
- Do not over-comment obvious code

## Required Deliverables
1. Full updated file(s) with exact path
2. Short explanation of what changed
3. Any assumptions made
4. Any remaining integration gaps
5. Architecture explanation in plain English
6. Changelog entry for this iteration

## Architecture Documentation Requirement
After implementing, create or update:
- `docs/upgrade-assist-architecture.md`
- `docs/upgrade-assist-changelog.md`

## Architecture File Must Include
- What Upgrade Assist is
- Current page flow
- Logged-out flow
- Logged-in flow
- Form section breakdown
- Data mapping from form fields to `used_listing`
- Future backend integration point
- Known limitations in this iteration

## Changelog File Must Include
For this iteration, log:
- date
- files changed
- summary of changes
- why the change was made
- rollback note if needed

## Completion Standard
Do not stop at partial edits. Finish the theme-side implementation for the signed-in intake form in a way that can be reviewed in the browser.

If a required dependency is missing, do not ask a vague question first. Inspect the codebase, make the safest grounded decision you can, and document the limitation clearly.