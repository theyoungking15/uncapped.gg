# Uncapped.gg Website Handoff

## Where The Website Project Is

The website/SaaS project is separate from the Shopify workspace.

Open and run Codex in this folder:

```powershell
cd "C:\Users\Prince\Desktop\Apps\uncapped.gg"
```

Current Shopify workspace you were just in:

```powershell
C:\Users\Prince\Desktop\Apps\Shopify App
```

That Shopify workspace is for the existing Shopify app, PC Builder theme files, My Builds, and Upgrade Assist. Do not build the new Uncapped.gg website inside the Shopify workspace.

## What We Are Trying To Build

Uncapped.gg is a standalone Next.js + Supabase website for a multi-shop PC sales system.

Release 1 goal:

- shop owner login
- shop profile setup
- admin dashboard
- import products from a Google Sheets published CSV URL
- public shop profile page
- public price list page
- quote request form for customers
- quote inbox for shop owners
- Facebook Page and Messenger contact links

Later phases, not Release 1:

- PC Builder
- compatibility rules
- shop branding customization
- shareable build links
- bundle/promo logic
- FPS Finder
- delivery/map APIs
- deeper Shopify integration

## Where We Are Right Now

The initial website scaffold already exists in:

```powershell
C:\Users\Prince\Desktop\Apps\uncapped.gg
```

Already done:

- Next.js app created.
- Supabase client helpers added.
- Login by Supabase email magic link added.
- Admin pages added for dashboard, settings, imports, products, and quotes.
- Public pages added for `/shop/[slug]` and `/shop/[slug]/pricelist`.
- Google Sheets CSV import logic added.
- Quote request and quote status actions added.
- Initial Supabase migration added at `supabase/migrations/202607030001_initial_schema.sql`.
- Local checks previously passed: install, typecheck, lint, build, and audit.

Still needed before real testing:

- Create/fill `.env.local`.
- Add the missing Supabase project URL.
- Run the Supabase SQL migration in the Supabase project.
- Start the dev server and test the login/import/quote flow.

## Environment Variables Needed

The website expects this file:

```powershell
C:\Users\Prince\Desktop\Apps\uncapped.gg\.env.local
```

Use `.env.example` as the template:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

You already had:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The missing one is:

- `NEXT_PUBLIC_SUPABASE_URL`

Find it in Supabase:

Supabase Dashboard -> your project -> Project Settings -> API/Data API -> Project URL

It should look like:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
```

Important:

- Do not put `SUPABASE_SERVICE_ROLE_KEY` in frontend/browser code.
- Keep it only in `.env.local` on the server side.
- Since the service role key was pasted into chat earlier, rotate it in Supabase before using this for production.

## What To Tell Codex When You Open The Website Folder

After opening Codex in:

```powershell
C:\Users\Prince\Desktop\Apps\uncapped.gg
```

You can say:

```text
Read NEXT_STEPS.md and uncappedgg.md. Help me finish setup for the Uncapped.gg Release 1 website. First check the current files, then guide me through .env.local, Supabase migration, and running the app locally.
```

## Manual Setup Steps

From the website folder:

```powershell
cd "C:\Users\Prince\Desktop\Apps\uncapped.gg"
```

Create `.env.local` from `.env.example`, then fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`

Then run the migration in Supabase:

```text
supabase/migrations/202607030001_initial_schema.sql
```

After that, run:

```powershell
npm run dev
```

Open:

```text
http://localhost:3000
```

## Main Testing Flow

Once the app is running:

1. Go to `/login`.
2. Sign in with email magic link.
3. Go to `/app/settings` and create a shop profile.
4. Publish a Google Sheet as CSV.
5. Paste the CSV URL in `/app/imports`.
6. Check imported products in `/app/products`.
7. Open the public shop page at `/shop/[your-slug]`.
8. Open the public price list at `/shop/[your-slug]/pricelist`.
9. Submit a customer quote request.
10. Review the quote in `/app/quotes`.

## If You Are Lost

Use this rule:

- Shopify app / PC Builder / My Builds work: `C:\Users\Prince\Desktop\Apps\Shopify App`
- New Uncapped.gg website/SaaS work: `C:\Users\Prince\Desktop\Apps\uncapped.gg`

