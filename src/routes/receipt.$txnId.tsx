import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useGate, GateLoading } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download, FileText, User } from "lucide-react";
import { useCurrency, CurrencySelect } from "@/lib/currency";
import { maskIdentifier, maskName, maskPersonalText } from "@/lib/privacy";

export const Route = createFileRoute("/receipt/$txnId")({
  head: () => ({ meta: [{ title: "Transaction receipt | RIO BRIDGE FINANCE" }] }),
  component: Receipt,
});

type Txn = {
  id: string;
  user_id: string;
  type: string;
  direction: string;
  account: string;
  amount: number;
  currency: string;
  counterparty: Record<string, unknown>;
  memo: string;
  status: string;
  created_at: string;
};
type Profile = {
  full_name: string;
  account_number: string;
  routing_number: string;
  opening_balance: number;
};

function shortRef(uuid: string) {
  // Compact uppercase reference similar to the screenshot's "V05RF92TR6Y48WL"
  return ("V" + uuid.replace(/-/g, "").toUpperCase()).slice(0, 16);
}

function Receipt() {
  const { txnId } = Route.useParams();
  const navigate = useNavigate();
  const { user, role, loading } = useGate("customer");
  const cx = useCurrency();
  const [t, setT] = useState<Txn | null>(null);
  const [p, setP] = useState<Profile | null>(null);
  const [history, setHistory] = useState<Txn[]>([]);

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
      const r = await supabase.from("transactions").select("*").eq("id", txnId).maybeSingle();
      setT(r.data as unknown as Txn);
      const prof = await supabase
        .from("profiles")
        .select("full_name,account_number,routing_number,opening_balance")
        .eq("id", user.id)
        .maybeSingle();
      setP(prof.data as unknown as Profile);
      const all = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      setHistory((all.data ?? []) as unknown as Txn[]);
    })();
  }, [loading, user, role, txnId, navigate]);

  const balanceAfter = useMemo(() => {
    if (!t || !p) return 0;
    let bal = Number(p.opening_balance || 0);
    for (const x of history) {
      if (x.status !== "completed") continue;
      const amt = Number(x.amount);
      bal += x.direction === "credit" ? amt : -amt;
      if (x.id === t.id) break;
    }
    return bal;
  }, [t, p, history]);

  if (loading || !t || !p) return <GateLoading />;

  const cp = t.counterparty as {
    name?: string;
    bank?: string;
    account?: string;
    routing?: string;
    address?: string;
    iban?: string;
  };
  const isBtc = t.account === "btc";
  const isCredit = t.direction === "credit";
  const isCancelled = t.status === "cancelled";
  const RED = "#B91C1C";
  const NAV = "var(--brand-navy)";
  const GREEN = "#059669";

  const txDate = new Date(t.created_at);
  const dateLabel = txDate.toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
  const timeLabel = txDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const fmt = (usd: number) => (isBtc ? `${Number(usd).toFixed(8)} BTC` : cx.format(usd));
  const fmtBal = (usd: number) => cx.format(usd);

  return (
    <div className="min-h-screen bg-muted">
      <div className="max-w-xl mx-auto bg-card shadow-md min-h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b print:hidden">
          <button
            onClick={() => navigate({ to: "/activity" })}
            className="flex items-center gap-2 text-sm text-foreground"
          >
            <ArrowLeft size={16} /> Back to Transactions
          </button>
          <div className="flex items-center gap-2">
            <CurrencySelect className="bg-card border border-border text-foreground text-xs rounded px-2 py-1" />
            <button
              onClick={() => window.print()}
              className="border rounded p-2"
              aria-label="Print"
            >
              <Printer size={16} />
            </button>
            <a
              href={`#`}
              onClick={(e) => {
                e.preventDefault();
                window.print();
              }}
              className="border rounded p-2"
              aria-label="Download"
            >
              <Download size={16} />
            </a>
          </div>
        </div>

        {/* Red header */}
        <div className="px-5 py-5 relative" style={{ background: RED, color: "white" }}>
          <div
            className="absolute top-3 right-4 text-[10px] font-semibold tracking-wider px-2 py-1 rounded"
            style={{ background: "rgba(0,0,0,0.25)" }}
          >
            {isCancelled ? "CANCELLED" : "PROCESSED"}
          </div>
          <div className="flex items-center gap-2 mb-1">
            <img
              src="/site/images/rio-bridge-logo.png"
              alt="RIO BRIDGE FINANCE"
              className="h-7 w-auto opacity-95"
            />
            <div className="text-sm font-semibold opacity-95">RIO BRIDGE FINANCE</div>
          </div>
          <div className="text-sm opacity-95">Transaction Receipt</div>
        </div>

        {/* Amount */}
        <div className="px-5 py-5 border-b">
          <div className="text-[11px] font-semibold tracking-wider text-muted-foreground mb-1">
            TRANSACTION AMOUNT
          </div>
          <div className="flex items-center justify-between gap-3">
            <div
              className="text-2xl sm:text-3xl font-bold"
              style={{ color: isCancelled ? "#9CA3AF" : isCredit ? GREEN : RED }}
            >
              {isCancelled ? "" : isCredit ? "+ " : "- "}
              {fmt(t.amount)}
            </div>
            <div
              className="rounded p-2"
              style={{
                background: isCredit ? "#D1FAE5" : "#DBEAFE",
                color: isCredit ? GREEN : RED,
              }}
            >
              {isCredit ? "↙" : "↗"}
            </div>
          </div>
          <div
            className="mt-3 text-xs rounded px-3 py-2"
            style={{ background: "#ECFDF5", color: "#047857" }}
          >
            ⓘ {isCredit ? "Funds received to your account" : "Funds debited from your account"}
          </div>
        </div>

        {/* Transaction details */}
        <Section icon={<FileText size={16} className="text-red-600" />} title="TRANSACTION DETAILS">
          <Field label="TRANSACTION ID" value={shortRef(t.id)} copy />
          <Field label="TRANSACTION DATE" value={`${dateLabel} - ${timeLabel}`} />
          <Field
            label="PAYMENT METHOD"
            value={
              t.type === "wire"
                ? "Wire Transfer"
                : t.type === "domestic"
                  ? "Domestic Transfer"
                  : t.type === "internal"
                    ? "Internal Transfer"
                    : t.type.replaceAll("_", " ")
            }
          />
          <Field label="TRANSACTION TYPE">
            <span
              className="inline-block px-2 py-0.5 text-[11px] font-semibold rounded"
              style={{
                background: isCredit ? "#D1FAE5" : "#DBEAFE",
                color: isCredit ? GREEN : RED,
              }}
            >
              {isCredit ? "CREDIT" : "DEBIT"}
            </span>
          </Field>
        </Section>

        {/* Sender / Recipient */}
        <Section
          icon={<User size={16} />}
          title={isCredit ? "Sender Information" : "Recipient Information"}
        >
          <Field label="ACCOUNT NAME" value={maskName(cp.name)} />
          <Field
            label="ACCOUNT NUMBER"
            value={maskIdentifier(cp.account || cp.iban || (isCredit ? "" : p.account_number))}
          />
          <Field label="LENDER / RECEIVER NAME" value={cp.bank || "—"} />
          <Field label="TRANSACTION DESCRIPTION" value={maskPersonalText(t.memo)} />
          <Field label="BALANCE AFTER TRANSACTION" value={fmtBal(balanceAfter)} strong />
        </Section>

        {/* Notice */}
        <div
          className="mx-5 my-5 rounded border p-3 flex gap-3 text-xs"
          style={{ background: "#EFF6FF", borderColor: "#93C5FD" }}
        >
          <div className="shrink-0">🛡️</div>
          <div>
            <div className="font-semibold mb-1" style={{ color: RED }}>
              Important Notice
            </div>
            <p className="text-foreground leading-relaxed">
              This is an official transaction receipt from RIO BRIDGE FINANCE. Please retain this
              receipt for your records. If you have any questions about this transaction, please
              contact us at{" "}
              <a className="underline" href="mailto:support@riobridgefinance.com">
                support@riobridgefinance.com
              </a>{" "}
              or through live chat.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-6 space-y-3 print:hidden">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => window.print()}>
              <Printer size={14} className="mr-2" /> Print Receipt
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => window.print()}>
              <Download size={14} className="mr-2" /> Download PDF
            </Button>
          </div>
          <Link
            to="/activity"
            className="block text-center text-sm text-white py-3 rounded font-medium"
            style={{ background: RED }}
          >
            ← Back to Transactions
          </Link>
          <div className="text-center text-[10px] text-muted-foreground pt-2">
            RIO BRIDGE FINANCE · Private Loans and Loan Management · Computer-generated receipt
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-5 py-4 border-b">
      <div className="flex items-center gap-2 mb-3 text-[12px] font-bold tracking-wider text-foreground">
        {icon}
        <span>{title}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  children,
  copy,
  strong,
}: {
  label: string;
  value?: string | number;
  children?: React.ReactNode;
  copy?: boolean;
  strong?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] font-semibold tracking-wider text-muted-foreground mb-1">{label}</div>
      <div
        className={`rounded border px-3 py-2 text-sm bg-muted/50 flex items-center justify-between gap-2 ${strong ? "font-bold text-foreground" : "text-foreground"}`}
      >
        <span className="break-all">{children ?? value}</span>
        {copy && typeof value === "string" && (
          <button
            onClick={() => navigator.clipboard?.writeText(value)}
            aria-label="Copy"
            className="text-muted-foreground hover:text-foreground"
          >
            ⧉
          </button>
        )}
      </div>
    </div>
  );
}
