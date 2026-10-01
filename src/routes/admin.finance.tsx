import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { maskIdentifier, maskName, maskPersonalText } from "@/lib/privacy";
import { useEffect, useMemo, useState } from "react";
import { AppShell, GateLoading, useGate } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  adminFinanceOverview,
  adminPostAdjustment,
  adminSetAccountStatus,
  adminSetWithdrawalStatus,
  adminUpdatePayoutConfig,
  adminVerifyPayoutMethod,
} from "@/lib/admin-finance.functions";
import { formatUsd } from "@/lib/btc";
import { supabase } from "@/integrations/supabase/client";
import { adminSetLoanStatus } from "@/lib/banking.functions";

export const Route = createFileRoute("/admin/finance")({
  head: () => ({ meta: [{ title: "Finance Administration | Rio Bridge Finance" }] }),
  component: FinanceAdmin,
});
type Withdrawal = {
  id: string;
  user_id: string;
  amount: number;
  net_amount: number;
  payout_kind: string;
  destination_summary: string;
  status: string;
  created_at: string;
  provider_reference: string;
};
type Config = {
  kind: string;
  display_name: string;
  enabled: boolean;
  provider_configured: boolean;
  provider_name: string;
  fee_flat: number;
  fee_percent: number;
  network_fee: number;
  min_amount: number;
  max_amount: number | null;
  estimated_time: string;
  new_destination_delay_hours: number;
};
type Account = {
  id: string;
  user_id: string;
  kind: string;
  status: string;
  available_balance: number;
  held_balance: number;
};
type Profile = { id: string; full_name: string; account_number: string; status: string };
type Audit = {
  id: string;
  action: string;
  entity_type: string;
  created_at: string;
  details: Record<string, unknown>;
};
type Loan = { id: string; user_id: string; principal: number; outstanding_principal: number; status: string; purpose: string; term_months: number; interest_rate: number; monthly_payment: number; application_reference: string; created_at: string };
type PayoutMethod = {
  id: string;
  user_id: string;
  kind: string;
  label: string;
  masked_destination: string;
  status: string;
  is_verified: boolean;
  usable_after: string | null;
  created_at: string;
};

function FinanceAdmin() {
  const navigate = useNavigate();
  const { user, role, loading } = useGate("admin");
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [configs, setConfigs] = useState<Config[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [adjust, setAdjust] = useState({
    user_id: "",
    kind: "earning",
    direction: "credit",
    amount: "",
    category: "adjustment",
    reason: "",
  });
  const profileMap = useMemo(() => Object.fromEntries(profiles.map((p) => [p.id, p])), [profiles]);
  async function load() {
    setBusy(true);
    try {
      const r = await adminFinanceOverview();
      setWithdrawals(r.withdrawals as Withdrawal[]);
      setConfigs(r.configs as Config[]);
      setAccounts(r.accounts as Account[]);
      setProfiles(r.profiles as Profile[]);
      setAudits(r.audits as Audit[]);
      setPayoutMethods(r.payoutMethods as PayoutMethod[]);
      const lr = await supabase.from("loans" as never).select("*").order("created_at", { ascending: false });
      setLoans((lr.data ?? []) as unknown as Loan[]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load finance data");
    }
    setBusy(false);
  }
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
  }, [loading, user, role, navigate]);
  if (loading || !user) return <GateLoading />;
  async function act(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      await fn();
      setMsg(ok);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Action failed");
      setBusy(false);
    }
  }
  async function updateWithdrawal(w: Withdrawal, status: string) {
    const note = prompt("Administrative note (optional)") ?? "";
    const provider_reference =
      status === "paid" ? (prompt("Provider payout reference (required)") ?? "") : "";
    await act(
      () =>
        adminSetWithdrawalStatus({
          data: { id: w.id, status: status as never, note, provider_reference },
        }),
      `Withdrawal marked ${status}.`,
    );
  }
  async function saveConfig(c: Config) {
    await act(
      () =>
        adminUpdatePayoutConfig({
          data: {
            ...c,
            fee_flat: Number(c.fee_flat),
            fee_percent: Number(c.fee_percent),
            network_fee: Number(c.network_fee),
            min_amount: Number(c.min_amount),
            max_amount: c.max_amount === null ? null : Number(c.max_amount),
            new_destination_delay_hours: Number(c.new_destination_delay_hours),
          },
        }),
      `${c.display_name} configuration saved.`,
    );
  }
  async function postAdjustment(e: React.FormEvent) {
    e.preventDefault();
    await act(
      () =>
        adminPostAdjustment({
          data: {
            ...adjust,
            kind: adjust.kind as never,
            direction: adjust.direction as never,
            amount: Number(adjust.amount),
          },
        }),
      "Ledger adjustment posted.",
    );
    setAdjust((x) => ({ ...x, amount: "", reason: "" }));
  }
  return (
    <AppShell title="Finance Administration" role="admin">
      {err && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      )}
      {msg && (
        <div className="mb-4 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {msg}
        </div>
      )}
      <Tabs defaultValue="withdrawals">
        <TabsList className="mb-4 flex h-auto flex-wrap">
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="loans">Loans</TabsTrigger>
          <TabsTrigger value="destinations">Destinations</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
          <TabsTrigger value="audit">Audit trail</TabsTrigger>
        </TabsList>
        <TabsContent value="loans" className="space-y-3">
          {loans.length === 0 && <Card><CardContent className="p-6 text-sm text-muted-foreground">No loan applications.</CardContent></Card>}
          {loans.map((l) => (
            <Card key={l.id}><CardContent className="p-4">
              <div className="flex flex-wrap justify-between gap-3">
                <div><div className="font-semibold">{maskName(profileMap[l.user_id]?.full_name || l.user_id)}</div><div className="text-xs text-muted-foreground">{maskIdentifier(profileMap[l.user_id]?.account_number)} · {l.application_reference || "Loan"} · {new Date(l.created_at).toLocaleDateString()}</div><div className="mt-1 text-sm">{l.purpose || "Loan application"}</div></div>
                <div className="text-right"><div className="text-xl font-bold">{formatUsd(Number(l.principal))}</div><div className="text-xs capitalize text-muted-foreground">{l.status.replaceAll("_", " ")}</div></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs"><div>Outstanding<div className="font-semibold mt-1">{formatUsd(Number(l.outstanding_principal || 0))}</div></div><div>Rate<div className="font-semibold mt-1">{Number(l.interest_rate || 0).toFixed(2)}%</div></div><div>Term<div className="font-semibold mt-1">{l.term_months || "—"} months</div></div><div>Monthly<div className="font-semibold mt-1">{formatUsd(Number(l.monthly_payment || 0))}</div></div></div>
              <div className="mt-3 flex flex-wrap gap-2">{["under_review","approved","disbursed","active","paid","rejected","cancelled"].map((status) => <Button key={status} size="sm" variant={status === "rejected" || status === "cancelled" ? "outline" : "default"} disabled={busy || l.status === status} className="capitalize" onClick={() => void act(() => adminSetLoanStatus({ data: { loan_id: l.id, status: status as never, note: `Admin set status to ${status}` } }), `Loan marked ${status.replaceAll("_", " ")}.`)}>{status.replaceAll("_", " ")}</Button>)}</div>
            </CardContent></Card>
          ))}
        </TabsContent>
        <TabsContent value="withdrawals" className="space-y-3">
          {withdrawals.length === 0 && (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                No withdrawal requests.
              </CardContent>
            </Card>
          )}
          {withdrawals.map((w) => (
            <Card key={w.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <div className="font-semibold">
                      {maskName(profileMap[w.user_id]?.full_name || w.user_id)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {maskIdentifier(profileMap[w.user_id]?.account_number)} ·{" "}
                      {new Date(w.created_at).toLocaleString()}
                    </div>
                    <div className="mt-2 text-sm capitalize">
                      {w.payout_kind.replaceAll("_", " ")} · {maskPersonalText(w.destination_summary)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">{formatUsd(Number(w.amount))}</div>
                    <div className="text-xs capitalize text-muted-foreground">
                      {w.status.replaceAll("_", " ")}
                    </div>
                  </div>
                </div>
                {!["paid", "rejected", "failed", "cancelled"].includes(w.status) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["approved", "processing", "paid", "rejected", "failed"].map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={s === "rejected" || s === "failed" ? "outline" : "default"}
                        disabled={busy}
                        onClick={() => void updateWithdrawal(w, s)}
                        className="capitalize"
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="destinations" className="space-y-3">
          {payoutMethods.length === 0 && (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                No payout destinations submitted.
              </CardContent>
            </Card>
          )}
          {payoutMethods.map((m) => (
            <Card key={m.id}>
              <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">
                    {maskName(profileMap[m.user_id]?.full_name || m.user_id)}
                  </div>
                  <div className="text-sm capitalize">
                    {m.kind.replaceAll("_", " ")} · {m.label || "Payout destination"} ·{" "}
                    {m.masked_destination}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Status: {m.status} · Usable after{" "}
                    {m.usable_after ? new Date(m.usable_after).toLocaleString() : "verification"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={busy || m.is_verified}
                    onClick={() =>
                      void act(
                        () =>
                          adminVerifyPayoutMethod({
                            data: {
                              id: m.id,
                              verified: true,
                              note: "Verified by Rio Bridge Finance administration",
                            },
                          }),
                        "Destination verified.",
                      )
                    }
                  >
                    Verify
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy || m.status === "rejected"}
                    onClick={() =>
                      void act(
                        () =>
                          adminVerifyPayoutMethod({
                            data: {
                              id: m.id,
                              verified: false,
                              note:
                                prompt("Reason for rejection") || "Verification was not completed",
                            },
                          }),
                        "Destination rejected.",
                      )
                    }
                  >
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="providers" className="space-y-3">
          {configs.map((c, i) => (
            <ConfigCard
              key={c.kind}
              config={c}
              onChange={(n) => setConfigs((all) => all.map((x, ix) => (ix === i ? n : x)))}
              onSave={() => void saveConfig(c)}
              disabled={busy}
            />
          ))}
        </TabsContent>
        <TabsContent value="accounts">
          <div className="grid gap-3 md:grid-cols-2">
            {accounts.map((a) => (
              <Card key={a.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between">
                    <div>
                      <b>{maskName(profileMap[a.user_id]?.full_name || a.user_id)}</b>
                      <div className="text-xs text-muted-foreground capitalize">
                        {a.kind} · {a.status}
                      </div>
                    </div>
                    <div className="text-right">
                      <b>{formatUsd(Number(a.available_balance))}</b>
                      <div className="text-xs text-muted-foreground">
                        Held {formatUsd(Number(a.held_balance))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {["active", "suspended", "closed"].map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant="outline"
                        disabled={busy || a.status === s}
                        onClick={() =>
                          void act(
                            () =>
                              adminSetAccountStatus({
                                data: {
                                  account_id: a.id,
                                  status: s as never,
                                  reason: `Set to ${s} in finance console`,
                                },
                              }),
                            `Account marked ${s}.`,
                          )
                        }
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="adjustments">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Post ledger adjustment</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={postAdjustment} className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>Customer</Label>
                  <Select
                    value={adjust.user_id}
                    onValueChange={(v) => setAdjust((x) => ({ ...x, user_id: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {maskName(p.full_name)} · {maskIdentifier(p.account_number)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Choice
                  label="Account"
                  value={adjust.kind}
                  options={["earning", "savings", "investment"]}
                  onChange={(v) => setAdjust((x) => ({ ...x, kind: v }))}
                />
                <Choice
                  label="Direction"
                  value={adjust.direction}
                  options={["credit", "debit"]}
                  onChange={(v) => setAdjust((x) => ({ ...x, direction: v }))}
                />
                <div>
                  <Label>Amount</Label>
                  <Input
                    required
                    inputMode="decimal"
                    value={adjust.amount}
                    onChange={(e) => setAdjust((x) => ({ ...x, amount: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input
                    required
                    value={adjust.category}
                    onChange={(e) => setAdjust((x) => ({ ...x, category: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Reason</Label>
                  <Input
                    required
                    minLength={3}
                    value={adjust.reason}
                    onChange={(e) => setAdjust((x) => ({ ...x, reason: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <Button disabled={busy || !adjust.user_id}>Post audited adjustment</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="audit">
          <Card>
            <CardContent className="p-0 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted text-left">
                  <tr>
                    <th className="p-3">Time</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Entity</th>
                    <th className="p-3">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {audits.map((a) => (
                    <tr key={a.id} className="border-t">
                      <td className="p-3 whitespace-nowrap">
                        {new Date(a.created_at).toLocaleString()}
                      </td>
                      <td className="p-3">{a.action}</td>
                      <td className="p-3">{a.entity_type}</td>
                      <td className="p-3 max-w-xs truncate">{JSON.stringify(a.details)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function ConfigCard({
  config: c,
  onChange,
  onSave,
  disabled,
}: {
  config: Config;
  onChange: (c: Config) => void;
  onSave: () => void;
  disabled: boolean;
}) {
  const set = (k: keyof Config, v: string | boolean | number | null) => onChange({ ...c, [k]: v });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{c.display_name}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        <label className="flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={c.provider_configured}
            onChange={(e) => set("provider_configured", e.target.checked)}
          />{" "}
          Provider connected
        </label>
        <label className="flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={c.enabled}
            onChange={(e) => set("enabled", e.target.checked)}
          />{" "}
          Customer enabled
        </label>
        <div>
          <Label>Provider name</Label>
          <Input value={c.provider_name} onChange={(e) => set("provider_name", e.target.value)} />
        </div>
        <Num label="Flat fee" value={c.fee_flat} onChange={(v) => set("fee_flat", v)} />
        <Num
          label="Percent fee (0.02 = 2%)"
          value={c.fee_percent}
          onChange={(v) => set("fee_percent", v)}
        />
        <Num label="Network fee" value={c.network_fee} onChange={(v) => set("network_fee", v)} />
        <Num label="Minimum" value={c.min_amount} onChange={(v) => set("min_amount", v)} />
        <Num
          label="Maximum"
          value={c.max_amount ?? ""}
          onChange={(v) => set("max_amount", v || null)}
        />
        <Num
          label="Cooling-off hours"
          value={c.new_destination_delay_hours}
          onChange={(v) => set("new_destination_delay_hours", v)}
        />
        <div className="md:col-span-2">
          <Label>Estimated time</Label>
          <Input value={c.estimated_time} onChange={(e) => set("estimated_time", e.target.value)} />
        </div>
        <div className="flex items-end">
          <Button disabled={disabled} onClick={onSave}>
            Save configuration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
function Num({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type="number"
        step="any"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o} className="capitalize">
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
