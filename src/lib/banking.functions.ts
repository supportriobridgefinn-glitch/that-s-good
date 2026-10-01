import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const resolveAccountLogin = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({ account_number: z.string().regex(/^\d{6,20}$/) }).parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const profile = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("account_number", data.account_number)
      .maybeSingle();
    if (!profile.data?.email) throw new Error("Account not found");
    return { email: profile.data.email };
  });

// Validate the customer's 4-digit PIN (second-factor after password).
export const validatePin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ pin: z.string().regex(/^\d{4,6}$/) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cutoff = new Date(Date.now() - 15 * 60_000).toISOString();
    const attempts = await (supabaseAdmin.from("pin_verification_attempts" as never) as any)
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.userId)
      .eq("succeeded", false)
      .gte("created_at", cutoff);
    if ((attempts.count ?? 0) >= 5)
      throw new Error("Too many incorrect PIN attempts. Try again in 15 minutes");
    const profile = await supabaseAdmin
      .from("profiles")
      .select("status")
      .eq("id", context.userId)
      .maybeSingle();
    if (profile.error || !profile.data) throw new Error("Profile not found");
    if (profile.data.status !== "active") throw new Error("Account is not active");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cmp = await (supabaseAdmin.rpc as any)("verify_pin", {
      _user_id: context.userId,
      _pin: data.pin,
    });
    if (cmp.error) throw new Error(cmp.error.message);
    await (supabaseAdmin.from("pin_verification_attempts" as never) as any).insert({
      user_id: context.userId,
      succeeded: Boolean(cmp.data),
    });
    if (!cmp.data) throw new Error("Incorrect PIN");
    await (supabaseAdmin.from("pin_verification_attempts" as never) as any)
      .delete()
      .eq("user_id", context.userId)
      .eq("succeeded", false);
    return { ok: true };
  });

async function requireAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const r = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!r.data) throw new Error("Forbidden");
}

const CreateCustomerInput = z.object({
  first_name: z.string().min(1).max(80),
  middle_name: z.string().max(80).default(""),
  last_name: z.string().min(1).max(80),
  date_of_birth: z.string().optional().default(""),
  email: z.string().email().optional().or(z.literal("")).default(""),
  phone: z.string().max(40).default(""),
  street: z.string().max(200).default(""),
  city: z.string().max(80).default(""),
  state: z.string().max(80).default(""),
  zip: z.string().max(20).default(""),
  country: z.string().max(80).default(""),
  account_number: z.string().regex(/^\d{6,12}$/),
  routing_number: z.string().max(20).default(""),
  account_type: z.string().max(80).default("Checking Account"),
  currency: z.string().max(80).default("USD"),
  password: z.string().min(6).max(72),
  pin: z.string().regex(/^\d{4,6}$/),
  marital_status: z.string().max(40).default("Single"),
  occupation: z.string().max(120).default(""),
  employer: z.string().max(120).default(""),
  annual_income: z.number().min(0).default(0),
  card_type: z.string().max(40).default(""),
  card_network: z.string().max(40).default(""),
  card_last4: z.string().max(8).default(""),
  card_expiry: z.string().max(10).default(""),
  opened_date: z.string().optional().default(""),
  opening_balance: z.number().default(0),
  checking_balance: z.number().default(0),
  savings_balance: z.number().min(0).default(0),
  loans_balance: z.number().min(0).default(0),
  btc_balance: z.number().min(0).default(0),
});

export const adminCreateCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => CreateCustomerInput.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email || `acct-${data.account_number}@riobridge.internal`;
    const created = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: `${data.first_name} ${data.last_name}`.trim(),
        account_number: data.account_number,
      },
    });
    if (created.error || !created.data.user)
      throw new Error(created.error?.message || "createUser failed");
    const newId = created.data.user.id;

    await supabaseAdmin.from("user_roles").insert({ user_id: newId, role: "customer" });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pinHash = await (supabaseAdmin.rpc as any)("hash_pin", { _pin: data.pin });
    if (pinHash.error) throw new Error(pinHash.error.message);

    const profile: Record<string, unknown> = {
      id: newId,
      full_name: `${data.first_name} ${data.last_name}`.trim(),
      first_name: data.first_name,
      middle_name: data.middle_name,
      last_name: data.last_name,
      email: data.email || "",
      phone: data.phone,
      address: [data.street, data.city, data.state, data.zip, data.country]
        .filter(Boolean)
        .join(", "),
      city: data.city,
      state: data.state,
      zip: data.zip,
      country: data.country,
      marital_status: data.marital_status,
      occupation: data.occupation,
      employer: data.employer,
      annual_income: data.annual_income,
      account_number: data.account_number,
      routing_number: data.routing_number,
      account_type: data.account_type,
      currency: data.currency,
      pin_hash: pinHash.data as string,
      status: "active",
      opening_balance: data.opening_balance || data.checking_balance,
      checking_balance: data.checking_balance,
      savings_balance: data.savings_balance,
      loans_balance: data.loans_balance,
      btc_balance: data.btc_balance,
      card_type: data.card_type,
      card_network: data.card_network,
      card_last4: data.card_last4,
      card_expiry: data.card_expiry,
      btc_deposit_address: `bc1q${newId.replace(/-/g, "").slice(0, 32)}`,
    };
    if (data.date_of_birth) profile.date_of_birth = data.date_of_birth;
    if (data.opened_date) profile.opened_date = data.opened_date;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from("profiles") as any).upsert(profile);
    return { ok: true, id: newId };
  });

export const adminDeleteCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ user_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const del = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (del.error) throw new Error(del.error.message);
    return { ok: true };
  });

export const adminResetCredentials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        user_id: z.string().uuid(),
        new_password: z.string().min(6).max(72).optional(),
        new_pin: z
          .string()
          .regex(/^\d{4,6}$/)
          .optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.new_password) {
      const up = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
        password: data.new_password,
      });
      if (up.error) throw new Error(up.error.message);
    }
    if (data.new_pin) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const h = await (supabaseAdmin.rpc as any)("hash_pin", { _pin: data.new_pin });
      if (h.error) throw new Error(h.error.message);
      const up = await supabaseAdmin
        .from("profiles")
        .update({ pin_hash: h.data as string })
        .eq("id", data.user_id);
      if (up.error) throw new Error(up.error.message);
    }
    return { ok: true };
  });

// One-click admin: seed the "Christian Keyes" premium demo customer + 2026 transactions.
export const seedChristianKeyes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const accountNumber = "93264301743";
    const email = `acct-${accountNumber}@riobridge.internal`;

    // Skip if already exists
    const existing = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("account_number", accountNumber)
      .maybeSingle();
    if (existing.data) return { ok: true, id: existing.data.id, already: true };

    const created = await supabaseAdmin.auth.admin.createUser({
      email,
      password: "Lag2026",
      email_confirm: true,
      user_metadata: {
        full_name: "Christian Keyes",
        account_number: accountNumber,
        avatar_emoji: "🙍‍♂️",
        otp: "0033",
      },
    });
    if (created.error || !created.data.user)
      throw new Error(created.error?.message || "createUser failed");
    const id = created.data.user.id;

    await supabaseAdmin.from("user_roles").insert({ user_id: id, role: "customer" });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pinHash = await (supabaseAdmin.rpc as any)("hash_pin", { _pin: "2026" });

    await supabaseAdmin.from("profiles").upsert({
      id,
      full_name: "Christian Keyes",
      first_name: "Christian",
      middle_name: "",
      last_name: "Keyes",
      date_of_birth: "1988-04-17",
      email: "christiankeyes02@gmail.com",
      phone: "+1 (402) 904-0180",
      address: "2346 Birkdale St, Los Angeles, CA 90031, USA",
      city: "Los Angeles",
      state: "CA",
      zip: "90031",
      country: "United States of America",
      marital_status: "Single",
      occupation: "Investor",
      employer: "Self-employed",
      annual_income: 750000,
      account_number: accountNumber,
      routing_number: "021064293",
      account_type: "Checking Account",
      currency: "USD",
      pin_hash: pinHash.data as string,
      status: "active",
      opening_balance: 870000,
      checking_balance: 870000,
      savings_balance: 15000000,
      loans_balance: 0,
      btc_balance: 78.5, // ≈ $5,500,000 crypto holdings
      card_type: "Debit",
      card_network: "Visa",
      card_last4: "4821",
      card_expiry: "2029-08",
      opened_date: "2015-05-12",
      btc_deposit_address: `bc1q${id.replace(/-/g, "").slice(0, 32)}`,
    });

    // Seed 2026 transactions (Jan 1 → May 29, 2026). Synthetic, balance-realistic.
    type Tx = { date: string; description: string; type: "Credit" | "Debit"; amount: number };
    const sample: Tx[] = [];
    const start = new Date("2026-01-01T09:00:00Z").getTime();
    const end = new Date("2026-05-29T17:00:00Z").getTime();
    const credits = [
      "Payroll Deposit",
      "Wire Transfer In",
      "Refund",
      "Dividend",
      "Interest Earned",
      "Vendor Payment In",
    ];
    const debits = [
      "Online Retail Purchase",
      "Utility Bill Payment",
      "Grocery Store",
      "Restaurant",
      "ATM Withdrawal",
      "Subscription",
      "Insurance Premium",
      "Card Payment",
      "Fuel",
    ];
    // Deterministic but varied
    let i = 1000;
    for (let t = start; t <= end; t += 1000 * 60 * 60 * 24 * 3) {
      const isCredit = i % 4 === 0;
      const desc = isCredit ? credits[i % credits.length] : debits[i % debits.length];
      const amt = isCredit ? 4800 + (i % 7) * 200 : 25 + (i % 17) * 11;
      sample.push({
        date: new Date(t).toISOString(),
        description: desc,
        type: isCredit ? "Credit" : "Debit",
        amount: Number(amt.toFixed(2)),
      });
      i++;
    }

    // Compute running balance and clamp to current
    const rows = sample.map((s) => ({
      user_id: id,
      type: "local",
      direction: s.type === "Credit" ? "credit" : "debit",
      account: "checking",
      amount: s.amount,
      currency: "USD",
      counterparty: { name: s.description },
      memo: s.description,
      status: "completed",
      created_at: s.date,
    }));
    if (rows.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin.from("transactions") as any).insert(rows);
    }
    return { ok: true, id, seeded: rows.length };
  });

// Seed 2026 transactions for the existing demo user (1000000001) on demand
export const seedDemoTransactions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ user_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const existing = await supabaseAdmin
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", data.user_id);
    if ((existing.count ?? 0) > 5) return { ok: true, skipped: true };
    const rows: Record<string, unknown>[] = [];
    const start = new Date("2026-01-01T09:00:00Z").getTime();
    const end = new Date("2026-05-29T17:00:00Z").getTime();
    let i = 1;
    for (let t = start; t <= end; t += 1000 * 60 * 60 * 24 * 5) {
      const isCredit = i % 3 === 0;
      rows.push({
        user_id: data.user_id,
        type: "local",
        direction: isCredit ? "credit" : "debit",
        account: "checking",
        amount: isCredit ? 2500 + i * 50 : 30 + (i % 19) * 7,
        currency: "USD",
        counterparty: { name: isCredit ? "Payroll" : "Merchant Purchase" },
        memo: isCredit ? "Payroll Deposit" : "Card Purchase",
        status: "completed",
        created_at: new Date(t).toISOString(),
      });
      i++;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from("transactions") as any).insert(rows);
    return { ok: true, seeded: rows.length };
  });

const UpdateProfileInput = z.object({
  user_id: z.string().uuid(),
  patch: z.record(z.string(), z.unknown()),
});
export const adminUpdateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => UpdateProfileInput.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const up = await (supabaseAdmin.from("profiles") as any)
      .update(data.patch)
      .eq("id", data.user_id);
    if (up.error) throw new Error(up.error.message);
    if (data.patch.checking_balance !== undefined) {
      await (supabaseAdmin.from("user_accounts") as any).update({ available_balance: Number(data.patch.checking_balance) }).eq("user_id", data.user_id).eq("kind", "earning");
    }
    if (data.patch.savings_balance !== undefined) {
      await (supabaseAdmin.from("user_accounts") as any).update({ available_balance: Number(data.patch.savings_balance) }).eq("user_id", data.user_id).eq("kind", "savings");
    }
    if (data.patch.loans_balance !== undefined) {
      await (supabaseAdmin.from("loans") as any).update({ outstanding_principal: Number(data.patch.loans_balance) }).eq("user_id", data.user_id).in("status", ["approved", "disbursed", "active"]);
    }
    if (typeof data.patch.email === "string" && data.patch.email.trim()) {
      const authUpdate = await supabaseAdmin.auth.admin.updateUserById(data.user_id, { email: data.patch.email.trim(), email_confirm: true });
      if (authUpdate.error) throw new Error(authUpdate.error.message);
    }
    return { ok: true };
  });

// Import the parsed Rio Bridge Finance historical transactions PDF for a customer.
// Replaces existing transactions for that user, then sets balance to target_balance.
export const importHistoricalTransactions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        user_id: z.string().uuid(),
        target_balance: z.number().default(12521922.33),
        replace: z.boolean().default(true),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const history = (await import("@/data/history-pdf.json")).default as Array<{
      date: string;
      type: string;
      counterparty: string;
      amount: number;
      direction: "credit" | "debit";
      status: "completed" | "cancelled";
    }>;

    if (data.replace) {
      await supabaseAdmin.from("transactions").delete().eq("user_id", data.user_id);
    }

    const rows = history.map((h) => ({
      user_id: data.user_id,
      type:
        h.type === "Wire Transfer"
          ? "wire"
          : h.type === "Domestic Transfer"
            ? "domestic"
            : "internal",
      direction: h.direction,
      account: "checking",
      amount: h.amount,
      currency: "USD",
      counterparty: { name: h.counterparty, bank: "Capital One" },
      memo: `${h.type} — ${h.counterparty}`,
      status: h.status,
      created_at: h.date,
    }));

    // Chunk inserts (Postgres / PostgREST friendly)
    const chunk = 500;
    for (let i = 0; i < rows.length; i += chunk) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ins = await (supabaseAdmin.from("transactions") as any).insert(
        rows.slice(i, i + chunk),
      );
      if (ins.error) throw new Error(ins.error.message);
    }

    const netCompleted = rows
      .filter((r) => r.status === "completed")
      .reduce((s, r) => s + (r.direction === "credit" ? r.amount : -r.amount), 0);
    const opening = Number((data.target_balance - netCompleted).toFixed(2));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from("profiles") as any)
      .update({ opening_balance: opening, checking_balance: data.target_balance })
      .eq("id", data.user_id);

    return {
      ok: true,
      inserted: rows.length,
      opening_balance: opening,
      current_balance: data.target_balance,
    };
  });

// Duplicate an existing customer: copies the profile and all transactions verbatim,
// only changing identity fields the database forces to be unique (auth user id,
// auth email, account_number) plus a fresh password and PIN supplied by the admin.
const DuplicateInput = z.object({
  source_user_id: z.string().uuid(),
  new_account_number: z.string().regex(/^\d{6,12}$/),
  new_auth_email: z.string().email().optional(),
  new_password: z.string().min(6).max(72),
  new_pin: z.string().regex(/^\d{4,6}$/),
});
export const adminDuplicateCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => DuplicateInput.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const src = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", data.source_user_id)
      .maybeSingle();
    if (src.error || !src.data) throw new Error("Source customer not found");

    const exists = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("account_number", data.new_account_number)
      .maybeSingle();
    if (exists.data) throw new Error("Account number already in use");

    const authEmail = data.new_auth_email || (typeof src.data.email === "string" && src.data.email ? src.data.email : `acct-${data.new_account_number}@riobridge.internal`);
    const created = await supabaseAdmin.auth.admin.createUser({
      email: authEmail,
      password: data.new_password,
      email_confirm: true,
      user_metadata: {
        full_name: (src.data as { full_name: string }).full_name,
        account_number: data.new_account_number,
      },
    });
    if (created.error || !created.data.user)
      throw new Error(created.error?.message || "createUser failed");
    const newId = created.data.user.id;

    await supabaseAdmin.from("user_roles").insert({ user_id: newId, role: "customer" });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pinHash = await (supabaseAdmin.rpc as any)("hash_pin", { _pin: data.new_pin });
    if (pinHash.error) throw new Error(pinHash.error.message);

    // Copy every field from source profile, override identity fields only.
    const srcRow = src.data as Record<string, unknown>;
    const newProfile: Record<string, unknown> = { ...srcRow };
    newProfile.id = newId;
    newProfile.account_number = data.new_account_number;
    newProfile.pin_hash = pinHash.data as string;
    newProfile.btc_deposit_address = `bc1q${newId.replace(/-/g, "").slice(0, 32)}`;
    delete newProfile.created_at;
    delete newProfile.updated_at;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const upProfile = await (supabaseAdmin.from("profiles") as any).upsert(newProfile);
    if (upProfile.error) throw new Error(upProfile.error.message);

    // Copy transactions verbatim (amounts, dates, memos, status, counterparty, type, direction).
    const txns = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("user_id", data.source_user_id);
    if (txns.error) throw new Error(txns.error.message);
    const rows = (txns.data ?? []).map((t: Record<string, unknown>) => {
      const r = { ...t };
      delete r.id;
      r.user_id = newId;
      return r;
    });
    let inserted = 0;
    if (rows.length) {
      const chunk = 500;
      for (let i = 0; i < rows.length; i += chunk) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ins = await (supabaseAdmin.from("transactions") as any).insert(
          rows.slice(i, i + chunk),
        );
        if (ins.error) throw new Error(ins.error.message);
        inserted += rows.slice(i, i + chunk).length;
      }
    }
    return { ok: true, id: newId, auth_email: authEmail, transactions_copied: inserted };
  });


const LoanApplicationInput = z.object({
  amount: z.number().positive().max(1_000_000),
  purpose: z.string().min(3).max(200),
  term_months: z.number().int().min(3).max(84),
});

/** Customer loan application. Applications enter pending state; only admins can approve/disburse. */
export const applyForLoan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => LoanApplicationInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const existing = await supabaseAdmin
      .from("loans")
      .select("id")
      .eq("user_id", context.userId)
      .eq("status", "pending")
      .limit(1);
    if ((existing.data ?? []).length) throw new Error("You already have a pending loan application");
    const ref = `RBF-${Date.now().toString(36).toUpperCase()}`;
    const created = await (supabaseAdmin.from("loans") as any)
      .insert({
        user_id: context.userId,
        principal: Number(data.amount.toFixed(2)),
        outstanding_principal: 0,
        total_repayment: 0,
        monthly_payment: 0,
        status: "pending",
        purpose: data.purpose,
        term_months: data.term_months,
        interest_rate: 9.5,
        application_reference: ref,
      })
      .select("id,principal,status,application_reference")
      .single();
    if (created.error) throw new Error(created.error.message);
    await (supabaseAdmin.from("notifications") as any).insert({
      user_id: context.userId,
      title: "Loan application received",
      body: `Application ${ref} for ${data.amount.toFixed(2)} is now under review.`,
      kind: "info",
      link: "/loans",
    });
    return created.data;
  });

export const getLoanOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [loans, payments] = await Promise.all([
      (supabaseAdmin.from("loans") as any)
        .select("*")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false }),
      (supabaseAdmin.from("loan_payments") as any)
        .select("*")
        .eq("user_id", context.userId)
        .order("payment_date", { ascending: false })
        .limit(50),
    ]);
    const rows = loans.data ?? [];
    const active = rows
      .filter((l: any) => ["approved", "disbursed", "active"].includes(l.status))
      .reduce((sum: number, l: any) => sum + Number(l.outstanding_principal ?? l.principal ?? 0), 0);
    const pending = rows
      .filter((l: any) => ["pending", "under_review"].includes(l.status))
      .reduce((sum: number, l: any) => sum + Number(l.principal ?? 0), 0);
    return { loans: rows, payments: payments.data ?? [], active_balance: active, pending_amount: pending };
  });

export const adminSetLoanStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      loan_id: z.string().uuid(),
      status: z.enum(["pending", "under_review", "approved", "disbursed", "active", "paid", "rejected", "cancelled"]),
      approved_amount: z.number().positive().max(1_000_000).optional(),
      interest_rate: z.number().min(0).max(100).optional(),
      monthly_payment: z.number().min(0).max(1_000_000).optional(),
      note: z.string().max(300).default(""),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const current = await (supabaseAdmin.from("loans") as any).select("*").eq("id", data.loan_id).maybeSingle();
    if (current.error || !current.data) throw new Error("Loan not found");
    const loan = current.data;
    const amount = Number(data.approved_amount ?? loan.principal);
    const patch: Record<string, unknown> = { status: data.status };
    if (data.approved_amount !== undefined) patch.principal = amount;
    if (data.interest_rate !== undefined) patch.interest_rate = data.interest_rate;
    if (data.monthly_payment !== undefined) patch.monthly_payment = data.monthly_payment;
    if (data.status === "approved") patch.approved_at = new Date().toISOString();
    if (["disbursed", "active"].includes(data.status)) {
      patch.disbursed_at = loan.disbursed_at ?? new Date().toISOString();
      patch.outstanding_principal = Number(loan.outstanding_principal || amount);
      patch.total_repayment = Number(loan.total_repayment || amount);
      patch.next_payment_date = loan.next_payment_date ?? new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    }
    if (data.status === "paid") patch.outstanding_principal = 0;
    const upd = await (supabaseAdmin.from("loans") as any).update(patch).eq("id", data.loan_id);
    if (upd.error) throw new Error(upd.error.message);
    await (supabaseAdmin.rpc as any)("refresh_profile_loan_balance", { _user_id: loan.user_id });
    await (supabaseAdmin.from("notifications") as any).insert({
      user_id: loan.user_id,
      title: `Loan ${data.status.replaceAll("_", " ")}`,
      body: data.note || `Your loan application ${loan.application_reference || ""} is now ${data.status.replaceAll("_", " ")}.`,
      kind: data.status === "rejected" ? "warning" : "info",
      link: "/loans",
    });
    return { ok: true };
  });
