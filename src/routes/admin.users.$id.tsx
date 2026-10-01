import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
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
  adminDeleteCustomer,
  adminResetCredentials,
  adminUpdateProfile,
  importHistoricalTransactions,
} from "@/lib/banking.functions";
import { formatBtc, formatUsd } from "@/lib/btc";
import { COUNTRIES, ACCOUNT_TYPES, CURRENCIES } from "@/lib/options";

export const Route = createFileRoute("/admin/users/$id")({
  head: () => ({ meta: [{ title: "Edit customer | Rio Bridge Finance" }] }),
  component: EditCustomer,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Profile = Record<string, any>;

function EditCustomer() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user, role, loading } = useGate("admin");
  const [p, setP] = useState<Profile | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pwReset, setPwReset] = useState({ password: "", pin: "" });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [targetBal, setTargetBal] = useState<number>(12521922.33);

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
  }, [loading, user, role, id]);

  async function load() {
    const r = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
    setP(r.data as Profile);
  }

  async function save() {
    if (!p) return;
    setMsg(null);
    setErr(null);
    const patch: Record<string, unknown> = {
      full_name: `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.full_name,
      first_name: p.first_name,
      middle_name: p.middle_name,
      last_name: p.last_name,
      date_of_birth: p.date_of_birth || null,
      email: p.email,
      phone: p.phone,
      address: p.address,
      city: p.city,
      state: p.state,
      zip: p.zip,
      country: p.country,
      marital_status: p.marital_status,
      occupation: p.occupation,
      employer: p.employer,
      annual_income: Number(p.annual_income || 0),
      account_type: p.account_type,
      currency: p.currency,
      routing_number: p.routing_number,
      card_type: p.card_type,
      card_network: p.card_network,
      card_last4: p.card_last4,
      card_expiry: p.card_expiry,
      opened_date: p.opened_date,
      status: p.status,
      opening_balance: Number(p.opening_balance),
      checking_balance: Number(p.checking_balance),
      savings_balance: Number(p.savings_balance),
      loans_balance: Number(p.loans_balance),
      btc_balance: Number(p.btc_balance),
      wallet_unlock_deadline: p.wallet_unlock_deadline || null,
    };
    try {
      await adminUpdateProfile({ data: { user_id: id, patch } });
      setMsg("Saved.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  }

  async function resetCreds() {
    setMsg(null);
    setErr(null);
    try {
      await adminResetCredentials({
        data: {
          user_id: id,
          new_password: pwReset.password || undefined,
          new_pin: pwReset.pin || undefined,
        },
      });
      setMsg("Credentials updated.");
      setPwReset({ password: "", pin: "" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  }

  async function del() {
    if (!confirm("Delete this customer permanently? This cannot be undone.")) return;
    try {
      await adminDeleteCustomer({ data: { user_id: id } });
      navigate({ to: "/admin" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  }

  async function uploadPdf() {
    if (!pdfFile) return;
    setPdfBusy(true);
    setErr(null);
    try {
      const path = `${id}/historical.pdf`;
      const up = await supabase.storage
        .from("historical-statements")
        .upload(path, pdfFile, { upsert: true, contentType: "application/pdf" });
      if (up.error) throw new Error(up.error.message);
      await adminUpdateProfile({ data: { user_id: id, patch: { historical_pdf_path: path } } });
      setMsg("Historical PDF uploaded.");
      setPdfFile(null);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setPdfBusy(false);
    }
  }

  if (loading || !p) return <GateLoading />;
  function set<K extends string>(k: K, v: unknown) {
    setP((x) => (x ? { ...x, [k]: v } : x));
  }

  return (
    <AppShell title={`Manage: ${p.full_name}`} role="admin">
      <div className="mb-4">
        <Link to="/admin" className="text-primary text-sm hover:underline">
          ← All customers
        </Link>
      </div>
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

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Personal</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            <Row label="Account # (immutable)">
              <Input value={p.account_number ?? ""} disabled />
            </Row>
            <Row label="Routing #">
              <Input
                value={p.routing_number ?? ""}
                onChange={(e) => set("routing_number", e.target.value)}
              />
            </Row>
            <Row label="Legal First Name">
              <Input
                value={p.first_name ?? ""}
                onChange={(e) => set("first_name", e.target.value)}
              />
            </Row>
            <Row label="Middle Name">
              <Input
                value={p.middle_name ?? ""}
                onChange={(e) => set("middle_name", e.target.value)}
              />
            </Row>
            <Row label="Legal Last Name">
              <Input value={p.last_name ?? ""} onChange={(e) => set("last_name", e.target.value)} />
            </Row>
            <Row label="Date of birth">
              <Input
                type="date"
                value={p.date_of_birth ?? ""}
                onChange={(e) => set("date_of_birth", e.target.value)}
              />
            </Row>
            <Row label="Email">
              <Input
                type="email"
                value={p.email ?? ""}
                onChange={(e) => set("email", e.target.value)}
              />
            </Row>
            <Row label="Phone">
              <Input value={p.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
            </Row>
            <Row label="Marital status">
              <Input
                value={p.marital_status ?? ""}
                onChange={(e) => set("marital_status", e.target.value)}
              />
            </Row>
            <Row label="Occupation">
              <Input
                value={p.occupation ?? ""}
                onChange={(e) => set("occupation", e.target.value)}
              />
            </Row>
            <Row label="Employer">
              <Input value={p.employer ?? ""} onChange={(e) => set("employer", e.target.value)} />
            </Row>
            <Row label="Annual income">
              <Input
                type="number"
                value={p.annual_income ?? 0}
                onChange={(e) => set("annual_income", e.target.value)}
              />
            </Row>
            <Row label="Status">
              <Select value={p.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </Row>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Address & account</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            <Row label="Address (free text)">
              <Input value={p.address ?? ""} onChange={(e) => set("address", e.target.value)} />
            </Row>
            <Row label="City">
              <Input value={p.city ?? ""} onChange={(e) => set("city", e.target.value)} />
            </Row>
            <Row label="State">
              <Input value={p.state ?? ""} onChange={(e) => set("state", e.target.value)} />
            </Row>
            <Row label="ZIP">
              <Input value={p.zip ?? ""} onChange={(e) => set("zip", e.target.value)} />
            </Row>
            <Row label="Country">
              <Select value={p.country ?? ""} onValueChange={(v) => set("country", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>
            <Row label="Account type">
              <Select value={p.account_type ?? ""} onValueChange={(v) => set("account_type", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {ACCOUNT_TYPES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>
            <Row label="Currency">
              <Select value={p.currency ?? ""} onValueChange={(v) => set("currency", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>
            <Row label="Opened date">
              <Input
                type="date"
                value={p.opened_date ?? ""}
                onChange={(e) => set("opened_date", e.target.value)}
              />
            </Row>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Card</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            <Row label="Card type">
              <Input value={p.card_type ?? ""} onChange={(e) => set("card_type", e.target.value)} />
            </Row>
            <Row label="Network">
              <Input
                value={p.card_network ?? ""}
                onChange={(e) => set("card_network", e.target.value)}
              />
            </Row>
            <Row label="Last 4">
              <Input
                value={p.card_last4 ?? ""}
                onChange={(e) => set("card_last4", e.target.value)}
              />
            </Row>
            <Row label="Expiry">
              <Input
                value={p.card_expiry ?? ""}
                onChange={(e) => set("card_expiry", e.target.value)}
              />
            </Row>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Balances</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            <Row label="Opening (USD)">
              <Input
                type="number"
                value={p.opening_balance ?? 0}
                onChange={(e) => set("opening_balance", Number(e.target.value))}
              />
            </Row>
            <Row label="Checking (USD)">
              <Input
                type="number"
                value={p.checking_balance ?? 0}
                onChange={(e) => set("checking_balance", Number(e.target.value))}
              />
            </Row>
            <Row label="Savings (USD)">
              <Input
                type="number"
                value={p.savings_balance ?? 0}
                onChange={(e) => set("savings_balance", Number(e.target.value))}
              />
            </Row>
            <Row label="Loans (USD)">
              <Input
                type="number"
                value={p.loans_balance ?? 0}
                onChange={(e) => set("loans_balance", Number(e.target.value))}
              />
            </Row>
            <Row label="BTC">
              <Input
                type="number"
                step="0.00000001"
                value={p.btc_balance ?? 0}
                onChange={(e) => set("btc_balance", Number(e.target.value))}
              />
            </Row>
            <Row label="BTC receiving address">
              <Input value={p.btc_deposit_address ?? ""} disabled />
            </Row>
            <div className="sm:col-span-2 text-xs text-muted-foreground">
              Now: Checking {formatUsd(Number(p.checking_balance) || 0)} · Savings{" "}
              {formatUsd(Number(p.savings_balance) || 0)} · Loans{" "}
              {formatUsd(Number(p.loans_balance) || 0)} · {formatBtc(Number(p.btc_balance) || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wallet unlock countdown</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            <Row label="Deadline (loan cancels at this time)">
              <Input
                type="datetime-local"
                value={
                  p.wallet_unlock_deadline
                    ? new Date(p.wallet_unlock_deadline).toISOString().slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  set(
                    "wallet_unlock_deadline",
                    e.target.value ? new Date(e.target.value).toISOString() : null,
                  )
                }
              />
            </Row>
            <div className="flex items-end gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  set(
                    "wallet_unlock_deadline",
                    new Date(Date.now() + 7 * 3600 * 1000).toISOString(),
                  )
                }
              >
                Set 7h from now
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  set(
                    "wallet_unlock_deadline",
                    new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
                  )
                }
              >
                Set 24h from now
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => set("wallet_unlock_deadline", null)}
              >
                Clear
              </Button>
            </div>
            <div className="sm:col-span-2 text-xs text-muted-foreground">
              Shown to the customer on their dashboard as "Xh Ym Zs until loan cancelled". Remember
              to Save all changes.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reset credentials</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            <Row label="New password (blank to keep)">
              <Input
                type="text"
                value={pwReset.password}
                onChange={(e) => setPwReset({ ...pwReset, password: e.target.value })}
              />
            </Row>
            <Row label="New PIN (blank to keep)">
              <Input
                type="text"
                value={pwReset.pin}
                onChange={(e) => setPwReset({ ...pwReset, pin: e.target.value })}
              />
            </Row>
            <div className="sm:col-span-2">
              <Button onClick={resetCreds} style={{ background: "var(--brand-navy)" }}>
                Apply credential reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historical statement PDF</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Upload the customer's 2015–2025 transaction history. They will be able to view and
              download it from their Activity page.
            </p>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
            />
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={uploadPdf}
                disabled={!pdfFile || pdfBusy}
                style={{ background: "var(--brand-navy)" }}
              >
                {pdfBusy ? "Uploading…" : "Upload PDF"}
              </Button>
              {p.historical_pdf_path && (
                <span className="text-xs text-muted-foreground self-center">
                  Current: {p.historical_pdf_path}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Import Rio Bridge Finance history (937 txns, 2011–2026)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Imports the full parsed transaction history into this customer's Activity, replacing
              any existing transactions. Opening balance is recomputed so the final checking balance
              matches the target.
            </p>
            <Row label="Target final checking balance (USD)">
              <Input
                type="number"
                step="0.01"
                value={targetBal}
                onChange={(e) => setTargetBal(Number(e.target.value))}
              />
            </Row>
            <Button
              onClick={async () => {
                if (
                  !confirm(
                    "Replace all existing transactions for this user with the 937 historical entries?",
                  )
                )
                  return;
                setImportBusy(true);
                setErr(null);
                setMsg(null);
                try {
                  const r = await importHistoricalTransactions({
                    data: { user_id: id, target_balance: targetBal, replace: true },
                  });
                  setMsg(
                    `Imported ${r.inserted} transactions. Opening balance set to ${r.opening_balance.toLocaleString("en-US", { style: "currency", currency: "USD" })}.`,
                  );
                  await load();
                } catch (e) {
                  setErr(e instanceof Error ? e.message : "Failed");
                } finally {
                  setImportBusy(false);
                }
              }}
              disabled={importBusy}
              style={{ background: "var(--brand-navy)" }}
            >
              {importBusy ? "Importing…" : "Import history into Activity"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danger zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Permanently delete this customer, their profile, and all transactions.
            </p>
            <Button variant="destructive" onClick={del}>
              Delete customer
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex gap-2 flex-wrap">
        <Button onClick={save} style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
          Save all changes
        </Button>
      </div>
    </AppShell>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1 block text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
