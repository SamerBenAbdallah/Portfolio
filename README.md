# Player01 — Arcade Portfolio + Supabase CMS

Samer Ben Abdallah's existing interactive arcade portfolio, now prepared for database-driven project management with Supabase. The original intro, cabinet, music, animations, project grids, modal previews, navigation, responsive layout, and pixel-art visual system remain intact.

## What changed

- Public projects load from Supabase when it is configured.
- Only rows with `published = true` are public, ordered by `display_order`.
- The preserved local project catalog remains an automatic fallback when Supabase is not configured or temporarily unavailable.
- Every published project has a dynamic route at `/projects/[slug]`.
- `/admin` provides authenticated create, edit, delete, publish, feature, reorder, and media-upload controls.
- Uploads use the public `project-media` bucket with admin-only write policies.
- Replaced/deleted Supabase media is cleaned up by the admin API when it is no longer referenced by that project.

## Local development

Requirements: Node.js 22.13 or newer and pnpm.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Without environment values, the public portfolio still runs from `app/data/local-projects.ts`; `/admin` shows a setup guide.

## Supabase setup

1. Create a Supabase project.
2. Open **SQL Editor** and run the files in [`supabase/migrations/`](supabase/migrations/) in filename order. This creates:
   - `projects`
   - `admin_users`
   - `admin_emails`
   - Row Level Security policies
   - `project-media` Storage bucket and policies
3. Run [`supabase/seed.sql`](supabase/seed.sql) to import the current 11 graphic and motion project groups in their existing order.
4. Add the email that may manage the portfolio:

```sql
insert into public.admin_emails (email)
values (lower('YOUR_ADMIN_EMAIL'));
```

5. In **Authentication → URL Configuration**, set the Site URL to the production domain and allow its `/auth/callback` route.
6. In **Project Settings → API**, copy the project URL and publishable/anon key into `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

7. Restart `pnpm dev`, then request a one-time email sign-in link at [http://localhost:3000/admin](http://localhost:3000/admin).

The browser-visible anon key is expected. Authorization is enforced by Row Level Security. Never add a Supabase service-role key to this repository or any `NEXT_PUBLIC_` variable.

## Vercel

Add the same two environment variables to the Vercel project for Production, Preview, and Development. Redeploy after saving them. No service-role secret is required.

## Project model

The schema contains all requested fields plus a few presentation fields needed to preserve the existing site:

- Requested: title, slug, descriptions, category, cover, gallery, video URL, Behance/external links, tools, year, client, featured, published, ordering, and timestamps.
- Compatibility: `project_type`, `video_items`, `deliverables`, `accent`, `secondary`, and `longform` preserve the current graphic/motion layouts, grouped playlists, card colors, and long scrolling Khanfes Danfes case study.

New uploads are stored in Supabase Storage. Seeded media initially uses the existing repository URLs so the migration is non-destructive; replace any seeded media from `/admin` whenever you want it moved into Supabase Storage.

## Commands

```bash
pnpm dev             # local development
pnpm build           # vinext/Cloudflare-compatible build
pnpm vercel-build    # production Next.js build used by Vercel
pnpm lint            # ESLint
pnpm test            # build and rendered-output checks
```

## Relevant files

- `app/lib/projects/` — project types, mapping, queries, and admin authorization
- `app/lib/supabase/` — browser/server Supabase clients
- `app/admin/` — private CMS UI
- `app/api/admin/projects/route.ts` — authenticated CRUD and media cleanup
- `app/projects/[slug]/` — public project pages
- `supabase/migrations/` — database, RLS, and Storage setup
- `supabase/seed.sql` — current portfolio migration data
