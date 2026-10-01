import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* eslint-disable @typescript-eslint/no-explicit-any */

const TransferInput = z.object({
  from: z.enum(["earning", "savings"]),
  to: z.enum(["earning", "savings"]),
  amount: z.number().positive().max(1_000_000_000),
  note: z.string().max(300).default(""),
  idempotency_key: z.string().min(8).max(120),
});

const PayoutInput = z.object({
  kind: z.enum([
    "bank_transfer",
    "ach",
    "wire",
    "bitcoin",
    "paypal",
    "venmo",
    "card",
    "cashapp",
    "other",
  ]),
  label: z.string().max(80).default(""),
  destination: z.string().min(4).max(200),
});

const WithdrawInput = z.object({
  payout_method_id: z.string().uuid(),
  amount: z.number().positive().max(1_000_000_000),
  idempotency_key: z.string().min(8).max(120),
});

function mask(kind: string, dest: string) {
  const s = dest.trim();
  if (kind === "paypal" && s.includes("@")) {
    const [u, d] = s.split("@");
    return `${u.slice(0, 1)}${"•".repeat(Math.max(u.length - 1, 3))}@${d}`;
  }
  if (s.length <= 8) return `••••${s.slice(-2)}`;
  return `${s.slice(0, 4)}••••${s.slice(-4)}`;
}

/** All three accounts + recent ledger + investment positions for the signed-in user. */
export const getFinanceOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const uid = context.userId;
    await (supabaseAdmin.rpc as any)("ensure_user_accounts", { _user_id: uid });
    const [accounts, ledger, positions, withdrawals] = await Promise.all([
      (supabaseAdmin.from("user_accounts") as any).select("*").eq("user_id", uid),
      (supabaseAdmin.from("ledger_entries") as any)
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(100),
      (supabaseAdmin.from("investment_positions") as any)
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false }),
      (supabaseAdmin.from("withdrawal_requests") as any)
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    return {
      accounts: accounts.data ?? [],
      ledger: ledger.data ?? [],
      positions: positions.data ?? [],
      withdrawals: withdrawals.data ?? [],
    };
  });

/** Earning <-> Savings transfer, posted as a matched debit/credit pair. */
export const transferBetweenAccounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => TransferInput.parse(i))
  .handler(async ({ data, context }) => {
    if (data.from === data.to) throw new Error("Choose two different accounts");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const uid = context.userId;
    const amount = Number(data.amount.toFixed(2));

    const accts = await (supabaseAdmin.from("user_accounts") as any)
      .select("id,kind,available_balance,status")
      .eq("user_id", uid);
    const from = (accts.data ?? []).find((a: any) => a.kind === data.from);
    const to = (accts.data ?? []).find((a: any) => a.kind === data.to);
    if (!from || !to) throw new Error("Accounts not ready");
    if (from.status !== "active" || to.status !== "active")
      throw new Error("Account is not active");
    if (amount > Number(from.available_balance)) throw new Error("Insufficient available balance");

    const tr = await (supabaseAdmin.from("account_transfers") as any)
      .insert({
        user_id: uid,
        from_account_id: from.id,
        to_account_id: to.id,
        amount,
        note: data.note,
        idempotency_key: data.idempotency_key,
      })
      .select("id")
      .maybeSingle();
    if (tr.error && !tr.error.message.includes("duplicate")) throw new Error(tr.error.message);
    const transferId = tr.data?.id ?? null;

    const post = async (kind: string, direction: string, key: string) => {
      const r = await (supabaseAdmin.rpc as any)("post_ledger_entry", {
        _user_id: uid,
        _kind: kind,
        _direction: direction,
        _amount: amount,
        _category: "transfer",
        _reason: data.note || `Transfer ${data.from} → ${data.to}`,
        _actor_id: uid,
        _actor_role: "customer",
        _idempotency_key: key,
        _refs: transferId ? { transfer_id: transferId } : {},
      });
      if (r.error) throw new Error(r.error.message);
    };
    await post(data.from, "debit", `${data.idempotency_key}:out`);
    await post(data.to, "credit", `${data.idempotency_key}:in`);
    return { ok: true };
  });

/** Payout destinations available to the customer (only admin-enabled, configured ones). */
export const getWithdrawalOptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [configs, methods, profile] = await Promise.all([
      (supabaseAdmin.from("payout_method_configs") as any).select("*"),
      (supabaseAdmin.from("payout_methods") as any)
        .select("*")
        .eq("user_id", context.userId)
        .is("archived_at", null),
      (supabaseAdmin.from("profiles") as any)
        .select("status,email,phone,email_verified,phone_verified,kyc_status,two_factor_enabled")
        .eq("id", context.userId)
        .maybeSingle(),
    ]);
    return {
      configs: configs.data ?? [],
      methods: methods.data ?? [],
      profile: profile.data ?? null,
    };
  });

/** Store a payout destination in masked form only. Raw details are never persisted. */
export const addPayoutMethod = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => PayoutInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cfg = await (supabaseAdmin.from("payout_method_configs") as any)
      .select("*")
      .eq("kind", data.kind)
      .maybeSingle();
    if (!cfg.data?.enabled) throw new Error("This payout method is not currently available");
    const delay = Number(cfg.data.new_destination_delay_hours ?? 24);
    const ins = await (supabaseAdmin.from("payout_methods") as any)
      .insert({
        user_id: context.userId,
        kind: data.kind,
        label: data.label,
        masked_destination: mask(data.kind, data.destination),
        status: "pending_confirmation",
        usable_after: new Date(Date.now() + delay * 3600_000).toISOString(),
      })
      .select("id")
      .single();
    if (ins.error) throw new Error(ins.error.message);
    return { ok: true, id: ins.data.id as string };
  });

/** Create a withdrawal request and place a hold on the Earning account. */
export const requestWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => WithdrawInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const uid = context.userId;
    const amount = Number(data.amount.toFixed(2));

    const profile = await (supabaseAdmin.from("profiles") as any)
      .select("status,email_verified,phone_verified,kyc_status,two_factor_enabled")
      .eq("id", uid)
      .maybeSingle();
    if (!profile.data || profile.data.status !== "active")
      throw new Error("Your profile is not active");
    if (!profile.data.email_verified)
      throw new Error("Verify your email before requesting a withdrawal");
    if (!profile.data.phone_verified)
      throw new Error("Verify your phone before requesting a withdrawal");
    if (profile.data.kyc_status !== "verified")
      throw new Error("Complete identity verification before requesting a withdrawal");
    if (!profile.data.two_factor_enabled)
      throw new Error("Enable two-factor authentication before requesting a withdrawal");

    const method = await (supabaseAdmin.from("payout_methods") as any)
      .select("*")
      .eq("id", data.payout_method_id)
      .eq("user_id", uid)
      .maybeSingle();
    if (!method.data) throw new Error("Payout destination not found");
    if (!method.data.is_verified)
      throw new Error("Confirm this payout destination before using it");
    if (method.data.usable_after && new Date(method.data.usable_after) > new Date())
      throw new Error("This destination is still in its security cooling-off period");

    const cfg = await (supabaseAdmin.from("payout_method_configs") as any)
      .select("*")
      .eq("kind", method.data.kind)
      .maybeSingle();
    if (!cfg.data?.enabled) throw new Error("This payout method is not currently available");
    if (!cfg.data.provider_configured)
      throw new Error("No payout provider is connected for this method yet");
    if (amount < Number(cfg.data.min_amount)) throw new Error(`Minimum is ${cfg.data.min_amount}`);
    if (cfg.data.max_amount && amount > Number(cfg.data.max_amount))
      throw new Error(`Maximum is ${cfg.data.max_amount}`);

    const acct = await (supabaseAdmin.from("user_accounts") as any)
      .select("*")
      .eq("user_id", uid)
      .eq("kind", "earning")
      .maybeSingle();
    if (!acct.data) throw new Error("Earning account not ready");
    if (acct.data.status !== "active") throw new Error("Account is not active");
    if (amount > Number(acct.data.available_balance))
      throw new Error("Insufficient available balance");

    const fee = Number(
      (Number(cfg.data.fee_flat) + amount * Number(cfg.data.fee_percent)).toFixed(2),
    );
    const networkFee = Number(cfg.data.network_fee ?? 0);
    const net = Number((amount - fee - networkFee).toFixed(2));
    if (net <= 0) throw new Error("Amount does not cover the fees");

    const recent = await (supabaseAdmin.from("withdrawal_requests") as any)
      .select("id,amount,payout_method_id,created_at,status")
      .eq("user_id", uid)
      .in("status", ["submitted", "under_review", "approved", "processing"])
      .order("created_at", { ascending: false })
      .limit(10);
    const duplicate = (recent.data ?? []).find(
      (r: any) => r.payout_method_id === data.payout_method_id && Number(r.amount) === amount,
    );
    if (duplicate) throw new Error("An identical withdrawal request is already open");
    const lastMinute = (recent.data ?? []).some(
      (r: any) => Date.now() - new Date(r.created_at).getTime() < 60_000,
    );
    if (lastMinute) throw new Error("Please wait one minute before submitting another withdrawal");

    const ins = await (supabaseAdmin.from("withdrawal_requests") as any)
      .insert({
        user_id: uid,
        account_id: acct.data.id,
        payout_method_id: method.data.id,
        payout_kind: method.data.kind,
        destination_summary: method.data.masked_destination,
        amount,
        processing_fee: fee,
        network_fee: networkFee,
        net_amount: net,
        status: "submitted",
        hold_active: true,
        estimated_time: cfg.data.estimated_time ?? "",
        submitted_at: new Date().toISOString(),
        idempotency_key: data.idempotency_key,
      })
      .select("id")
      .single();
    if (ins.error) throw new Error(ins.error.message);

    const hold = await (supabaseAdmin.rpc as any)("adjust_hold", {
      _account_id: acct.data.id,
      _amount: amount,
      _mode: "place",
    });
    if (hold.error) {
      await (supabaseAdmin.from("withdrawal_requests") as any)
        .update({ status: "failed", hold_active: false, admin_notes: "Hold failed" })
        .eq("id", ins.data.id);
      throw new Error(hold.error.message);
    }

    await (supabaseAdmin.from("withdrawal_status_history") as any).insert({
      withdrawal_id: ins.data.id,
      user_id: uid,
      to_status: "submitted",
      actor_id: uid,
      actor_role: "customer",
      note: "Request submitted",
    });
    await (supabaseAdmin.from("notifications") as any).insert({
      user_id: uid,
      title: "Withdrawal submitted",
      body: `Your withdrawal of ${amount.toFixed(2)} is pending review.`,
      kind: "info",
    });
    return { ok: true, id: ins.data.id as string };
  });

export const getWithdrawalDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const req = await (supabaseAdmin.from("withdrawal_requests") as any)
      .select("*")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!req.data) throw new Error("Not found");
    const history = await (supabaseAdmin.from("withdrawal_status_history") as any)
      .select("*")
      .eq("withdrawal_id", data.id)
      .order("created_at", { ascending: true });
    return { request: req.data, history: history.data ?? [] };
  });

export const cancelWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const req = await (supabaseAdmin.from("withdrawal_requests") as any)
      .select("*")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!req.data) throw new Error("Withdrawal not found");
    if (
      !["draft", "submitted", "identity_verification_required", "under_review"].includes(
        req.data.status,
      )
    )
      throw new Error("This withdrawal can no longer be cancelled");
    if (req.data.hold_active) {
      const release = await (supabaseAdmin.rpc as any)("adjust_hold", {
        _account_id: req.data.account_id,
        _amount: Number(req.data.amount),
        _mode: "release",
      });
      if (release.error) throw new Error(release.error.message);
    }
    const upd = await (supabaseAdmin.from("withdrawal_requests") as any)
      .update({ status: "cancelled", hold_active: false, decided_at: new Date().toISOString() })
      .eq("id", data.id);
    if (upd.error) throw new Error(upd.error.message);
    await (supabaseAdmin.from("withdrawal_status_history") as any).insert({
      withdrawal_id: data.id,
      user_id: context.userId,
      from_status: req.data.status,
      to_status: "cancelled",
      actor_id: context.userId,
      actor_role: "customer",
      note: "Cancelled by customer",
    });
    return { ok: true };
  });
