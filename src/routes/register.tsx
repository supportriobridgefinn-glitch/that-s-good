import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
import { COUNTRIES, ACCOUNT_TYPES, CURRENCIES } from "@/lib/options";
import { submitApplication } from "@/lib/applications.functions";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Open an Account | Rio Bridge Finance" },
      { name: "description", content: "Apply to open a Rio Bridge Finance account. Applications are reviewed and approved by our team." },
      { property: "og:title", content: "Open an Account | Rio Bridge Finance" },
      { property: "og:description", content: "Start your Rio Bridge Finance account application in minutes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Register,
});

function Register() {
  const navigate = useNavigate();
  const [f, setF] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    username: "",
    email: "",
    phone: "",
    country: "",
    account_type: "",
    currency: "USD",
    pin: "",
    password: "",
    confirm: "",
  });
  const [agree, setAgree] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  
  function set<K extends keyof typeof f>(k: K, v: string) {
    setF((x) => ({ ...x, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!agree) {
      setErr("Please accept the Terms & Conditions and Privacy Policy");
      return;
    }
    if (f.password !== f.confirm) {
      setErr("Passwords do not match");
      return;
    }
    if (!/^\d{4}$/.test(f.pin)) {
      setErr("PIN must be exactly 4 digits");
      return;
    }
    setBusy(true);
    try {
      await submitApplication({
        data: {
          first_name: f.first_name,
          middle_name: f.middle_name,
          last_name: f.last_name,
          username: f.username,
          email: f.email,
          phone: f.phone,
          country: f.country,
          account_type: f.account_type,
          currency: f.currency,
          pin: f.pin,
          password: f.password,
        },
      });
      void navigate({ to: "/pending-approval", replace: true });
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Failed to submit");
    } finally {
      setBusy(false);
    }
  }


  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{ background: "var(--gradient-brand)" }}
    >
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <img
            src="/site/images/rio-bridge-logo.png"
            alt="Rio Bridge Finance"
            className="h-14 mx-auto mb-2"
          />
          <CardTitle>Create Account</CardTitle>
          <p className="text-xs text-muted-foreground">
            Please enter your information to build your account.
          </p>
        </CardHeader>
        <CardContent>
          {err && (
            <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
              {err}
            </div>
          )}
          <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
            <Fld label="Legal First Name" req v={f.first_name} on={(v) => set("first_name", v)} />
            <Fld label="Middle Name" v={f.middle_name} on={(v) => set("middle_name", v)} />
            <Fld label="Legal Last Name" req v={f.last_name} on={(v) => set("last_name", v)} />
            <Fld label="Username" req v={f.username} on={(v) => set("username", v)} />
            <Fld label="Email Address" req type="email" v={f.email} on={(v) => set("email", v)} />
            <div>
              <Label>Phone Number *</Label>
              <Input
                required
                value={f.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+1 555 000 0000"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Enter your phone number with country code
              </p>
            </div>
            <SelectFld
              label="Country"
              req
              v={f.country}
              on={(v) => set("country", v)}
              options={COUNTRIES}
              placeholder="Choose Country"
            />
            <SelectFld
              label="Account Type"
              req
              v={f.account_type}
              on={(v) => set("account_type", v)}
              options={ACCOUNT_TYPES}
              placeholder="Select Account Type"
            />
            <SelectFld
              label="Currency"
              req
              v={f.currency}
              on={(v) => set("currency", v)}
              options={CURRENCIES}
              placeholder="Choose Currency"
            />
            <div>
              <Label>4-Digit Transaction PIN *</Label>
              <Input
                required
                inputMode="numeric"
                maxLength={4}
                value={f.pin}
                onChange={(e) => set("pin", e.target.value.replace(/\D/g, ""))}
              />
              <p className="text-[10px] text-muted-foreground mt-1">Used to authorize transactions</p>
            </div>
            <Fld
              label="Password"
              req
              type={showPw ? "text" : "password"}
              v={f.password}
              on={(v) => set("password", v)}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="text-xs text-muted-foreground hover:text-foreground px-2"
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              }
            />
            <Fld
              label="Confirm Password"
              req
              type={showCpw ? "text" : "password"}
              v={f.confirm}
              on={(v) => set("confirm", v)}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowCpw((s) => !s)}
                  className="text-xs text-muted-foreground hover:text-foreground px-2"
                >
                  {showCpw ? "Hide" : "Show"}
                </button>
              }
            />
            <div className="sm:col-span-2 flex items-start gap-2 pt-1">
              <input
                id="agree"
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0"
              />
              <label htmlFor="agree" className="text-xs text-foreground leading-snug">
                I agree to Rio Bridge Finance's{" "}
                <a href="#" className="text-[var(--brand-navy)] font-medium hover:underline">
                  Terms &amp; Conditions
                </a>{" "}
                and{" "}
                <a href="#" className="text-[var(--brand-navy)] font-medium hover:underline">
                  Privacy Policy
                </a>
              </label>
            </div>
            <div className="sm:col-span-2 space-y-3 pt-2">
              <Button
                type="submit"
                disabled={busy}
                className="w-full h-11"
                style={{ background: "var(--brand-navy)", color: "#fff" }}
              >
                {busy ? "Submitting…" : "Create My Account →"}
              </Button>
              <div className="text-center text-xs text-muted-foreground">Already have an account?</div>
              <Link to="/login" className="block">
                <Button type="button" variant="outline" className="w-full h-11">
                  → Sign In
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Fld({
  label,
  v,
  on,
  req,
  type = "text",
  suffix,
}: {
  label: string;
  v: string;
  on: (v: string) => void;
  req?: boolean;
  type?: string;
  suffix?: React.ReactNode;
}) {
  return (
    <div>
      <Label>
        {label}
        {req && " *"}
      </Label>
      {suffix ? (
        <div className="relative flex items-center">
          <Input
            required={req}
            type={type}
            value={v}
            onChange={(e) => on(e.target.value)}
            className="pr-14"
          />
          <div className="absolute right-1">{suffix}</div>
        </div>
      ) : (
        <Input required={req} type={type} value={v} onChange={(e) => on(e.target.value)} />
      )}
    </div>
  );
}

function SelectFld({
  label,
  v,
  on,
  options,
  placeholder,
  req,
}: {
  label: string;
  v: string;
  on: (v: string) => void;
  options: string[];
  placeholder: string;
  req?: boolean;
}) {
  return (
    <div>
      <Label>
        {label}
        {req && " *"}
      </Label>
      <Select value={v} onValueChange={on}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
