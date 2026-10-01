# Rio Bridge Finance — Completion & Demo Data Package

## Included

- Banking dashboard with total account balance, checking, savings, investment, loan balance and pending loan.
- Three customer account types: Earning, Savings and Investment.
- Transfers, deposits, withdrawals, cards, statements, notifications, support and profile settings.
- Loan applications, pending/approved/disbursed/active/paid/rejected/cancelled states, repayment history and next-payment information.
- Admin customer management and finance console.
- Admin loan status controls and account/balance management.
- Payout destination verification and withdrawal lifecycle controls.
- Security hardening migration and historical-statement storage bucket.
- Synthetic demo-bank seed script creating one administrator and two customers with three years of transaction history.

## Demo seed

Run `npm run seed:demo` after setting `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

The seed is idempotent for the named demo users: it updates/replaces their synthetic transaction, loan, beneficiary and notification data so the demo remains repeatable.

See `DEMO_BANK_SETUP.md` for credentials and setup instructions.

## Data range

Synthetic transaction history covers **September 2023 through August 2026** for each demo customer.

## Production boundary

This package is a banking/loan application demo. The included deposits, transfers, withdrawals and loan records are application-level records; no real bank rail, card network, payment processor or crypto custody service is connected by the seed script.
