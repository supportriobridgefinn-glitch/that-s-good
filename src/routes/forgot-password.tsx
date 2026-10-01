import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Mail } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Recover access | Rio Bridge Finance" }, { name: "description", content: "Request a secure Rio Bridge Finance password reset link." }, { property: "og:title", content: "Recover access | Rio Bridge Finance" }, { property: "og:description", content: "Request a secure password reset link." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (resetError) { setError(resetError.message); return; }
    setSent(true);
  }
  return <AuthShell eyebrow="Secure account recovery"><div className="auth-form-panel"><BrandMark className="mb-9 lg:hidden" /><div className="mb-8"><span className="section-kicker"><span />Account recovery</span><h1 className="mt-4 font-display text-3xl font-extrabold">Reset your password</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Enter the email associated with your account. We’ll send a secure reset link if it matches our records.</p></div>{sent ? <div className="rounded-md border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800"><CheckCircle2 className="mb-3" />Check your inbox for the password reset link.</div> : <form onSubmit={submit} className="space-y-5">{error && <div role="alert" className="rounded-md border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}<div><Label htmlFor="recovery-email">Email address</Label><div className="relative mt-1"><Mail className="absolute left-3 top-3 text-muted-foreground" size={16} /><Input id="recovery-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="pl-10" /></div></div><Button className="w-full" size="lg" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</Button></form>}<Link to="/login" className="mt-6 block text-center text-sm font-semibold text-primary hover:underline">Back to customer login</Link></div></AuthShell>;
}