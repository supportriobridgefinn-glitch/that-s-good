import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, GateLoading, useGate } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { applyForLoan, getLoanOverview } from "@/lib/banking.functions";
import { useCurrency } from "@/lib/currency";
import { Landmark, CalendarClock, CheckCircle2, Clock3 } from "lucide-react";

export const Route = createFileRoute("/loans")({ head: () => ({ meta: [{ title: "Loans | Rio Bridge Finance" }] }), component: LoansPage });

type Loan = { id: string; principal: number; outstanding_principal: number; status: string; purpose: string; term_months: number; interest_rate: number; monthly_payment: number; next_payment_date: string | null; application_reference: string };
type Payment = { id: string; amount: number; principal_amount: number; interest_amount: number; reference: string; payment_date: string };

function LoansPage() {
  const navigate = useNavigate();
  const { user, role, loading } = useGate("customer");
  const { format } = useCurrency();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [active, setActive] = useState(0);
  const [pending, setPending] = useState(0);
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("Personal financing");
  const [term, setTerm] = useState("24");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const r = await getLoanOverview();
    setLoans(r.loans as Loan[]); setPayments(r.payments as Payment[]); setActive(Number(r.active_balance)); setPending(Number(r.pending_amount));
  }
  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    if (role !== "customer") { navigate({ to: "/" }); return; }
    void load();
  }, [loading, user, role, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setMessage("");
    try { await applyForLoan({ data: { amount: Number(amount), purpose, term_months: Number(term) } }); setAmount(""); setMessage("Loan application submitted for review."); await load(); }
    catch (e2) { setError(e2 instanceof Error ? e2.message : "Could not submit application"); }
    finally { setBusy(false); }
  }
  if (loading || !user) return <GateLoading />;
  return <AppShell title="Loans" role="customer">
    {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
    {message && <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">{message}</div>}
    <div className="grid grid-cols-2 gap-3 mb-5"><Stat label="Loan balance" value={format(active)} icon={<Landmark size={18} />} /><Stat label="Pending loan" value={format(pending)} icon={<Clock3 size={18} />} /></div>
    <Card className="mb-5"><CardHeader><CardTitle>Apply for a loan</CardTitle></CardHeader><CardContent><form onSubmit={submit} className="grid gap-4 sm:grid-cols-2"><div><Label>Amount</Label><Input inputMode="decimal" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="10000" /></div><div><Label>Term</Label><select className="h-10 w-full rounded-md border px-3 text-sm" value={term} onChange={(e) => setTerm(e.target.value)}><option value="12">12 months</option><option value="24">24 months</option><option value="36">36 months</option><option value="48">48 months</option><option value="60">60 months</option></select></div><div className="sm:col-span-2"><Label>Purpose</Label><Input required value={purpose} onChange={(e) => setPurpose(e.target.value)} /></div><div className="sm:col-span-2"><Button disabled={busy || !amount} className="bg-[var(--brand-navy)]">{busy ? "Submitting…" : "Submit loan application"}</Button></div></form></CardContent></Card>
    <div className="space-y-3"><h2 className="font-bold">Loan history</h2>{loans.length === 0 ? <Card><CardContent className="p-5 text-sm text-muted-foreground">No loan applications yet.</CardContent></Card> : loans.map((l) => <Card key={l.id}><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-bold text-foreground">{format(Number(l.principal))}</div><div className="text-xs text-muted-foreground mt-1">{l.application_reference || "Loan application"} · {l.purpose}</div></div><span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold capitalize">{l.status.replaceAll("_", " ")}</span></div><div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs"><div>Outstanding<div className="font-semibold mt-1">{format(Number(l.outstanding_principal || 0))}</div></div><div>Rate<div className="font-semibold mt-1">{Number(l.interest_rate || 0).toFixed(2)}%</div></div><div>Monthly payment<div className="font-semibold mt-1">{format(Number(l.monthly_payment || 0))}</div></div><div>Next payment<div className="font-semibold mt-1">{l.next_payment_date ? new Date(l.next_payment_date).toLocaleDateString() : "—"}</div></div></div></CardContent></Card>)}</div>
    <div className="mt-6"><h2 className="font-bold mb-3">Recent loan payments</h2>{payments.length === 0 ? <div className="text-sm text-muted-foreground">No loan payments recorded.</div> : <div className="rounded-xl border bg-card divide-y">{payments.slice(0,8).map((p) => <div key={p.id} className="p-3 flex justify-between text-sm"><span>{new Date(p.payment_date).toLocaleDateString()} · {p.reference}</span><b>{format(Number(p.amount))}</b></div>)}</div>}</div>
    <div className="mt-6 rounded-xl bg-muted p-4 text-xs text-muted-foreground flex gap-2"><CheckCircle2 size={16} className="shrink-0" /> Loan applications are reviewed by Rio Bridge Finance. Approved funds and repayment schedules are shown here after approval.</div>
  </AppShell>;
}
function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <div className="rounded-2xl border bg-card p-4"><div className="flex justify-between text-muted-foreground text-xs"><span>{label}</span>{icon}</div><div className="mt-2 text-xl font-extrabold">{value}</div></div>; }
