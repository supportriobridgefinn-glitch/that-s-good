import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Counterparty = z.record(z.string(), z.unknown());

const UsdInput = z.object({
  kind: z.enum(["local", "wire", "international"]),
  amount: z.number().positive().max(1_000_000_000),
  counterparty: Counterparty,
  memo: z.string().max(500).default(""),
});

const BtcInput = z.object({
  amount: z.number().positive().max(10_000),
  address: z.string().min(10).max(200),
  memo: z.string().max(500).default(""),
});

// Server-authoritative USD transfer. Validates balance and writes the new
// balance + debit transaction using the service role (RLS-bypassing) client
// so the customer cannot tamper with amounts, direction, or status.
export const transferUsd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => UsdInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;
    const prof = await supabaseAdmin
      .from("profiles")
      .select("id,checking_balance,status")
      .eq("id", userId)
      .maybeSingle();
    if (prof.error || !prof.data) throw new Error("Profile not found");
    if (prof.data.status !== "active") throw new Error("Account not active");
    const current = Number(prof.data.checking_balance ?? 0);
    if (data.amount > current) throw new Error("Insufficient checking balance");
    const newBal = Number((current - data.amount).toFixed(2));

    const upd = await supabaseAdmin
      .from("profiles")
      .update({ checking_balance: newBal })
      .eq("id", userId);
    if (upd.error) throw new Error(upd.error.message);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ins = await (supabaseAdmin.from("transactions") as any)
      .insert({
        user_id: userId,
        type: data.kind,
        direction: "debit",
        account: "checking",
        amount: data.amount,
        currency: "USD",
        counterparty: data.counterparty,
        memo: data.memo,
        status: "completed",
      })
      .select("id")
      .single();
    if (ins.error) throw new Error(ins.error.message);
    return { ok: true, txn_id: ins.data?.id as string };
  });

export const sendBtc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => BtcInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;
    const prof = await supabaseAdmin
      .from("profiles")
      .select("id,btc_balance,status")
      .eq("id", userId)
      .maybeSingle();
    if (prof.error || !prof.data) throw new Error("Profile not found");
    if (prof.data.status !== "active") throw new Error("Account not active");
    const current = Number(prof.data.btc_balance ?? 0);
    if (data.amount > current) throw new Error("Insufficient BTC balance");
    const newBal = Number((current - data.amount).toFixed(8));

    const upd = await supabaseAdmin
      .from("profiles")
      .update({ btc_balance: newBal })
      .eq("id", userId);
    if (upd.error) throw new Error(upd.error.message);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ins = await (supabaseAdmin.from("transactions") as any)
      .insert({
        user_id: userId,
        type: "btc_send",
        direction: "debit",
        account: "btc",
        amount: data.amount,
        currency: "BTC",
        counterparty: { address: data.address },
        memo: data.memo,
        status: "completed",
      })
      .select("id")
      .single();
    if (ins.error) throw new Error(ins.error.message);
    return { ok: true, txn_id: ins.data?.id as string };
  });
