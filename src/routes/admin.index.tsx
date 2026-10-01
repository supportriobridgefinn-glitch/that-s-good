import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, GateLoading, useGate } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
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
  adminCreateCustomer,
  adminDuplicateCustomer,
} from "@/lib/banking.functions";
import { formatBtc, formatUsd } from "@/lib/btc";
import { COUNTRIES, ACCOUNT_TYPES, CURRENCIES } from "@/lib/options";
import { maskIdentifier, maskName } from "@/lib/privacy";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin | Rio Bridge Finance" }] }),
  component: AdminHome,
});

type Row = {
  id: string;
  full_name: string;
  account_number: string;
  status: string;
  checking_balance: number;
  savings_balance: number;
  loans_balance: number;
  btc_balance: number;
};

function AdminHome() {
  const navigate = useNavigate();
  const { user, role, loading } = useGate("admin");
  const [rows, setRows] = useState<Row[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [dupSource, setDupSource] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, role]);

  async function load() {
    const r = await supabase
      .from("profiles")
      .select(
        "id,full_name,account_number,status,checking_balance,savings_balance,loans_balance,btc_balance",
      )
      .order("created_at", { ascending: false });
    setRows((r.data ?? []) as unknown as Row[]);
  }


  if (loading) return <GateLoading />;

  return (
    <AppShell title="Customers" role="admin">
      {msg && (
        <div className="mb-4 text-sm bg-blue-50 border border-blue-200 text-blue-800 rounded p-2">
          {msg}
        </div>
      )}
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <div className="text-sm text-muted-foreground">
          {rows.length} customer{rows.length === 1 ? "" : "s"}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => setShowNew(true)}
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            + New customer
          </Button>
        </div>
      </div>

      {showNew && (
        <NewCustomerCard
          onDone={() => {
            setShowNew(false);
            void load();
          }}
        />
      )}
      {dupSource && (
        <DuplicateCustomerCard
          source={dupSource}
          onDone={(refresh) => {
            setDupSource(null);
            if (refresh) void load();
          }}
        />
      )}

      {/* Mobile cards / desktop table */}
      <div className="grid gap-2 md:hidden">
        {rows.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-3 text-sm">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <div className="font-medium truncate">{maskName(r.full_name)}</div>
                  <div className="font-mono text-xs text-muted-foreground truncate">
                    {maskIdentifier(r.account_number)}
                  </div>
                </div>
                <StatusBadge s={r.status} />
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 text-xs">
                <div>
                  Account: <b>{formatUsd(r.checking_balance)}</b>
                </div>
                <div>
                  Savings: <b>{formatUsd(r.savings_balance)}</b>
                </div>
                <div>
                  Loans: <b>{formatUsd(r.loans_balance)}</b>
                </div>
                <div>
                  BTC: <b>{formatBtc(r.btc_balance)}</b>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <Link
                  to="/admin/users/$id"
                  params={{ id: r.id }}
                  className="text-primary text-xs hover:underline"
                >
                  Manage →
                </Link>
                <button
                  onClick={() => setDupSource(r)}
                  className="text-xs text-brand-navy hover:underline"
                >
                  Duplicate
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="hidden md:block">
        <CardContent className="p-0 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Account #</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Account</th>
                <th className="p-3 text-right">Savings</th>
                <th className="p-3 text-right">Loan balance</th>
                <th className="p-3 text-right">BTC</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t hover:bg-muted">
                  <td className="p-3 font-medium">{maskName(r.full_name)}</td>
                  <td className="p-3 font-mono">{maskIdentifier(r.account_number)}</td>
                  <td className="p-3">
                    <StatusBadge s={r.status} />
                  </td>
                  <td className="p-3 text-right">{formatUsd(r.checking_balance)}</td>
                  <td className="p-3 text-right">{formatUsd(r.savings_balance)}</td>
                  <td className="p-3 text-right">{formatUsd(r.loans_balance)}</td>
                  <td className="p-3 text-right">{formatBtc(r.btc_balance)}</td>
                  <td className="p-3 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => setDupSource(r)}
                      className="text-xs text-brand-navy hover:underline"
                    >
                      Duplicate
                    </button>
                    <Link
                      to="/admin/users/$id"
                      params={{ id: r.id }}
                      className="text-primary hover:underline"
                    >
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function StatusBadge({ s }: { s: string }) {
  const cls =
    s === "active"
      ? "bg-emerald-100 text-emerald-700"
      : s === "suspended"
        ? "bg-amber-100 text-amber-700"
        : "bg-muted text-foreground";
  return <span className={`inline-block px-2 py-0.5 rounded text-xs ${cls}`}>{s}</span>;
}

function NewCustomerCard({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    date_of_birth: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    account_number: "",
    routing_number: "",
    account_type: "Loan Account",
    currency: "USD",
    password: "ChangeMe!123",
    pin: "1234",
    marital_status: "Single",
    occupation: "",
    employer: "",
    annual_income: "0",
    card_type: "Loan",
    card_network: "Visa",
    card_last4: "",
    card_expiry: "",
    opened_date: "",
    opening_balance: "0",
    checking_balance: "0",
    savings_balance: "0",
    loans_balance: "0",
    btc_balance: "0",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await adminCreateCustomer({
        data: {
          first_name: f.first_name,
          middle_name: f.middle_name,
          last_name: f.last_name,
          date_of_birth: f.date_of_birth,
          email: f.email,
          phone: f.phone,
          street: f.street,
          city: f.city,
          state: f.state,
          zip: f.zip,
          country: f.country,
          account_number: f.account_number,
          routing_number: f.routing_number,
          account_type: f.account_type,
          currency: f.currency,
          password: f.password,
          pin: f.pin,
          marital_status: f.marital_status,
          occupation: f.occupation,
          employer: f.employer,
          annual_income: parseFloat(f.annual_income || "0"),
          card_type: f.card_type,
          card_network: f.card_network,
          card_last4: f.card_last4,
          card_expiry: f.card_expiry,
          opened_date: f.opened_date,
          opening_balance: parseFloat(f.opening_balance || "0"),
          checking_balance: parseFloat(f.checking_balance || "0"),
          savings_balance: parseFloat(f.savings_balance || "0"),
          loans_balance: parseFloat(f.loans_balance || "0"),
          btc_balance: parseFloat(f.btc_balance || "0"),
        },
      });
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
      setBusy(false);
    }
  }

  function set<K extends keyof typeof f>(k: K, v: string) {
    setF((x) => ({ ...x, [k]: v }));
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <p className="text-xs text-muted-foreground">
          Please enter the customer's information to build their account.
        </p>
      </CardHeader>
      <CardContent>
        {err && (
          <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
            {err}
          </div>
        )}
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
          <Section title="Personal" />
          <Fld
            label="Legal First Name *"
            v={f.first_name}
            on={(v) => set("first_name", v)}
            required
          />
          <Fld label="Middle Name" v={f.middle_name} on={(v) => set("middle_name", v)} />
          <Fld label="Legal Last Name *" v={f.last_name} on={(v) => set("last_name", v)} required />
          <Fld
            label="Date of birth"
            type="date"
            v={f.date_of_birth}
            on={(v) => set("date_of_birth", v)}
          />
          <Fld label="Email" type="email" v={f.email} on={(v) => set("email", v)} />
          <Fld label="Phone" v={f.phone} on={(v) => set("phone", v)} />
          <Fld label="Marital status" v={f.marital_status} on={(v) => set("marital_status", v)} />
          <Fld label="Occupation" v={f.occupation} on={(v) => set("occupation", v)} />
          <Fld label="Employer" v={f.employer} on={(v) => set("employer", v)} />
          <Fld
            label="Annual income (USD)"
            type="number"
            v={f.annual_income}
            on={(v) => set("annual_income", v)}
          />

          <Section title="Address" />
          <Fld label="Street" v={f.street} on={(v) => set("street", v)} />
          <Fld label="City" v={f.city} on={(v) => set("city", v)} />
          <Fld label="State / Province" v={f.state} on={(v) => set("state", v)} />
          <Fld label="ZIP / Postal" v={f.zip} on={(v) => set("zip", v)} />
          <SelectFld
            label="Country"
            v={f.country}
            on={(v) => set("country", v)}
            opts={COUNTRIES}
            placeholder="Choose Country"
          />

          <Section title="Account" />
          <Fld
            label="Account number *"
            v={f.account_number}
            on={(v) => set("account_number", v)}
            required
          />
          <Fld label="Reference number" v={f.routing_number} on={(v) => set("routing_number", v)} />
          <SelectFld
            label="Account type"
            v={f.account_type}
            on={(v) => set("account_type", v)}
            opts={ACCOUNT_TYPES}
          />
          <SelectFld
            label="Currency"
            v={f.currency}
            on={(v) => set("currency", v)}
            opts={CURRENCIES}
          />
          <Fld
            label="Opened date"
            type="date"
            v={f.opened_date}
            on={(v) => set("opened_date", v)}
          />
          <Fld label="Initial password" v={f.password} on={(v) => set("password", v)} />
          <Fld label="Initial PIN" v={f.pin} on={(v) => set("pin", v)} />

          <Section title="Card" />
          <Fld label="Card type" v={f.card_type} on={(v) => set("card_type", v)} />
          <Fld label="Card network" v={f.card_network} on={(v) => set("card_network", v)} />
          <Fld label="Last 4" v={f.card_last4} on={(v) => set("card_last4", v)} />
          <Fld label="Expiry (YYYY-MM)" v={f.card_expiry} on={(v) => set("card_expiry", v)} />

          <Section title="Balances" />
          <Fld
            label="Opening balance"
            type="number"
            v={f.opening_balance}
            on={(v) => set("opening_balance", v)}
          />
          <Fld
            label="Loan balance"
            type="number"
            v={f.checking_balance}
            on={(v) => set("checking_balance", v)}
          />
          <Fld
            label="Reserve balance"
            type="number"
            v={f.savings_balance}
            on={(v) => set("savings_balance", v)}
          />
          <Fld
            label="Outstanding loans"
            type="number"
            v={f.loans_balance}
            on={(v) => set("loans_balance", v)}
          />
          <Fld
            label="BTC balance"
            type="number"
            v={f.btc_balance}
            on={(v) => set("btc_balance", v)}
          />

          <div className="sm:col-span-2 flex flex-wrap gap-2 pt-2">
            <Button type="submit" disabled={busy} style={{ background: "var(--brand-navy)" }}>
              {busy ? "Creating…" : "Create customer"}
            </Button>
            <Button type="button" variant="outline" onClick={onDone}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Section({ title }: { title: string }) {
  return (
    <div className="sm:col-span-2 mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b pb-1">
      {title}
    </div>
  );
}
function Fld({
  label,
  v,
  on,
  type = "text",
  required,
}: {
  label: string;
  v: string;
  on: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={v} required={required} onChange={(e) => on(e.target.value)} />
    </div>
  );
}
function SelectFld({
  label,
  v,
  on,
  opts,
  placeholder,
}: {
  label: string;
  v: string;
  on: (v: string) => void;
  opts: string[];
  placeholder?: string;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Select value={v} onValueChange={on}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {opts.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function DuplicateCustomerCard({
  source,
  onDone,
}: {
  source: Row;
  onDone: (refresh: boolean) => void;
}) {
  const [f, setF] = useState({
    new_account_number: "",
    new_auth_email: "",
    new_password: "",
    new_pin: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setOk(null);
    try {
      const r = await adminDuplicateCustomer({
        data: {
          source_user_id: source.id,
          new_account_number: f.new_account_number,
          new_auth_email: f.new_auth_email || undefined,
          new_password: f.new_password,
          new_pin: f.new_pin,
        },
      });
      setOk(`Duplicated. New user id ${r.id} — ${r.transactions_copied} transactions copied.`);
      setTimeout(() => onDone(true), 1200);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
      setBusy(false);
    }
  }

  return (
    <Card className="mb-6 border-border">
      <CardHeader>
        <CardTitle>Duplicate customer</CardTitle>
        <p className="text-xs text-muted-foreground">
          Source: <b>{source.full_name}</b> (account {source.account_number}). All profile fields,
          balances, and transactions are copied exactly. Provide new identity credentials below.
        </p>
      </CardHeader>
      <CardContent>
        {err && (
          <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
            {err}
          </div>
        )}
        {ok && (
          <div className="mb-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-2">
            {ok}
          </div>
        )}
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
          <Fld
            label="New account number *"
            v={f.new_account_number}
            on={(v) => setF((x) => ({ ...x, new_account_number: v }))}
            required
          />
          <Fld
            label="New auth email (optional)"
            type="email"
            v={f.new_auth_email}
            on={(v) => setF((x) => ({ ...x, new_auth_email: v }))}
          />
          <Fld
            label="New password *"
            v={f.new_password}
            on={(v) => setF((x) => ({ ...x, new_password: v }))}
            required
          />
          <Fld
            label="New PIN *"
            v={f.new_pin}
            on={(v) => setF((x) => ({ ...x, new_pin: v }))}
            required
          />
          <div className="sm:col-span-2 flex flex-wrap gap-2 pt-2">
            <Button type="submit" disabled={busy} style={{ background: "var(--brand-navy)" }}>
              {busy ? "Duplicating…" : "Duplicate customer"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onDone(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
