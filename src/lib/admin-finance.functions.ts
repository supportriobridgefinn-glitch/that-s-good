import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* eslint-disable @typescript-eslint/no-explicit-any */

async function requireAdmin(supabase: any, userId: string) {
  const r = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!r.data) throw new Error("Forbidden");
}

async function audit(
  admin: any,
  actorId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  targetUserId: string | null,
  details: Record<string, unknown>,
) {
  await admin.from("admin_audit_logs").insert({
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    target_user_id: targetUserId,
    details,
  });
}

/** Withdrawal queue, payout configs, recent ledger and audit trail. */
export const adminFinanceOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [withdrawals, configs, accounts, ledger, audits, payoutMethods] = await Promise.all([
      (supabaseAdmin.from("withdrawal_requests") as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      (supabaseAdmin.from("payout_method_configs") as any).select("*").order("display_name"),
      (supabaseAdmin.from("user_accounts") as any).select("*").order("created_at"),
      (supabaseAdmin.from("ledger_entries") as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      (supabaseAdmin.from("admin_audit_logs") as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      (supabaseAdmin.from("payout_methods") as any)
        .select("*")
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    const profiles = await (supabaseAdmin.from("profiles") as any).select(
      "id,full_name,account_number,status",
    );
    return {
      withdrawals: withdrawals.data ?? [],
      configs: configs.data ?? [],
      accounts: accounts.data ?? [],
      ledger: ledger.data ?? [],
      audits: audits.data ?? [],
      profiles: profiles.data ?? [],
      payoutMethods: payoutMethods.data ?? [],
    };
  });

const StatusInput = z.object({
  id: z.string().uuid(),
  status: z.enum(["approved", "processing", "paid", "rejected", "failed", "cancelled"]),
  note: z.string().max(500).default(""),
  provider_reference: z.string().max(200).default(""),
});

/** Move a withdrawal through its lifecycle, releasing or capturing the hold. */
export const adminSetWithdrawalStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => StatusInput.parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const cur = await (supabaseAdmin.from("withdrawal_requests") as any)
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!cur.data) throw new Error("Withdrawal not found");
    const req = cur.data;
    if (["paid", "rejected", "cancelled", "failed"].includes(req.status))
      throw new Error("This request is already closed");
    if (data.status === "paid" && !data.provider_reference.trim())
      throw new Error("A provider payout reference is required to mark a request as Paid");

    const releaseStatuses = ["rejected", "failed", "cancelled"];
    if (releaseStatuses.includes(data.status) && req.hold_active) {
      const r = await (supabaseAdmin.rpc as any)("adjust_hold", {
        _account_id: req.account_id,
        _amount: Number(req.amount),
        _mode: "release",
      });
      if (r.error) throw new Error(r.error.message);
    }
    if (data.status === "paid" && req.hold_active) {
      const r = await (supabaseAdmin.rpc as any)("adjust_hold", {
        _account_id: req.account_id,
        _amount: Number(req.amount),
        _mode: "capture",
      });
      if (r.error) throw new Error(r.error.message);
      const account = await (supabaseAdmin.from("user_accounts") as any)
        .select("id,currency,available_balance")
        .eq("id", req.account_id)
        .maybeSingle();
      const led = await (supabaseAdmin.from("ledger_entries") as any).insert({
        user_id: req.user_id,
        account_id: req.account_id,
        direction: "debit",
        amount: Number(req.amount),
        currency: account.data?.currency ?? "USD",
        category: "withdrawal",
        reason: `Withdrawal paid · ref ${data.provider_reference}`,
        actor_id: context.userId,
        actor_role: "admin",
        previous_balance: Number(account.data?.available_balance ?? 0),
        resulting_balance: Number(account.data?.available_balance ?? 0),
        withdrawal_request_id: req.id,
        idempotency_key: `wd:${req.id}:paid`,
      });
      if (led.error && !String(led.error.message).toLowerCase().includes("duplicate"))
        throw new Error(led.error.message);
    }

    const upd = await (supabaseAdmin.from("withdrawal_requests") as any)
      .update({
        status: data.status,
        hold_active: data.status === "approved" || data.status === "processing",
        admin_notes: data.note || req.admin_notes,
        provider_reference: data.provider_reference || req.provider_reference,
        decided_at: new Date().toISOString(),
        ...(data.status === "paid" ? { paid_at: new Date().toISOString() } : {}),
      })
      .eq("id", data.id);
    if (upd.error) throw new Error(upd.error.message);

    await (supabaseAdmin.from("withdrawal_status_history") as any).insert({
      withdrawal_id: req.id,
      user_id: req.user_id,
      from_status: req.status,
      to_status: data.status,
      actor_id: context.userId,
      actor_role: "admin",
      note: data.note,
    });
    await (supabaseAdmin.from("notifications") as any).insert({
      user_id: req.user_id,
      title: `Withdrawal ${data.status}`,
      body: data.note || `Your withdrawal request is now ${data.status}.`,
      kind: "info",
    });
    await audit(
      supabaseAdmin,
      context.userId,
      "withdrawal.status",
      "withdrawal_requests",
      req.id,
      req.user_id,
      { from: req.status, to: data.status, note: data.note },
    );
    return { ok: true };
  });

const AdjustInput = z.object({
  user_id: z.string().uuid(),
  kind: z.enum(["earning", "savings", "investment"]),
  direction: z.enum(["credit", "debit"]),
  amount: z.number().positive().max(1_000_000_000),
  category: z.string().min(2).max(60),
  reason: z.string().min(3).max(300),
});

/** Admins can only post adjusting ledger entries — never overwrite a balance. */
export const adminPostAdjustment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => AdjustInput.parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const key = `adj:${context.userId}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
    const r = await (supabaseAdmin.rpc as any)("post_ledger_entry", {
      _user_id: data.user_id,
      _kind: data.kind,
      _direction: data.direction,
      _amount: Number(data.amount.toFixed(2)),
      _category: data.category,
      _reason: data.reason,
      _actor_id: context.userId,
      _actor_role: "admin",
      _idempotency_key: key,
      _refs: {},
    });
    if (r.error) throw new Error(r.error.message);
    await (supabaseAdmin.from("notifications") as any).insert({
      user_id: data.user_id,
      title: "Account updated",
      body: `${data.direction === "credit" ? "Credit" : "Debit"} of ${data.amount.toFixed(2)} — ${data.reason}`,
      kind: "info",
    });
    await audit(
      supabaseAdmin,
      context.userId,
      "ledger.adjustment",
      "ledger_entries",
      null,
      data.user_id,
      { ...data },
    );
    return { ok: true };
  });

const ConfigInput = z.object({
  kind: z.string().min(2).max(40),
  enabled: z.boolean(),
  provider_configured: z.boolean(),
  provider_name: z.string().max(80).default(""),
  fee_flat: z.number().min(0).max(100000),
  fee_percent: z.number().min(0).max(1),
  network_fee: z.number().min(0).max(100000),
  min_amount: z.number().min(0).max(1_000_000_000),
  max_amount: z.number().min(0).max(1_000_000_000).nullable(),
  estimated_time: z.string().max(120).default(""),
  new_destination_delay_hours: z.number().int().min(0).max(720),
});

export const adminUpdatePayoutConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => ConfigInput.parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.enabled && !data.provider_configured)
      throw new Error("Connect and confirm a real provider before enabling this method");
    const { kind, ...patch } = data;
    const upd = await (supabaseAdmin.from("payout_method_configs") as any)
      .update({ ...patch, updated_by: context.userId })
      .eq("kind", kind);
    if (upd.error) throw new Error(upd.error.message);
    await audit(
      supabaseAdmin,
      context.userId,
      "payout_config.update",
      "payout_method_configs",
      null,
      null,
      { ...data },
    );
    return { ok: true };
  });

export const adminSetAccountStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        account_id: z.string().uuid(),
        status: z.enum(["active", "suspended", "closed"]),
        reason: z.string().max(300).default(""),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const upd = await (supabaseAdmin.from("user_accounts") as any)
      .update({ status: data.status })
      .eq("id", data.account_id)
      .select("user_id")
      .maybeSingle();
    if (upd.error) throw new Error(upd.error.message);
    await audit(
      supabaseAdmin,
      context.userId,
      "account.status",
      "user_accounts",
      data.account_id,
      upd.data?.user_id ?? null,
      { status: data.status, reason: data.reason },
    );
    return { ok: true };
  });

export const adminVerifyPayoutMethod = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        id: z.string().uuid(),
        verified: z.boolean(),
        note: z.string().max(300).default(""),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const method = await (supabaseAdmin.from("payout_methods") as any)
      .update({
        is_verified: data.verified,
        status: data.verified ? "verified" : "rejected",
        verified_at: data.verified ? new Date().toISOString() : null,
      })
      .eq("id", data.id)
      .select("user_id,kind,masked_destination")
      .maybeSingle();
    if (method.error || !method.data)
      throw new Error(method.error?.message || "Payout method not found");
    await (supabaseAdmin.from("notifications") as any).insert({
      user_id: method.data.user_id,
      title: data.verified ? "Payout destination verified" : "Payout destination rejected",
      body:
        data.note ||
        `${method.data.kind} ${method.data.masked_destination} was ${data.verified ? "verified" : "rejected"}.`,
      kind: data.verified ? "success" : "warning",
    });
    await audit(
      supabaseAdmin,
      context.userId,
      "payout_method.verify",
      "payout_methods",
      data.id,
      method.data.user_id,
      { verified: data.verified, note: data.note },
    );
    return { ok: true };
  });
