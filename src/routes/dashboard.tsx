import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, GateLoading, useGate } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { getLoanOverview } from "@/lib/banking.functions";
import { useCurrency } from "@/lib/currency";
import { maskName, maskPersonalText } from "@/lib/privacy";
import { ArrowDownToLine, ArrowLeftRight, CreditCard, Eye, EyeOff, HandCoins, Landmark, PiggyBank, WalletCards } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard | Rio Bridge Finance" }] }),
  component: Dashboard,
});

type Profile = { first_name: string; full_name: string; checking_balance: number; savings_balance: number; status: string };
type Account = { kind: string; available_balance: number; pending_balance: number; held_balance: number };
type LoanSummary = { active_balance: number; pending_amount: number };
type Txn = { id: string; direction: string; amount: number; memo: string; created_at: string; counterparty: Record<string, unknown> };

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const navigate = useNavigate();
  const { user, role, loading } = useGate("customer");
  const { format } = useCurrency();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loans, setLoans] = useState<LoanSummary>({ active_balance: 0, pending_amount: 0 });
  const [recent, setRecent] = useState<Txn[]>([]);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    if (role !== "customer") { navigate({ to: "/" }); return; }
    (async () => {
      const [p, a, l, t] = await Promise.all([
        supabase.from("profiles").select("first_name,full_name,checking_balance,savings_balance,status").eq("id", user.id).maybeSingle(),
        supabase.from("user_accounts" as never).select("kind,available_balance,pending_balance,held_balance").eq("user_id", user.id),
        getLoanOverview(),
        supabase.from("transactions").select("id,direction,amount,memo,created_at,counterparty").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      ]);
      setProfile(p.data as unknown as Profile);
      setAccounts((a.data ?? []) as unknown as Account[]);
      setLoans({ active_balance: Number(l.active_balance || 0), pending_amount: Number(l.pending_amount || 0) });
      setRecent((t.data ?? []) as unknown as Txn[]);
    })();
  }, [loading, user, role, navigate]);

  const map = useMemo(() => Object.fromEntries(accounts.map((a) => [a.kind, a])), [accounts]);
  if (loading || !profile) return <GateLoading />;
  const first = profile.first_name || profile.full_name.split(" ")[0] || "there";
  const accountBalance = Number(profile.checking_balance || 0) + Number(profile.savings_balance || 0);
  const mask = (v: number) => hidden ? "••••••" : format(v);

  const actions = [
    { label: "Transfer", to: "/transfer", icon: <ArrowLeftRight size={19} /> },
    { label: "Deposit", to: "/deposit", icon: <ArrowDownToLine size={19} /> },
    { label: "Withdraw", to: "/withdraw", icon: <HandCoins size={19} /> },
    { label: "Loans", to: "/loans", icon: <Landmark size={19} /> },
  ];

  return (
    <AppShell title="" role="customer" hideTitle>
      <div className="mb-5">
        <div className="text-sm text-muted-foreground">{greeting()} 👋</div>
        <div className="mt-1 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{maskName(first)}</h1>
            <p className="text-xs text-muted-foreground mt-1">Account status: <span className="font-semibold text-emerald-600 capitalize">{profile.status}</span></p>
          </div>
          <button aria-label={hidden ? "Show balances" : "Hide balances"} onClick={() => setHidden((v) => !v)} className="rounded-full border p-2 text-muted-foreground hover:bg-muted">
            {hidden ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <section className="rounded-3xl p-5 text-white shadow-xl overflow-hidden relative" style={{ background: "var(--gradient-brand)" }}>
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-card/5" />
        <div className="absolute -right-20 bottom-0 h-36 w-36 rounded-full bg-card/5" />
        <div className="relative">
          <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-white/70">
            <span>Total account balance</span><span>USD</span>
          </div>
          <div className="mt-2 text-4xl font-black tracking-tight">{mask(accountBalance)}</div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-card/10 p-3"><div className="text-white/60">Checking</div><div className="mt-1 font-bold">{mask(Number(profile.checking_balance))}</div></div>
            <div className="rounded-2xl bg-card/10 p-3"><div className="text-white/60">Savings</div><div className="mt-1 font-bold">{mask(Number(profile.savings_balance))}</div></div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <SummaryCard label="Loan balance" value={mask(loans.active_balance)} icon={<Landmark size={18} />} />
        <SummaryCard label="Pending loan" value={mask(loans.pending_amount)} icon={<WalletCards size={18} />} />
      </div>

      <div className="grid grid-cols-4 gap-2 mt-5">
        {actions.map((a) => <Link key={a.label} to={a.to} className="flex flex-col items-center gap-2 text-center"><span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--brand-navy)] text-[var(--primary)] shadow-sm">{a.icon}</span><span className="text-[11px] font-semibold text-foreground">{a.label}</span></Link>)}
      </div>

      <section className="mt-6">
        <div className="flex items-center justify-between mb-3"><h2 className="font-bold text-foreground">Your accounts</h2><Link to="/accounts" className="text-xs font-semibold text-[var(--brand-navy)]">View all</Link></div>
        <div className="grid gap-3 sm:grid-cols-3">
          <AccountMini icon={<WalletCards size={19} />} name="Earning Account" value={mask(Number(map.earning?.available_balance ?? profile.checking_balance))} />
          <AccountMini icon={<PiggyBank size={19} />} name="Savings Account" value={mask(Number(map.savings?.available_balance ?? profile.savings_balance))} />
          <AccountMini icon={<CreditCard size={19} />} name="Investment Account" value={mask(Number(map.investment?.available_balance ?? 0))} />
        </div>
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between mb-3"><h2 className="font-bold text-foreground">Recent activity</h2><Link to="/activity" className="text-xs font-semibold text-[var(--brand-navy)]">See all</Link></div>
        <div className="rounded-2xl bg-card border border-border divide-y overflow-hidden">
          {recent.length === 0 ? <div className="p-5 text-sm text-muted-foreground">No recent transactions.</div> : recent.map((t) => <Link key={t.id} to="/receipt/$txnId" params={{ txnId: t.id }} className="flex items-center justify-between gap-3 p-4 hover:bg-muted"><div className="min-w-0"><div className="font-semibold text-sm truncate">{maskPersonalText(t.memo || "Account transaction")}</div><div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()} · {maskName(String(t.counterparty?.name || "Rio Bridge Finance"))}</div></div><div className={`font-bold text-sm ${t.direction === "credit" ? "text-emerald-600" : "text-foreground"}`}>{t.direction === "credit" ? "+" : "-"}{format(Number(t.amount))}</div></Link>)}
        </div>
      </section>
    </AppShell>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <div className="rounded-2xl bg-card border border-border p-4"><div className="flex items-center justify-between text-muted-foreground"><span className="text-xs">{label}</span><span>{icon}</span></div><div className="mt-2 text-xl font-extrabold text-foreground">{value}</div></div>;
}
function AccountMini({ icon, name, value }: { icon: React.ReactNode; name: string; value: string }) {
  return <div className="rounded-2xl bg-card border border-border p-4"><div className="flex items-center gap-2 text-muted-foreground">{icon}<span className="text-xs font-semibold">{name}</span></div><div className="mt-3 font-bold text-foreground">{value}</div></div>;
}
