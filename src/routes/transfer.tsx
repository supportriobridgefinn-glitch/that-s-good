import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { AppShell, GateLoading, useGate } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { transferUsd, sendBtc as sendBtcFn } from "@/lib/transfers.functions";
import { BTC_USD_RATE, btcToUsd, formatBtc, formatUsd, usdToBtc } from "@/lib/btc";

const searchSchema = z.object({
  tab: z.enum(["local", "wire", "international", "btc_send", "btc_receive"]).default("local"),
});

export const Route = createFileRoute("/transfer")({
  head: () => ({ meta: [{ title: "Transfer | Rio Bridge Finance" }] }),
  validateSearch: searchSchema,
  component: TransferPage,
});

type Profile = {
  id: string;
  checking_balance: number;
  btc_balance: number;
  btc_deposit_address: string;
};

function TransferPage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const { user, role, loading } = useGate("customer");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

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
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, role]);

  async function refresh() {
    if (!user) return;
    const p = await supabase
      .from("profiles")
      .select("id,checking_balance,btc_balance,btc_deposit_address")
      .eq("id", user.id)
      .maybeSingle();
    setProfile(p.data as unknown as Profile);
  }

  async function submitUsd(
    type: "local" | "wire" | "international",
    amount: number,
    counterparty: Record<string, unknown>,
    memo: string,
  ) {
    setMsg(null);
    setErr(null);
    if (!profile) return;
    if (amount <= 0) {
      setErr("Enter an amount greater than zero");
      return;
    }
    if (amount > Number(profile.checking_balance)) {
      setErr("Insufficient loan balance");
      return;
    }
    try {
      const res = await transferUsd({ data: { kind: type, amount, counterparty, memo } });
      if (res?.txn_id) {
        navigate({ to: "/receipt/$txnId", params: { txnId: res.txn_id } });
        return;
      }
      setMsg(
        `${type === "local" ? "Local" : type === "wire" ? "Domestic" : "International"} repayment of ${formatUsd(amount)} submitted.`,
      );
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Transfer failed");
    }
  }

  async function sendBtc(amount: number, address: string, memo: string) {
    setMsg(null);
    setErr(null);
    if (!profile) return;
    if (amount <= 0) {
      setErr("Enter an amount greater than zero");
      return;
    }
    if (amount > Number(profile.btc_balance)) {
      setErr("Insufficient BTC balance");
      return;
    }
    if (!address || address.length < 10) {
      setErr("Enter a valid BTC address");
      return;
    }
    try {
      const res = await sendBtcFn({ data: { amount, address, memo } });
      if (res?.txn_id) {
        navigate({ to: "/receipt/$txnId", params: { txnId: res.txn_id } });
        return;
      }
      setMsg(`Sent ${formatBtc(amount)} to ${address.slice(0, 12)}…`);
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Send failed");
    }
  }

  if (loading || !profile) return <GateLoading />;

  return (
    <AppShell title="Move money" role="customer">
      {msg && (
        <div className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-3">
          {msg}
        </div>
      )}
      {err && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
          {err}
        </div>
      )}

      <div className="mb-4 text-sm text-muted-foreground">
        Loan balance: <b>{formatUsd(profile.checking_balance)}</b> · BTC:{" "}
        <b>{formatBtc(profile.btc_balance)}</b> (≈{" "}
        {formatUsd(btcToUsd(Number(profile.btc_balance)))})
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => navigate({ to: "/transfer", search: { tab: v as never } })}
      >
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="local">Local Repayment</TabsTrigger>
          <TabsTrigger value="wire">Domestic Repayment</TabsTrigger>
          <TabsTrigger value="international">International</TabsTrigger>
          <TabsTrigger value="btc_send">Send BTC</TabsTrigger>
          <TabsTrigger value="btc_receive">Receive BTC</TabsTrigger>
        </TabsList>

        <TabsContent value="local">
          <UsdForm kind="local" onSubmit={submitUsd} />
        </TabsContent>
        <TabsContent value="wire">
          <UsdForm kind="wire" onSubmit={submitUsd} />
        </TabsContent>
        <TabsContent value="international">
          <InternationalForm onSubmit={submitUsd} />
        </TabsContent>
        <TabsContent value="btc_send">
          <BtcSendForm onSubmit={sendBtc} />
        </TabsContent>
        <TabsContent value="btc_receive">
          <BtcReceive address={profile.btc_deposit_address} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function UsdForm({
  kind,
  onSubmit,
}: {
  kind: "local" | "wire";
  onSubmit: (
    k: "local" | "wire" | "international",
    amt: number,
    cp: Record<string, unknown>,
    memo: string,
  ) => void;
}) {
  const [form, setForm] = useState({
    bank: "",
    routing: "",
    account: "",
    name: "",
    amount: "",
    memo: "",
  });
  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{kind === "local" ? "Local repayment" : "Domestic loan repayment"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid sm:grid-cols-2 gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(
              kind,
              parseFloat(form.amount || "0"),
              {
                name: form.name,
                bank: form.bank,
                routing: form.routing,
                account: form.account,
              },
              form.memo,
            );
          }}
        >
          <Field label="Recipient name" v={form.name} onChange={(v) => set("name", v)} />
          <Field label="Lender / receiver name" v={form.bank} onChange={(v) => set("bank", v)} />
          <Field label="Reference number" v={form.routing} onChange={(v) => set("routing", v)} />
          <Field label="Account number" v={form.account} onChange={(v) => set("account", v)} />
          <Field
            label="Amount (USD)"
            type="number"
            v={form.amount}
            onChange={(v) => set("amount", v)}
          />
          <Field label="Memo" v={form.memo} onChange={(v) => set("memo", v)} />
          <div className="sm:col-span-2">
            <Button type="submit" style={{ background: "var(--brand-navy)" }}>
              Submit {kind === "local" ? "repayment" : "repayment"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function InternationalForm({
  onSubmit,
}: {
  onSubmit: (
    k: "local" | "wire" | "international",
    amt: number,
    cp: Record<string, unknown>,
    memo: string,
  ) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    iban: "",
    swift: "",
    country: "",
    currency: "USD",
    amount: "",
    purpose: "",
  });
  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>International repayment</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid sm:grid-cols-2 gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit("international", parseFloat(form.amount || "0"), form, form.purpose);
          }}
        >
          <Field label="Recipient name" v={form.name} onChange={(v) => set("name", v)} />
          <Field label="IBAN" v={form.iban} onChange={(v) => set("iban", v)} />
          <Field label="SWIFT / BIC" v={form.swift} onChange={(v) => set("swift", v)} />
          <Field label="Country" v={form.country} onChange={(v) => set("country", v)} />
          <Field label="Currency" v={form.currency} onChange={(v) => set("currency", v)} />
          <Field
            label="Amount (USD debited)"
            type="number"
            v={form.amount}
            onChange={(v) => set("amount", v)}
          />
          <div className="sm:col-span-2">
            <Label>Purpose of payment</Label>
            <Textarea value={form.purpose} onChange={(e) => set("purpose", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" style={{ background: "var(--brand-navy)" }}>
              Submit international repayment
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function BtcSendForm({
  onSubmit,
}: {
  onSubmit: (amt: number, addr: string, memo: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [memo, setMemo] = useState("");
  const usd = parseFloat(amount || "0");
  const btc = usdToBtc(usd);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Bitcoin</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid sm:grid-cols-2 gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(parseFloat(amount || "0"), address, memo);
          }}
        >
          <Field label="Amount (BTC)" type="number" v={amount} onChange={setAmount} />
          <div className="text-xs text-muted-foreground self-end pb-2">
            ≈ {formatUsd(btcToUsd(parseFloat(amount || "0")))} at {formatUsd(BTC_USD_RATE)}/BTC
          </div>
          <div className="sm:col-span-2">
            <Field label="Destination BTC address" v={address} onChange={setAddress} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Memo" v={memo} onChange={setMemo} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
              Send {amount ? formatBtc(parseFloat(amount)) : "BTC"}
            </Button>
          </div>
        </form>
        {usd > 0 && (
          <div className="text-xs text-muted-foreground mt-3">
            Reverse: {formatUsd(usd)} ≈ {btc.toFixed(8)} BTC
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BtcReceive({ address }: { address: string }) {
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(address)}`;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Receive Bitcoin</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row items-center gap-6">
        <img src={qr} alt="BTC address QR" width={200} height={200} className="rounded border" />
        <div>
          <div className="text-sm text-muted-foreground mb-1">Your receiving address</div>
          <code className="block bg-muted px-3 py-2 rounded break-all text-sm">{address}</code>
          <div className="text-xs text-muted-foreground mt-3">
            Once funds arrive, your administrator will update your BTC balance.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  v,
  onChange,
  type = "text",
}: {
  label: string;
  v: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type={type} value={v} onChange={(e) => onChange(e.target.value)} required />
    </div>
  );
}
