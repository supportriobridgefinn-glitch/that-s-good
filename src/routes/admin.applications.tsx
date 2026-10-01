import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { maskEmail, maskName, maskPhone, maskText } from "@/lib/privacy";
import { useEffect, useState } from "react";
import { AppShell, GateLoading, useGate } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { approveApplication, rejectApplication } from "@/lib/applications.functions";

export const Route = createFileRoute("/admin/applications")({
  head: () => ({ meta: [{ title: "Applications | Rio Bridge Finance Admin" }] }),
  component: AdminApplications,
});

type App = {
  id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  username: string;
  email: string;
  phone: string;
  country: string;
  account_type: string;
  currency: string;
  status: string;
  created_at: string;
  admin_notes: string;
};

function AdminApplications() {
  const navigate = useNavigate();
  const { user, role, loading } = useGate("admin");
  const [rows, setRows] = useState<App[]>([]);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [approveFor, setApproveFor] = useState<App | null>(null);
  const [acct, setAcct] = useState("");
  const [opening, setOpening] = useState("0");
  const [initialPw, setInitialPw] = useState("");
  const [credential, setCredential] = useState<{ name: string; password: string } | null>(null);

  const [rejectFor, setRejectFor] = useState<App | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/admin/login" });
      return;
    }
    if (role !== "admin") {
      navigate({ to: "/" });
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, role, filter]);

  async function load() {
    let q = supabase
      .from("account_applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (filter === "pending") q = q.eq("status", "pending");
    const r = await q;
    setRows((r.data ?? []) as unknown as App[]);
  }

  function openApprove(a: App) {
    setErr(null);
    setCredential(null);
    setAcct("");
    setOpening("0");
    setInitialPw("");
    setRejectFor(null);
    setApproveFor(a);
  }

  async function confirmApprove(e: React.FormEvent) {
    e.preventDefault();
    const a = approveFor;
    if (!a) return;
    if (!/^\d{6,12}$/.test(acct)) {
      setErr("Account number must be 6–12 digits");
      return;
    }
    if (initialPw && initialPw.length < 8) {
      setErr("Starting password must be at least 8 characters");
      return;
    }
    setBusyId(a.id);
    setErr(null);
    try {
      const res = await approveApplication({
        data: {
          application_id: a.id,
          account_number: acct,
          opening_balance: Number.parseFloat(opening) || 0,
          ...(initialPw ? { initial_password: initialPw } : {}),
        },
      });
      setApproveFor(null);
      if (res?.temp_password) {
        setCredential({
          name: `${a.first_name} ${a.last_name}`.trim(),
          password: res.temp_password,
        });
      }
      await load();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmReject(e: React.FormEvent) {
    e.preventDefault();
    const a = rejectFor;
    if (!a) return;
    setBusyId(a.id);
    setErr(null);
    try {
      await rejectApplication({ data: { application_id: a.id, reason } });
      setRejectFor(null);
      setReason("");
      await load();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <GateLoading />;

  return (
    <AppShell title="Account applications" role="admin">
      {err && (
        <div className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded p-3">
          {err}
        </div>
      )}

      {credential && (
        <Card className="mb-4 border-primary/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Account created for {credential.name}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p className="text-muted-foreground">
              Share this one-time starting password securely. It will not be shown again.
            </p>
            <code className="block rounded bg-muted px-3 py-2 font-mono text-base">
              {credential.password}
            </code>
            <Button size="sm" variant="outline" onClick={() => setCredential(null)}>
              Done
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mb-4 flex items-center gap-2">
        <Button
          size="sm"
          variant={filter === "pending" ? "default" : "outline"}
          onClick={() => setFilter("pending")}
        >
          Pending
        </Button>
        <Button
          size="sm"
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        <span className="ml-auto text-sm text-muted-foreground">{rows.length}</span>
      </div>

      <div className="grid gap-3">
        {rows.length === 0 && (
          <div className="text-sm text-muted-foreground">No applications.</div>
        )}
        {rows.map((a) => (
          <Card key={a.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex flex-wrap items-center gap-2">
                {maskName([a.first_name, a.middle_name, a.last_name].filter(Boolean).join(" "))}
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    a.status === "pending"
                      ? "bg-amber-100 text-amber-700"
                      : a.status === "approved"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {a.status}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div>
                <b>Email:</b> {maskEmail(a.email)} · <b>Phone:</b> {maskPhone(a.phone)}
              </div>
              <div>
                <b>Username:</b> {maskText(a.username)} · <b>Country:</b> {maskText(a.country)}
              </div>
              <div>
                <b>Account:</b> {a.account_type} · <b>Currency:</b> {a.currency}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(a.created_at).toLocaleString()}
              </div>
              {a.admin_notes && (
                <div className="text-xs text-muted-foreground">Notes: {a.admin_notes}</div>
              )}

              {a.status === "pending" && approveFor?.id !== a.id && rejectFor?.id !== a.id && (
                <div className="flex gap-2 pt-2">
                  <Button size="sm" disabled={busyId === a.id} onClick={() => openApprove(a)}>
                    Approve &amp; create
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={busyId === a.id}
                    onClick={() => {
                      setApproveFor(null);
                      setReason("");
                      setRejectFor(a);
                    }}
                  >
                    Reject
                  </Button>
                </div>
              )}

              {approveFor?.id === a.id && (
                <form
                  onSubmit={confirmApprove}
                  className="mt-3 grid sm:grid-cols-3 gap-3 border-t pt-3"
                >
                  <div>
                    <Label>Account number *</Label>
                    <Input
                      required
                      inputMode="numeric"
                      placeholder="6–12 digits"
                      value={acct}
                      onChange={(ev) => setAcct(ev.target.value.replace(/\D/g, ""))}
                    />
                  </div>
                  <div>
                    <Label>Opening balance</Label>
                    <Input
                      inputMode="decimal"
                      value={opening}
                      onChange={(ev) => setOpening(ev.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Starting password</Label>
                    <Input
                      type="text"
                      placeholder="Leave blank to auto-generate"
                      value={initialPw}
                      onChange={(ev) => setInitialPw(ev.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-3 flex gap-2">
                    <Button type="submit" size="sm" disabled={busyId === a.id}>
                      {busyId === a.id ? "Creating…" : "Create account"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setApproveFor(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              {rejectFor?.id === a.id && (
                <form onSubmit={confirmReject} className="mt-3 space-y-3 border-t pt-3">
                  <div>
                    <Label>Rejection reason</Label>
                    <Input
                      value={reason}
                      maxLength={300}
                      placeholder="Optional note for the record"
                      onChange={(ev) => setReason(ev.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      variant="destructive"
                      disabled={busyId === a.id}
                    >
                      {busyId === a.id ? "Rejecting…" : "Confirm rejection"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setRejectFor(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
