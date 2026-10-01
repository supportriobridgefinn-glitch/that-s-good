import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ApplicationInput = z.object({
  first_name: z.string().min(1).max(80),
  middle_name: z.string().max(80).default(""),
  last_name: z.string().min(1).max(80),
  username: z.string().min(3).max(60),
  email: z.string().email(),
  phone: z.string().min(4).max(40),
  country: z.string().min(1).max(80),
  account_type: z.string().min(1).max(80),
  currency: z.string().min(1).max(80),
  pin: z.string().regex(/^\d{4}$/),
  // Password is collected by the registration form for UX continuity but is
  // intentionally ignored server-side. We never persist applicant passwords.
  // Admins generate a one-time temporary password at approval time.
  password: z.string().min(6).max(72).optional(),
});

// Public — anyone can submit an application.
export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator((input) => ApplicationInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const hashed = await (
      supabaseAdmin.rpc as unknown as (
        n: string,
        a: Record<string, string>,
      ) => Promise<{ data: string | null; error: Error | null }>
    )("hash_pin", { _pin: data.pin });
    if (hashed.error) throw new Error(hashed.error.message);
    const ins = await supabaseAdmin.from("account_applications").insert({
      first_name: data.first_name,
      middle_name: data.middle_name,
      last_name: data.last_name,
      username: data.username,
      email: data.email,
      phone: data.phone,
      country: data.country,
      account_type: data.account_type,
      currency: data.currency,
      pin_hash: hashed.data ?? "",
      status: "pending",
    });
    if (ins.error) throw new Error(ins.error.message);
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

function generateTempPassword(): string {
  // 14-char random temp password, mixed case + digits.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(14);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

export const approveApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        application_id: z.string().uuid(),
        account_number: z.string().regex(/^\d{6,12}$/),
        opening_balance: z.number().min(0).default(0),
        initial_password: z.string().min(8).max(72).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const app = await supabaseAdmin
      .from("account_applications")
      .select("*")
      .eq("id", data.application_id)
      .maybeSingle();
    if (app.error || !app.data) throw new Error("Application not found");
    const a = app.data;

    const tempPassword = data.initial_password ?? generateTempPassword();

    const email = `acct-${data.account_number}@riobridge.internal`;
    const created = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: `${a.first_name} ${a.last_name}`.trim(),
        account_number: data.account_number,
      },
    });
    if (created.error || !created.data.user)
      throw new Error(created.error?.message || "createUser failed");
    const newId = created.data.user.id;

    await supabaseAdmin.from("user_roles").insert({ user_id: newId, role: "customer" });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from("profiles") as any).upsert({
      id: newId,
      full_name: `${a.first_name} ${a.last_name}`.trim(),
      first_name: a.first_name,
      middle_name: a.middle_name,
      last_name: a.last_name,
      email: a.email,
      phone: a.phone,
      country: a.country,
      account_type: a.account_type,
      currency: a.currency,
      account_number: data.account_number,
      pin_hash: a.pin_hash,
      status: "active",
      opening_balance: data.opening_balance,
      checking_balance: data.opening_balance,
      btc_deposit_address: `bc1q${newId.replace(/-/g, "").slice(0, 32)}`,
    });

    await supabaseAdmin
      .from("account_applications")
      .update({ status: "approved", admin_notes: `Approved → user ${newId}` })
      .eq("id", data.application_id);

    // Return the temp password ONCE so the admin can share it securely.
    return { ok: true, user_id: newId, temp_password: tempPassword };
  });

export const rejectApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({ application_id: z.string().uuid(), reason: z.string().max(300).default("") })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("account_applications")
      .update({ status: "rejected", admin_notes: data.reason })
      .eq("id", data.application_id);
    return { ok: true };
  });
