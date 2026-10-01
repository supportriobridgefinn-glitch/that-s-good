import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, GateLoading, useGate } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/lib/currency";
import { maskName, maskPersonalText } from "@/lib/privacy";

export const Route = createFileRoute("/activity")({
  head: () => ({ meta: [{ title: "Activity | Rio Bridge Finance" }] }),
  component: Activity,
});

type Txn = {
  id: string;
  type: string;
  direction: string;
  account: string;
  amount: number;
  currency: string;
  memo: string;
  created_at: string;
  counterparty: Record<string, unknown>;
};
type Profile = { id: string; full_name: string; historical_pdf_path: string };

function Activity() {
  const navigate = useNavigate();
  const { user, role, loading } = useGate("customer");
  const { format: formatUsd } = useCurrency();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [tab, setTab] = useState<"current" | "historical">("current");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [direction, setDirection] = useState<"all" | "credit" | "debit">("all");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

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
    (async () => {
      const p = await supabase
        .from("profiles")
        .select("id,full_name,historical_pdf_path")
        .eq("id", user.id)
        .maybeSingle();
      setProfile(p.data as unknown as Profile);
      const t = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });
      setTxns((t.data ?? []) as unknown as Txn[]);
      if (p.data?.historical_pdf_path) {
        const signed = await supabase.storage
          .from("historical-statements")
          .createSignedUrl(p.data.historical_pdf_path, 3600);
        if (signed.data?.signedUrl) setPdfUrl(signed.data.signedUrl);
      }
    })();
  }, [loading, user, role, navigate]);

  const filtered = useMemo(() => {
    return txns.filter((t) => {
      if (direction !== "all" && t.direction !== direction) return false;
      if (q) {
        const hay = `${t.memo} ${JSON.stringify(t.counterparty || {})}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      if (from && new Date(t.created_at) < new Date(from)) return false;
      if (to && new Date(t.created_at) > new Date(to + "T23:59:59")) return false;
      return true;
    });
  }, [txns, q, from, to, direction]);

  if (loading || !profile) return <GateLoading />;

  return (
    <AppShell title="Account activity" role="customer">
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={tab === "current" ? "default" : "outline"}
          onClick={() => setTab("current")}
        >
          Current (2026)
        </Button>
        <Button
          size="sm"
          variant={tab === "historical" ? "default" : "outline"}
          onClick={() => setTab("historical")}
        >
          Historical statement (2015–2025)
        </Button>
      </div>

      {tab === "current" ? (
        <>
          <Card className="mb-4">
            <CardContent className="p-4 grid sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <Label className="text-xs">Search description / counterparty</Label>
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="e.g. Payroll"
                />
              </div>
              <div>
                <Label className="text-xs">From</Label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">To</Label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
              <div className="sm:col-span-4 flex flex-wrap gap-2">
                {(["all", "credit", "debit"] as const).map((d) => (
                  <Button
                    key={d}
                    size="sm"
                    variant={direction === d ? "default" : "outline"}
                    onClick={() => setDirection(d)}
                  >
                    {d[0].toUpperCase() + d.slice(1)}
                  </Button>
                ))}
                <span className="ml-auto text-xs text-muted-foreground self-center">
                  {filtered.length} matching
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-0 divide-y">
              {filtered.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground">No transactions match.</div>
              )}
              {filtered.map((t) => {
                const isBtc = t.account === "btc";
                return (
                  <Link
                    to="/receipt/$txnId"
                    params={{ txnId: t.id }}
                    key={t.id}
                    className="block p-3 hover:bg-muted"
                  >
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <div className="font-medium truncate capitalize">
                          {maskPersonalText(t.memo || t.type.replaceAll("_", " "))}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {new Date(t.created_at).toLocaleString()} ·{" "}
                          {maskName(String((t.counterparty as { name?: string })?.name || t.account))}
                        </div>
                      </div>
                      <div
                        className={`shrink-0 font-semibold ${t.direction === "debit" ? "text-red-600" : "text-emerald-600"}`}
                      >
                        {t.direction === "debit" ? "-" : "+"}
                        {isBtc ? `${t.amount} BTC` : formatUsd(Number(t.amount))}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Historical statement (PDF)</CardTitle>
          </CardHeader>
          <CardContent>
            {!pdfUrl ? (
              <div className="text-sm text-muted-foreground">
                No historical statement on file. When your admin uploads it, it will appear here.
              </div>
            ) : (
              <>
                <div className="mb-3 flex flex-wrap gap-2">
                  <a href={pdfUrl} download className="text-sm text-primary hover:underline">
                    Download PDF
                  </a>
                  <span className="text-xs text-muted-foreground self-center">
                    Use Ctrl/Cmd+F inside the PDF viewer to search.
                  </span>
                </div>
                <iframe
                  title="Historical statement"
                  src={pdfUrl}
                  className="w-full"
                  style={{ height: "70vh", border: "1px solid #ddd", borderRadius: 8 }}
                />
              </>
            )}
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
