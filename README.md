# Remix of Remix of Project Lovable Completion

I uploaded the complete project ZIP. Do not rebuild it from scratch. Continue and finish the existing codebase using its current files, architecture, UI, branding, routing, database, authentication, and functionality.

Before changing anything, inspect the entire project to identify its framework, structure, existing pages/components, migrations/tables, authentication, implemented features, incomplete/mocked/broken functionality, and files requiring changes.

Constraints

* Preserve existing design and functionality.
* Do not replace the project with a template.
* Do not unnecessarily recreate pages/components.
* Do not remove functionality or create duplicate files.
* Complete the existing implementation and connect it to the existing backend/database.
* Reuse existing tables and migrations; create only genuinely missing migrations.
* Use existing Supabase/database configuration and ensure relationships and RLS are correct.
* Make seeds, migrations, provisioning, and deployments idempotent.

Required banking functionality

Complete:

* Customer and admin authentication
* Customer dashboard
* Account and available balances
* Loan and pending-loan balances
* Transactions and history
* Transfers, deposits, and withdrawals
* Loan applications, approval/rejection, and repayment
* Customer profiles and notifications
* Admin customer, transaction, and loan management

All meaningful operations must persist, and balances must reflect transactions.

Required accounts

Support exactly one admin and these customers through the existing authentication system:

* Admin: admin@example.com
* Daniel Brooks: daniel.brooks@example.com
* Sophia Bennett: sophia.bennett@example.com

Use existing passwords when configured. If missing, set fixed passwords only through secure server-side authentication/seed configuration; never generate random or changing passwords. Do not create a super-admin role.

Passwords must remain unchanged across startup, seeding, migrations, deployments, and logins unless an authorized password-change flow is used. Provision accounts only when missing; never overwrite existing passwords. Store passwords only in the secure authentication provider. Never place plaintext passwords, password fields, service-role keys, or secrets in frontend code, public files, profile tables, logs, API responses, or client-side storage. Do not create a second authentication system.

Security

Ensure:

* Protected pages require authentication.
* Customers cannot access admin pages or other customers’ financial data.
* Admin authorization is enforced server-side/database-side, not only in frontend navigation.
* Passwords are handled only by the secure provider and are never logged or returned.
* Secrets are never exposed client-side.

Do not leave fake functionality behind a finished-looking UI: transfers, loans, approvals, repayments, transactions, balances, profiles, and notifications must perform real database operations.

Verification

After implementation:

* Run the production build.
* Fix TypeScript, import, route, runtime, and responsive-layout issues.
* Verify customer/admin flows and database persistence.
* Confirm repeated startup, seeding, migration, and deployment do not change existing passwords.

Finish the uploaded project; do not redesign or rebuild it. Modify or create only files necessary to complete the existing implementation.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/64c959e4-5cdf-408b-9b63-834d10f4e3e9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Running on Netlify

Rio Bridge Finance is a TanStack Start (React 19, Vite 7, Tailwind 4) banking app backed by Supabase for auth and data. It deploys to Netlify through `@netlify/vite-plugin-tanstack-start`, which turns server routes and server functions into Netlify Functions.

- Build command: `vite build` · Publish directory: `dist/client` (see `netlify.toml`)
- Local development: `npm install` then `netlify dev` (or `npm run dev`)

### Environment variables

The public Supabase URL and publishable key ship in `.env` and are used on both client and server. Set the following in **Netlify → Project configuration → Environment variables**:

| Variable | Required | Purpose |
| --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only key used by banking, transfer, and admin server functions. Never expose it client-side. |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | Optional | Override the public values from `.env` on the server. |
| `LOVABLE_CRON_SECRET` | Only for cron endpoints | Bearer secret checked by `src/integrations/supabase/cron-auth.ts`. |

AI loan guidance uses Netlify AI Gateway, which injects `OPENAI_API_KEY`/`OPENAI_BASE_URL` automatically after the first production deploy.
