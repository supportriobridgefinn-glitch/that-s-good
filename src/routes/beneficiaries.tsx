import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, GateLoading, useGate } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserRoundPlus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/beneficiaries")({ head: () => ({ meta: [{ title: "Beneficiaries | Rio Bridge Finance" }] }), component: BeneficiariesPage });
type Ben = { id: string; name: string; account_number: string; bank_name: string; routing_number: string; beneficiary_type: string; status: string };
function BeneficiariesPage() {
  const navigate = useNavigate(); const { user, role, loading } = useGate("customer");
  const [rows,setRows]=useState<Ben[]>([]); const [name,setName]=useState(""); const [acct,setAcct]=useState(""); const [bank,setBank]=useState(""); const [routing,setRouting]=useState(""); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  async function load(){ if(!user) return; const {data}=await supabase.from("beneficiaries").select("id,name,account_number,bank_name,routing_number,beneficiary_type,status").eq("user_id",user.id).order("created_at",{ascending:false}); setRows((data??[]) as unknown as Ben[]); }
  useEffect(()=>{if(loading)return;if(!user){navigate({to:"/login"});return;}if(role!=="customer"){navigate({to:"/"});return;}void load();},[loading,user,role,navigate]);
  async function add(e:React.FormEvent){e.preventDefault();if(!user)return;setBusy(true);setError("");const {error}=await supabase.from("beneficiaries").insert({user_id:user.id,name,account_number:acct,bank_name:bank,routing_number:routing});if(error)setError(error.message);else{setName("");setAcct("");setBank("");setRouting("");await load();}setBusy(false);}
  async function remove(id:string){if(!confirm("Remove this beneficiary?"))return;await supabase.from("beneficiaries").delete().eq("id",id);await load();}
  if(loading||!user)return <GateLoading/>;
  return <AppShell title="Beneficiaries" role="customer"><div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]"><Card><CardHeader><CardTitle className="flex items-center gap-2"><UserRoundPlus size={18}/> Add beneficiary</CardTitle></CardHeader><CardContent><form onSubmit={add} className="space-y-3">{error&&<div className="rounded bg-red-50 p-2 text-xs text-red-700">{error}</div>}<div><Label>Name</Label><Input required value={name} onChange={e=>setName(e.target.value)}/></div><div><Label>Account number</Label><Input required inputMode="numeric" value={acct} onChange={e=>setAcct(e.target.value)}/></div><div><Label>Bank name</Label><Input required value={bank} onChange={e=>setBank(e.target.value)}/></div><div><Label>Routing number</Label><Input value={routing} onChange={e=>setRouting(e.target.value)}/></div><Button disabled={busy} className="bg-[var(--brand-navy)]">{busy?"Saving…":"Save beneficiary"}</Button></form></CardContent></Card><Card><CardHeader><CardTitle>Saved beneficiaries</CardTitle></CardHeader><CardContent className="space-y-2">{rows.length===0?<div className="text-sm text-muted-foreground">No beneficiaries saved.</div>:rows.map(b=><div key={b.id} className="flex items-center justify-between gap-3 rounded-xl border p-3"><div className="min-w-0"><div className="font-semibold truncate">{b.name}</div><div className="text-xs text-muted-foreground truncate">{b.bank_name} · ••••{b.account_number.slice(-4)}</div></div><button onClick={()=>void remove(b.id)} aria-label={`Remove ${b.name}`} className="text-muted-foreground hover:text-red-600"><Trash2 size={16}/></button></div>)}</CardContent></Card></div></AppShell>;
}
