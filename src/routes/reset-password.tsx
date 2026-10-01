import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Choose a new password | Rio Bridge Finance" }, { name: "description", content: "Securely choose a new Rio Bridge Finance account password." }, { property: "og:title", content: "Choose a new password | Rio Bridge Finance" }, { property: "og:description", content: "Securely update your account password." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => { supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session))); const { data } = supabase.auth.onAuthStateChange((event) => { if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true); }); return () => data.subscription.unsubscribe(); }, []);
  async function submit(event: React.FormEvent) { event.preventDefault(); setError(""); if (password !== confirm) { setError("Passwords do not match."); return; } setBusy(true); const { error: updateError } = await supabase.auth.updateUser({ password }); setBusy(false); if (updateError) { setError(updateError.message); return; } void navigate({ to: "/login", replace: true }); }
  return <AuthShell eyebrow="Protected credential update"><div className="auth-form-panel"><BrandMark className="mb-9 lg:hidden" /><div className="mb-8"><span className="section-kicker"><span />Secure access</span><h1 className="mt-4 font-display text-3xl font-extrabold">Choose a new password</h1><p className="mt-3 text-sm text-muted-foreground">Use a strong password you have not used elsewhere.</p></div>{!ready ? <div className="rounded-md border bg-muted p-4 text-sm text-muted-foreground">Open this page from the secure link in your recovery email. <Link to="/forgot-password" className="font-semibold text-primary">Request another link</Link>.</div> : <form onSubmit={submit} className="space-y-5">{error && <div role="alert" className="rounded-md border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}<div><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" minLength={8} autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></div><div><Label htmlFor="confirm-password">Confirm new password</Label><Input id="confirm-password" type="password" minLength={8} autoComplete="new-password" required value={confirm} onChange={(event) => setConfirm(event.target.value)} /></div><Button className="w-full" size="lg" disabled={busy}>{busy ? "Updating…" : "Update password"}</Button></form>}</div></AuthShell>;
}