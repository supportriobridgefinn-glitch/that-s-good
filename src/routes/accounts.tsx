import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, GateLoading, useGate } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrency } from "@/lib/currency";
import { getFinanceOverview, transferBetweenAccounts } from "@/lib/finance.functions";

export const Route = createFileRoute("/accounts")({
  head: () => ({
    meta: [
      { title: "My Accounts | Rio Bridge Finance" },
      {
        name: "description",
        content:
          "Earning, Savings and Investment accounts with verified balances, transfers and statements.",
      },
      { property: "og:title", content: "My Accounts | Rio Bridge Finance" },
      {
        property: "og:description",
        content: "Track your Earning, Savings and Investment balances in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Accounts,
});

type Account = {
  id: string;
  kind: "earning" | "savings" | "investment";
  is_primary: boolean;
  currency: string;
  status: string;
  available_balance: number;
  pending_balance: number;
  held_balance: number;
  last_transaction_at: string | null;
};
type Entry = {
  id: string;
  account_id: string;
  direction: "credit" | "debit";
  amount: number;
  category: string;
  reason: string;
  created_at: string;
  resulting_balance: number;
};
type Position = {
  id: string;
  name: string;
  principal: number;
  current_value: number;
  realized_returns: number;
  pending_returns: number;
  status: string;
  maturity_date: string | null;
};

const LABEL: Record<string, string> = {
  earning: "Earning Account",
  savings: "Savings Account",
  investment: "Investment Account",
};

function Accounts() {
  const navigate = useNavigate();
  const { user, role, loading } = useGate("customer");
  const { format } = useCurrency();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [ledger, setLedger] = useState<Entry[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [amount, setAmount] = useState("");
  const [dir, setDir] = useState<"to_savings" | "to_earning">("to_savings");

  async function load() {
    setBusy(true);
    try {
      const r = await getFinanceOverview();
      setAccounts(r.accounts as Account[]);
      setLedger(r.ledger as Entry[]);
      setPositions(r.positions as Position[]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
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

  const byKind = useMemo(() => {
    const m: Record<string, Account | undefined> = {};
    accounts.forEach((a) => {
      m[a.kind] = a;
    });
    return m;
  }, [accounts]);

  const earningBreakdown = useMemo(() => {
    const sum = (cat: string) =>
      ledger
        .filter((e) => e.category === cat && e.direction === "credit")
        .reduce((t, e) => t + Number(e.amount), 0);
    return {
      investment: sum("investment_return"),
      loan: sum("loan_proceeds"),
      bonus: sum("bonus"),
    };
  }, [ledger]);

  async function doTransfer(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setErr("Enter a valid amount");
      return;
    }
    try {
      await transferBetweenAccounts({
        data: {
          from: dir === "to_savings" ? "earning" : "savings",
          to: dir === "to_savings" ? "savings" : "earning",
          amount: amt,
          note: "",
          idempotency_key: `tr:${user?.id}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
        },
      });
      setMsg("Transfer completed.");
      setAmount("");
      await load();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : String(e2));
    }
  }

  if (loading || !user) return <GateLoading />;

  const card = (kind: "earning" | "savings" | "investment") => {
    const a = byKind[kind];
    return (
      <Card key={kind} className="border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm font-semibold text-foreground">{LABEL[kind]}</CardTitle>
            {kind === "earning" && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: "var(--brand-navy)" }}
              >
                PRIMARY ACCOUNT
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold text-foreground">
            {format(Number(a?.available_balance ?? 0))}
          </div>
          <div className="text-xs text-muted-foreground">Available · {a?.currency ?? "USD"}</div>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
            <div>
              Pending
              <div className="font-semibold text-foreground">
                {format(Number(a?.pending_balance ?? 0))}
              </div>
            </div>
            <div>
              On hold
              <div className="font-semibold text-foreground">
                {format(Number(a?.held_balance ?? 0))}
              </div>
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground">
            Status: <span className="font-medium">{a?.status ?? "pending"}</span>
            {a?.last_transaction_at
              ? ` · Last activity ${new Date(a.last_transaction_at).toLocaleDateString()}`
              : " · No activity yet"}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link to="/activity">
              <Button size="sm" variant="outline">
                View transactions
              </Button>
            </Link>
            {kind === "earning" && (
              <Link to="/withdraw">
                <Button size="sm" style={{ background: "var(--brand-navy)" }}>
                  Request withdrawal
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const invested = positions.reduce((t, p) => t + Number(p.principal), 0);
  const currentValue = positions.reduce((t, p) => t + Number(p.current_value), 0);
  const returns = positions.reduce((t, p) => t + Number(p.realized_returns), 0);
  const pendingReturns = positions.reduce((t, p) => t + Number(p.pending_returns), 0);

  return (
    <AppShell title="My accounts" role="customer">
      {err && <div className="mb-3 rounded-md bg-red-50 text-red-700 text-sm px-3 py-2">{err}</div>}
      {msg && (
        <div className="mb-3 rounded-md bg-emerald-50 text-emerald-700 text-sm px-3 py-2">
          {msg}
        </div>
      )}
      {busy && <div className="text-sm text-muted-foreground mb-3">Loading your accounts…</div>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {card("earning")}
        {card("savings")}
        {card("investment")}
      </div>

      <Card className="mt-4 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Earning breakdown</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Investment earnings</div>
            <div className="font-semibold">{format(earningBreakdown.investment)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Loan proceeds</div>
            <div className="font-semibold">{format(earningBreakdown.loan)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Bonuses</div>
            <div className="font-semibold">{format(earningBreakdown.bonus)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Available</div>
            <div className="font-semibold">
              {format(Number(byKind.earning?.available_balance ?? 0))}
            </div>
          </div>
          <div className="col-span-2 sm:col-span-4 text-[11px] text-muted-foreground">
            Loan proceeds are disbursed loan funds, not earnings.
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Transfer between Earning and Savings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={doTransfer} className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1">
              <Label className="text-xs">Direction</Label>
              <select
                value={dir}
                onChange={(e) => setDir(e.target.value as typeof dir)}
                className="w-full h-10 rounded-md border border-border px-3 text-sm"
              >
                <option value="to_savings">Earning → Savings</option>
                <option value="to_earning">Savings → Earning</option>
              </select>
            </div>
            <div className="flex-1">
              <Label className="text-xs">Amount</Label>
              <Input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <Button type="submit" style={{ background: "var(--brand-navy)" }}>
              Transfer
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-4 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Investment summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Total invested</div>
              <div className="font-semibold">{format(invested)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Current value</div>
              <div className="font-semibold">{format(currentValue)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Realized returns</div>
              <div className="font-semibold">{format(returns)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Pending returns</div>
              <div className="font-semibold">{format(pendingReturns)}</div>
            </div>
          </div>
          {positions.length === 0 ? (
            <div className="text-xs text-muted-foreground">No investment positions yet.</div>
          ) : (
            <div className="divide-y text-sm">
              {positions.map((p) => (
                <div key={p.id} className="py-2 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.status}
                      {p.maturity_date
                        ? ` · matures ${new Date(p.maturity_date).toLocaleDateString()}`
                        : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{format(Number(p.current_value))}</div>
                    <div className="text-xs text-muted-foreground">
                      invested {format(Number(p.principal))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">
            Investment values shown are current recorded values. Returns are not guaranteed and past
            performance does not predict future results.
          </p>
        </CardContent>
      </Card>
    </AppShell>
  );
}
