# Upgrade Assist. Architecture and Changelog Rules for Codex

These rules are mandatory for every Upgrade Assist implementation step.

## 1. Architecture documentation requirement
For every meaningful code change to Upgrade Assist, create or update:

- `docs/upgrade-assist-architecture.md`
- `docs/upgrade-assist-changelog.md`

Do not skip this.

## 2. Purpose of the architecture file
The architecture file should help a future developer understand:

- what Upgrade Assist is
- what files control it
- how the page behaves
- how the data is expected to flow
- what is already implemented
- what is still missing

## 3. Required architecture sections

### A. Feature summary
Include:

- purpose of Upgrade Assist
- current MVP scope
- out-of-scope items

### B. User flow
Document:

- logged-out flow
- logged-in flow
- submission intent
- review-before-public logic

### C. Theme structure
List:

- templates involved
- sections involved
- snippets involved
- JS assets involved
- any CSS or styling dependencies

### D. Form structure
Document:

- each form section
- each field group
- conditional field behavior
- validation behavior

### E. Data mapping
Map the visible form fields to the `used_listing` data model.

Document how the frontend currently maps or is expected to map to:

- status
- seller_customer_id
- source_type
- referenced_product
- manual_title
- manual_model
- external_product_url
- brand_reference or fallback brand field
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

### F. Integration seam
Document exactly where future backend or app-proxy submission should connect.

Be explicit about:

- current limitations
- what is stubbed
- what is real
- what the next integration step should be

### G. Known limitations
List anything incomplete, including:

- missing backend
- temporary fallback fields
- missing uploads
- placeholder submission
- brand data exposure gaps

## 4. Changelog rules
Every Upgrade Assist code change must add a new entry to `docs/upgrade-assist-changelog.md`.

Each entry must include:

- Date
- Short title
- Files changed
- Summary
- Why this change was made
- Risk or side effects
- Rollback note

## 5. Changelog format

Use this structure for each entry:

```md
## YYYY-MM-DD. Short title

**Files changed**
- path/to/file1
- path/to/file2

**Summary**
Short explanation of what changed.

**Why**
Reason for the change.

**Risk / side effects**
Anything that may need attention.

**Rollback note**
How to revert safely.
```

## 6. Response requirement after code changes
After implementing code, explain the architecture in plain English.

The explanation must include:

- what file controls the page
- what file controls the signed-in form
- where validation happens
- what is real vs placeholder
- where future backend integration should plug in

Do not only describe code line by line. Explain the system clearly.

## 7. Do not do this

- Do not leave undocumented changes
- Do not change Upgrade Assist behavior without noting it
- Do not add hidden assumptions without documenting them
- Do not create a silent dependency on a missing backend
- Do not claim uploads or submission work if they are still placeholders

## 8. Completion standard
A task is not complete until:

- code is updated
- architecture doc is updated
- changelog is updated
- plain-English explanation is provided
