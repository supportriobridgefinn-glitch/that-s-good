import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { validatePin } from "@/lib/banking.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PinKeypad } from "@/components/PinKeypad";
import { CheckCircle2 } from "lucide-react";
import { resolveAccountLogin } from "@/lib/banking.functions";
import { AuthShell } from "@/components/AuthShell";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Customer Login | Rio Bridge Finance" },
      { name: "description", content: "Sign in securely to your Rio Bridge Finance accounts, transfers and loan applications." },
      { property: "og:title", content: "Customer Login | Rio Bridge Finance" },
      { property: "og:description", content: "Secure account access for Rio Bridge Finance customers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    let email: string;
    try {
      const resolved = await resolveAccountLogin({ data: { account_number: account.trim() } });
      email = resolved.email;
    } catch {
      setBusy(false);
      setError("Invalid account number or password");
      return;
    }
    const { error: signErr, data } = await supabase.auth.signInWithPassword({ email, password });
    if (signErr || !data.user) {
      setBusy(false);
      setError("Invalid account number or password");
      return;
    }
    const { data: p } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", data.user.id)
      .maybeSingle();
    setFullName((p as { full_name?: string } | null)?.full_name ?? "");
    setBusy(false);
    setStep(2);
  }

  // Auto-verify on 4 digits
  useEffect(() => {
    if (step !== 2 || pin.length !== 4 || busy || verified) return;
    (async () => {
      setError(null);
      setBusy(true);
      try {
        await validatePin({ data: { pin } });
        setVerified(true);
        setTimeout(() => navigate({ to: "/dashboard" }), 700);
      } catch (err) {
        setError(err instanceof Error ? err.message : "PIN check failed");
        setBusy(false);
        setPin("");
      }
    })();
  }, [pin, step, busy, verified, navigate]);

  return (
    <AuthShell eyebrow="Secure client access">
      <Card className={`w-full ${step === 2 ? "border-0 shadow-none" : ""}`}>
        <CardHeader className="text-center">
          <img
            src="/site/images/rio-bridge-logo.png"
            alt="Rio Bridge Finance"
            className="h-14 mx-auto mb-2"
          />
          <div className="text-xl font-extrabold" style={{ color: "var(--brand-navy)" }}>
            Rio Bridge Finance
          </div>
          <div
            className="text-[10px] font-semibold tracking-[0.2em] mb-2"
            style={{ color: "var(--brand-navy)" }}
          >
            LOAN DASHBOARD
          </div>
          <CardTitle className="text-lg">
            {step === 1 ? "Sign in to your account" : fullName || "Enter your PIN"}
          </CardTitle>
          {step === 2 && (
            <p className="text-sm text-muted-foreground mt-1">Enter your 4-digit PIN to continue</p>
          )}
          {step === 1 && (
            <div className="mt-2 inline-flex items-center justify-center gap-1.5 text-[11px] text-emerald-600">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Secured connection · TLS encrypted · This is a private portal
            </div>
          )}
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {error}
            </div>
          )}
          {verified && (
            <div className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-3 flex items-center gap-2">
              <CheckCircle2 size={18} /> PIN verified! Redirecting…
            </div>
          )}
          {step === 1 ? (
            <form onSubmit={submitPassword} className="space-y-4">
              <div>
                <Label htmlFor="acct">Account number</Label>
                <Input
                  id="acct"
                  inputMode="numeric"
                  autoComplete="username"
                  required
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="pw">Password</Label>
                <Input
                  id="pw"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={busy}
                className="w-full"
                style={{ background: "var(--brand-navy)", color: "var(--brand-navy-foreground)" }}
              >
                {busy ? "Signing in…" : "Continue"}
              </Button>
            </form>
          ) : (
            <div className="space-y-5">
              <PinKeypad value={pin} onChange={setPin} disabled={busy || verified} />
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={async () => {
                  await supabase.auth.signOut();
                  setStep(1);
                  setPin("");
                  setVerified(false);
                  setError(null);
                }}
              >
                Back
              </Button>
            </div>
          )}
          <div className="mt-6 text-center text-xs text-muted-foreground flex flex-wrap justify-center gap-x-3 gap-y-1">
            <Link to="/" className="hover:underline">
              ← Back to website
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link to="/register" className="hover:underline">
              Register
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link to="/forgot-password" className="hover:underline">
              Forgot password
            </Link>
            <span className="text-muted-foreground">·</span>
            <button
              type="button"
              onClick={() => {
                const ev = new CustomEvent("riobridge:open-support");
                window.dispatchEvent(ev);
              }}
              className="hover:underline"
            >
              Contact support
            </button>
          </div>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
