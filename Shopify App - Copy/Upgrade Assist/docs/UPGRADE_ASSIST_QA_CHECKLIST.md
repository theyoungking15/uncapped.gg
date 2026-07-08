# Upgrade Assist MVP. Review Checklist

Use this checklist after Codex finishes the implementation.

## A. Pre-check
- [ ] Theme still loads normally
- [ ] No critical storefront breakage
- [ ] Upgrade Assist page still exists
- [ ] Existing login gate has not been removed

## B. Logged-out behavior
Visit the Upgrade Assist page while logged out.

- [ /] I see the Upgrade Assist page
- [ /] I see the sign-in prompt
- [/ ] I see the create account option if intended
- [ /] I do not see the seller intake form while logged out
- [ /] Clicking sign in follows the expected login flow
- [ /] After login, I return to the correct page

## C. Logged-in behavior
Visit the Upgrade Assist page while logged in.

- [ /] The old placeholder is gone or replaced properly
- [ /] I can see the actual seller intake form
- [ /] The form is visually readable on desktop
- [ /] The form is visually readable on mobile
- [ /] The form is aligned with the theme style
- [ /] The page explains that submissions are reviewed before going public
- [ /] The page does not imply Uncapped PC owns the item

## D. Form sections
Check that the form is split into understandable sections.

- [ /] Item Identification section exists
- [ /] Brand section exists
- [ /] Seller Details section exists
- [ /] Photos and Proof section exists
- [ /] Warranty section exists
- [ /] Contact and Agreement section exists

## E. Item Identification logic
- [ /] Source type selector exists
- [ /] Choosing `catalog_reference` shows product selection behavior
- [ /] Choosing `manual_entry` hides catalog-specific input
- [ /] Choosing `manual_entry` shows manual title / model / product link inputs
- [ /] The field logic is not confusing

## F. Brand handling
- [ /] Brand handling does not rely only on loose text unless needed
- [ /] If brand data is exposed to the page, the form uses it correctly
- [ /] If brand data is not yet exposed, there is a clear fallback field
- [ /] The implementation is structured for later `brand_reference` mapping

## G. Required seller inputs
- [ /] Asking price field exists
- [/ ] Condition field exists
- [/ ] City / region field exists
- [ /] Usage notes field exists
- [ /] Issue disclosures field exists

## H. Photos and proof
- [ /] Photos UI exists
- [/ ] Proof of purchase status field exists
- [/ ] Proof upload only appears when applicable
- [/ ] The UI makes sense even if backend upload is not fully wired yet

## I. Warranty logic
- [/ ] Still in warranty field exists
- [ /] Personal warranty offered field exists
- [ ]/ Personal warranty duration appears only when relevant

## J. Agreement and contact
- [/ ] Contact preference field exists
- [/ ] Seller agreement checkbox exists
- [/ ] The agreement feels explicit enough

## K. Validation
Try submitting incomplete data.

- [ /] Required fields are validated
- [ /] Validation messages are understandable
- [ /] The form does not silently fail
- [ /] Conditional fields do not cause broken validation
- [ /] No obvious console errors appear during normal use


## L. Submission behavior
- [ /] Submission behavior is honest about current capability
- [ ] If backend is not wired, the implementation does not pretend it is live
- [ ] If backend is wired, submission behavior matches what was documented
- [/ ] The form does not instantly create public listings

## M. Theme safety
- [/] No unrelated pages appear broken
- [ /] No global header / footer issues appeared
- [/ ] No cart or checkout behavior was accidentally introduced
- [ /] No second-hand item is accidentally treated like a normal store product

## N. Messaging
- [ /] The page clearly frames Upgrade Assist as help for selling old parts
- [ /] The page does not frame this as a full marketplace
- [/ ] The page does not over-promise outcomes
- [ /] The page clearly suggests review before public approval

## O. Sign-off questions
Answer these before approving the work.

- [ /] Is the page good enough for internal testing?
- [ /] Is the form field order logical?
- [x ] Are any fields missing?
- [ x] Is any section too long or too confusing?
- [ x] Is there any wording that sounds misleading?
- [/ ] Is the implementation ready for backend wiring next?

## Final sign-off
- [ /] Approved for next phase
- [ /] Needs revision before next phase

## Notes
Write issues here:
- on the required details. can you add an * if its required 
- 
- 