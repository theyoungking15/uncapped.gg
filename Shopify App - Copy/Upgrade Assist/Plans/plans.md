Yes. That’s the right model.

  What Upgrade Assist should become:

  1. Customer fills out the Upgrade Assist form on your storefront.
  2. The Shopify custom app receives that submission through an app proxy.
  3. The app validates it, uploads files, and creates a used_listing record with status like pending_review.
  4. You review it internally.
  5. If approved, you publish it to the website. (this should be automated in the future.)
  6. If rejected, it stays hidden.

  So the app is not the public listing page itself. It is the secure intake + review pipeline.

  Recommended Setup
  As of April 21, 2026, Shopify’s modern path for a new internal app is the Dev Dashboard. Shopify also notes that starting January 1, 2026, new legacy custom apps can’t be
  created. For this project, I’d use:

  - a custom app in the Shopify Dev Dashboard
  - an app proxy for storefront form submission
  - the Admin API for creating/updating used_listing
  - Shopify Files or staged uploads for photos/proof

  Exact Steps

  1. Create the custom app in Shopify Dev Dashboard.
  2. Install it on your store.
  3. Configure scopes.
      - write_app_proxy
      - read_metaobjects
      - write_metaobjects
      - read_files
      - write_files
      - Only add read_metaobject_definitions / write_metaobject_definitions if the app itself will manage the definition.
  4. Configure one app proxy route.
      - Example public route: /apps/upgrade-assist
      - The theme form will POST to that route, not directly to Admin API.
  5. Build the app backend.
      - Verify the app proxy request is really from Shopify.
      - Read the proxied customer context.
      - Validate the payload.
      - Upload photos / proof files.
      - Create the used_listing entry as pending_review.
  6. Keep your current theme form, but change submit behavior.
      - Right now it only previews locally.
      - Next it should submit to the app proxy endpoint.
  7. Add an internal review workflow.
      - At minimum, review entries in Shopify admin / metaobjects.
      - Better later: add an app admin page for approve / reject / publish.
  8. Add publishing logic.
      - When approved, either:
          - expose approved used_listing entries on a storefront page, or
          - convert approved entries into real products later.
      - I recommend do not auto-create products first. Publish approved used_listing entries first. It’s simpler and safer.

  Best Architecture For Your Case
  Because you already have a used_listing metaobject in Shopify admin, the cleanest first real implementation is:

  - customer submission creates a merchant-owned used_listing entry
  - status starts as pending_review
  - staff changes it to approved or rejected
  - storefront only shows entries with approved

  That is simpler than turning every approved used item into a Shopify product immediately.

  What The App Actually Does
  The app should own:

  - secure submission endpoint
  - file upload handling
  - validation / sanitization
  - metaobject create / update
  - review actions
  - publish / unpublish status changes

  The theme should own:

  - form UI
  - basic client-side validation
  - showing success / error states

  One Important Clarification
  If you want customers to upload photos and proof files, the app is necessary. The theme alone should not do this securely.

  Recommended Phases

  - Phase 1: real submission to app proxy, create pending_review entries
  - Phase 2: internal approve / reject workflow
  - Phase 3: storefront page for approved listings
  - Phase 4: optional conversion of approved listings into normal Shopify products if you ever want cart/checkout behavior

  Sources

  - Create apps using the Dev Dashboard (https://shopify.dev/docs/apps/build/dev-dashboard/create-apps-using-dev-dashboard)
  - Generate access tokens for custom apps (https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/generate-app-access-tokens-admin)
  - About app proxies and dynamic data (https://shopify.dev/docs/apps/build/online-store/app-proxies)
  - Shopify API access scopes (https://shopify.dev/docs/api/usage/access-scopes)
  - Manage metaobject entries (https://shopify.dev/apps/build/metaobjects/manage-metaobjects)
  - About metaobjects (https://shopify.dev/docs/apps/build/custom-data/metaobjects)
  - Staged uploads / file upload flow (https://shopify.dev/docs/api/admin-graphql/2023-07/payloads/StagedUploadsCreatePayload)

  If you want, I can next turn this into a concrete build plan for Phase 1 only: the exact app proxy route, payload shape, scopes, and how your current Upgrade Assist theme
  form should submit to it.