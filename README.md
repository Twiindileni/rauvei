# RauVei Boutique

This project is the React/Node migration of RauVei Fashion Boutique using Next.js App Router with Supabase foundations for blog publishing and a future admin dashboard.

## Tech Stack

- Next.js (App Router)
- React + TypeScript
- Supabase (Auth, Postgres, RLS)

## Project Structure

- `app/page.tsx`: Main storefront (Navbar, Hero, Products, About, Contact, Footer)
- `app/api/contact/route.ts`: Contact form API endpoint
- `app/blog/page.tsx`: Public blog list
- `app/blog/[slug]/page.tsx`: Public blog detail page
- `app/(admin)/admin/*`: Admin route scaffold for future dashboard UI
- `lib/supabase/*`: Browser/server/admin Supabase clients
- `supabase/migrations/*`: SQL schema + RLS policies

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Notes:
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and should never be exposed in frontend code.
- Contact API writes to `contact_messages` using the service role key.

## Supabase Setup

Run the SQL migration in your Supabase SQL editor:

`supabase/migrations/20260410_initial_schema.sql`

This migration creates:
- `profiles` table with `role` (`viewer` or `admin`)
- `blog_posts` table for admin-posted blog content
- `contact_messages` table for contact form submissions
- RLS policies for public blog read and admin blog management

## Development

Install dependencies:

```bash
npm install
```

Start local dev:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Admin Designation (Later)

After a user signs up in Supabase Auth, promote them to admin by updating `profiles.role = 'admin'` for that user ID.

## Future Admin Dashboard Build

Planned expansion in `/admin`:
- list/search/filter posts
- create/edit rich blog content
- upload cover images
- publish/unpublish workflow
- delete with confirmation safeguards
