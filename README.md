# Agency CRM

A lightweight cold-call CRM built with HTML, CSS, JavaScript, Supabase, and Vercel.

## Connected services

- Supabase project: `Agency Dashboard`
- Supabase project reference: `nvzsmqlznqwxvrdvxrmc`
- Vercel project: `agency-crm`

The Supabase anonymous key used by the browser is a public client key. Database
security is enforced with authentication and row-level security, so each user
can only access calls that belong to their account. Never place a Supabase
service-role key in this repository.

## Run locally

From the project directory:

```sh
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Authentication

Users can create an account or sign in with email and password. If email
confirmation is enabled in Supabase, a newly registered user must confirm their
email before signing in.

For production authentication, add the production Vercel domain to:

`Supabase Dashboard → Authentication → URL Configuration`

## Database

The database migration is stored in:

`supabase/migrations/20260729130000_secure_user_scoped_calls.sql`

It aligns the `calls` table with the frontend and replaces the old shared-access
policy with user-owned row-level security policies.

## Deployment

The repository is connected to the Vercel project `agency-crm`. Production
deployment should be performed only after the local authentication and CRUD
smoke tests pass.
