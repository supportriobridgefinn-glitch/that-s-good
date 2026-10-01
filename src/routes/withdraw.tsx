import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import {
  addPayoutMethod,
  getFinanceOverview,
  getWithdrawalOptions,
  requestWithdrawal,
} from "@/lib/finance.functions";
import { useCurrency } from "@/lib/currency";

export const Route = createFileRoute("/withdraw")({
  head: () => ({ meta: [{ title: "Withdraw Funds | Rio Bridge Finance" }] }),
  component: WithdrawPage,
});

type Config = {
  kind: string;
  display_name: string;
  fee_flat: number;
  fee_percent: number;
  network_fee: number;
  min_amount: number;
  max_amount: number | null;
  estimated_time: string;
  enabled: boolean;
  provider_configured: boolean;
};
type Method = {
  id: string;
  kind: string;
  label: string;
  masked_destination: string;
  is_verified: boolean;
  usable_after: string | null;
};
type Profile = {
  email_verified: boolean;
  phone_verified: boolean;
  kyc_status: string;
  two_factor_enabled: boolean;
};
type Withdrawal = {
  id: string;
  amount: number;
  net_amount: number;
  status: string;
  payout_kind: string;
  created_at: string;
};

function WithdrawPage() {
  const navigate = useNavigate();
  const { user, role, loading } = useGate("customer");
  const { format } = useCurrency();
  const [configs, setConfigs] = useState<Config[]>([]);
  const [methods, setMethods] = useState<Method[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [history, setHistory] = useState<Withdrawal[]>([]);
  const [methodId, setMethodId] = useState("");
  const [amount, setAmount] = useState("");
  const [newKind, setNewKind] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [destination, setDestination] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setBusy(true);
    setError("");
    try {
      const [options, overview] = await Promise.all([getWithdrawalOptions(), getFinanceOverview()]);
      setConfigs((options.configs as Config[]).filter((c) => c.enabled && c.provider_configured));
      setMethods(options.methods as Method[]);
      setProfile(options.profile as Profile | null);
      setHistory(overview.withdrawals as Withdrawal[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load withdrawals");
    }
    setBusy(false);
  }

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (role !== "customer") {
      navigate({ to: "/" });
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, role]);

  const selectedMethod = methods.find((m) => m.id === methodId);
  const selectedConfig = configs.find((c) => c.kind === selectedMethod?.kind);
  const calculation = useMemo(() => {
    const gross = Number(amount) || 0;
    const fee = selectedConfig
      ? Number(selectedConfig.fee_flat) + gross * Number(selectedConfig.fee_percent)
      : 0;
    const network = Number(selectedConfig?.network_fee ?? 0);
    return { gross, fee, network, net: Math.max(0, gross - fee - network) };
  }, [amount, selectedConfig]);

  async function addMethod(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await addPayoutMethod({ data: { kind: newKind as never, label: newLabel, destination } });
      setMessage(
        "Destination added. It must be verified and complete its security cooling-off period before use.",
      );
      setNewLabel("");
      setDestination("");
      await load();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Could not add destination");
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!confirmed) {
      setError("Confirm the withdrawal details before continuing");
      return;
    }
    setBusy(true);
    try {
      const result = await requestWithdrawal({
        data: {
          payout_method_id: methodId,
          amount: Number(amount),
          idempotency_key: `withdraw:${user?.id}:${Date.now()}:${crypto.randomUUID()}`,
        },
      });
      navigate({ to: "/withdraw/$id", params: { id: result.id } });
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Withdrawal failed");
      setBusy(false);
    }
  }

  if (loading || !user || (busy && !profile)) return <GateLoading />;
  const gates = [
    ["Email verified", profile?.email_verified],
    ["Phone verified", profile?.phone_verified],
    ["Identity verified", profile?.kyc_status === "verified"],
    ["Two-factor authentication", profile?.two_factor_enabled],
  ] as const;

  return (
    <AppShell title="Withdraw Funds" role="customer">
      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {message}
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Security requirements</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {gates.map(([label, ok]) => (
              <div
                key={label}
                className={`rounded border p-2 text-xs ${ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800"}`}
              >
                {ok ? "✓" : "!"} {label}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add payout destination</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addMethod} className="space-y-3">
              <div>
                <Label>Method</Label>
                <Select value={newKind} onValueChange={setNewKind}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a connected method" />
                  </SelectTrigger>
                  <SelectContent>
                    {configs.map((c) => (
                      <SelectItem key={c.kind} value={c.kind}>
                        {c.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nickname</Label>
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="My bank or wallet"
                />
              </div>
              <div>
                <Label>Destination</Label>
                <Input
                  required
                  minLength={4}
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Account, wallet or email"
                />
              </div>
              <Button disabled={busy || !newKind}>Add securely</Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">New withdrawal</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>Verified destination</Label>
              <Select value={methodId} onValueChange={setMethodId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose destination" />
                </SelectTrigger>
                <SelectContent>
                  {methods
                    .filter((m) => m.is_verified)
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label || m.kind} · {m.masked_destination}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount</Label>
              <Input
                inputMode="decimal"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            {selectedConfig && (
              <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Amount</span>
                  <b>{format(calculation.gross)}</b>
                </div>
                <div className="flex justify-between">
                  <span>Processing fee</span>
                  <span>{format(calculation.fee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Network fee</span>
                  <span>{format(calculation.network)}</span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span>You receive</span>
                  <b>{format(calculation.net)}</b>
                </div>
                <div className="text-xs text-muted-foreground">
                  Estimated time: {selectedConfig.estimated_time || "Provided after review"}
                </div>
              </div>
            )}
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1"
              />
              <span>I confirm the destination and fee details are correct.</span>
            </label>
            <Button disabled={busy || !methodId || !amount || !confirmed}>
              Request withdrawal
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Withdrawal history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {history.length === 0 && (
            <div className="text-sm text-muted-foreground">No withdrawals yet.</div>
          )}
          {history.map((w) => (
            <Link
              key={w.id}
              to="/withdraw/$id"
              params={{ id: w.id }}
              className="flex justify-between gap-3 rounded border p-3 text-sm"
            >
              <span>
                <b>{format(Number(w.amount))}</b>
                <span className="block text-xs text-muted-foreground">
                  {new Date(w.created_at).toLocaleString()}
                </span>
              </span>
              <span className="capitalize text-right">{w.status.replaceAll("_", " ")}</span>
            </Link>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
