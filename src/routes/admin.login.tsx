import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin Login | Rio Bridge Finance" },
      { name: "description", content: "Administrator access to Rio Bridge Finance customer, transaction and loan management." },
      { property: "og:title", content: "Admin Login | Rio Bridge Finance" },
      { property: "og:description", content: "Administrator access to Rio Bridge Finance management tools." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setError("Invalid credentials");
      setBusy(false);
      return;
    }
    const role = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!role.data) {
      await supabase.auth.signOut();
      setError("This account is not an admin");
      setBusy(false);
      return;
    }
    navigate({ to: "/admin" });
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--gradient-brand)" }}
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img
            src="/site/images/rio-bridge-logo.png"
            alt="Rio Bridge Finance"
            className="h-14 mx-auto mb-2"
          />
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
            Private Loans and Loan Management
          </div>
          <CardTitle className="text-lg">Admin Console</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {error}
            </div>
          )}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="em">Email</Label>
              <Input
                id="em"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <div className="mt-6 text-center text-xs text-muted-foreground">
            <Link to="/login" className="hover:underline">
              Customer login
            </Link>
            <span className="mx-2">·</span>
            <Link to="/" className="hover:underline">
              Back to website
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
