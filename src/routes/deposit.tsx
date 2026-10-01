import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, GateLoading, useGate } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Copy, Bitcoin, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/deposit")({ head: () => ({ meta: [{ title: "Deposit | Rio Bridge Finance" }] }), component: DepositPage });
function DepositPage() {
  const navigate = useNavigate(); const { user, role, loading } = useGate("customer");
  const [p, setP] = useState<{ account_number: string; routing_number: string; btc_deposit_address: string } | null>(null);
  useEffect(() => { if (loading) return; if (!user) { navigate({ to: "/login" }); return; } if (role !== "customer") { navigate({ to: "/" }); return; } void supabase.from("profiles").select("account_number,routing_number,btc_deposit_address").eq("id", user.id).maybeSingle().then(({ data }) => setP(data as typeof p)); }, [loading,user,role,navigate]);
  if (loading || !p) return <GateLoading />;
  const copy = async (v: string) => { await navigator.clipboard?.writeText(v); };
  return <AppShell title="Deposit funds" role="customer"><div className="grid gap-4 md:grid-cols-2"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Building2 size={18}/> Bank transfer</CardTitle></CardHeader><CardContent className="space-y-4 text-sm"><Info label="Account number" value={p.account_number} copy={() => void copy(p.account_number)} /><Info label="Routing number" value={p.routing_number || "Contact support for routing details"} copy={p.routing_number ? () => void copy(p.routing_number) : undefined} /><div className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">Use the exact account name and number shown by Rio Bridge Finance when initiating a transfer. Deposits may remain pending until verified.</div></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><Bitcoin size={18}/> Crypto deposit</CardTitle></CardHeader><CardContent className="space-y-4 text-sm"><Info label="Bitcoin address" value={p.btc_deposit_address} copy={() => void copy(p.btc_deposit_address)} /><div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">Send only Bitcoin on the supported network to this address. Crypto deposits are credited after network confirmation.</div></CardContent></Card></div><div className="mt-4 rounded-xl border bg-card p-4 text-sm text-muted-foreground flex gap-3"><ShieldCheck size={19} className="text-emerald-600 shrink-0"/><span>For your security, Rio Bridge Finance does not ask for your password or PIN to receive a deposit.</span></div></AppShell>;
}
function Info({ label, value, copy }: { label: string; value: string; copy?: () => void }) { return <div><div className="text-xs text-muted-foreground mb-1">{label}</div><div className="flex items-center gap-2 rounded-lg border p-3 font-mono text-xs break-all"><span className="min-w-0 flex-1">{value}</span>{copy && <button onClick={copy} aria-label={`Copy ${label}`}><Copy size={15}/></button>}</div></div>; }
