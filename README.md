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

Users create an account and sign in with a username and password. The browser
maps the username to a reserved, non-deliverable internal identifier so users
never enter or receive email. Supabase email confirmation must be disabled for
new accounts to receive a session immediately.

Usernames are case-insensitive, must be 3–24 characters, and may contain
letters, numbers, and underscores. Because accounts have no real email address,
email-based password recovery is intentionally unavailable.

CRM records belong to one shared workspace. Approved members use separate
accounts but can view, add, edit, and delete the same call records. Creating an
account does not automatically grant access to the shared workspace.

The Call Queue is also shared across workspace members. It stores a company,
phone number, short website note, and low/medium/high priority in a compact
table. Starting a queued call pre-fills the existing call form.

For production authentication, add the production Vercel domain to:

`Supabase Dashboard → Authentication → URL Configuration`

## Database

The database migration is stored in:

`supabase/migrations/20260729130000_secure_user_scoped_calls.sql`

`supabase/migrations/20260731123000_add_shared_workspace.sql`

`supabase/migrations/20260801092123_add_call_queue.sql`

`supabase/migrations/20260801092347_index_call_queue_user.sql`

`supabase/migrations/20260801104000_add_queue_email_and_completion.sql`

The migrations align the `calls` table with the frontend, enable row-level
security, and restrict the shared CRM workspace to approved members.

## Deployment

The repository is connected to the Vercel project `agency-crm`. Production
deployment should be performed only after the local authentication and CRUD
smoke tests pass.
