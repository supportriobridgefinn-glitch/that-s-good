import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, GateLoading, useGate } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Mail,
  Phone,
  MapPin,
  User,
  Calendar,
  ShieldCheck,
  KeyRound,
  Building2,
  LogOut,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/lib/currency";
import { maskEmail, maskIdentifier, maskName, maskPhone, maskText } from "@/lib/privacy";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Account | Rio Bridge Finance" }] }),
  component: AccountPage,
});

type P = {
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  account_number: string;
  account_type: string;
  country: string;
  city: string;
  address: string;
  date_of_birth: string | null;
  currency: string;
};

function AccountPage() {
  const navigate = useNavigate();
  const { user, role, loading } = useGate("customer");
  const { format } = useCurrency();
  const [p, setP] = useState<P | null>(null);

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
      const { data } = await supabase
        .from("profiles")
        .select(
          "first_name,last_name,full_name,email,phone,account_number,account_type,country,city,address,date_of_birth,currency",
        )
        .eq("id", user.id)
        .maybeSingle();
      setP(data as unknown as P);
    })();
  }, [loading, user, role, navigate]);

  if (loading || !p) return <GateLoading />;
  const initials =
    (p.first_name?.[0] || "?").toUpperCase() + (p.last_name?.[0] || "").toUpperCase();
  const dob = p.date_of_birth
    ? new Date(p.date_of_birth).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      })
    : "—";

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  return (
    <AppShell title="" role="customer" hideTitle>
      <Card className="mb-4">
        <CardContent className="p-5 flex flex-col items-center text-center">
          <Avatar className="h-16 w-16 mb-3">
            <AvatarFallback
              className="text-base font-semibold"
              style={{ background: "var(--brand-navy)", color: "white" }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <h2 className="text-lg font-bold text-foreground">{maskName(p.full_name)}</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {p.account_type}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">Account #{maskIdentifier(p.account_number)}</div>
          <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Mail size={12} /> {maskEmail(p.email)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Phone size={12} /> {maskPhone(p.phone)}
            </span>
            {p.country && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={12} /> {maskText(p.country)}
              </span>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 w-full">
            <Button
              variant="outline"
              className="text-red-600 border-red-200"
              onClick={() => navigate({ to: "/login" })}
            >
              <KeyRound size={14} className="mr-1.5" /> Change PIN
            </Button>
            <Button variant="outline" className="text-foreground">
              <ShieldCheck size={14} className="mr-1.5" /> Password
            </Button>
          </div>
        </CardContent>
      </Card>

      <Section icon={<User size={16} />} title="Personal Information">
        <Field icon={<User size={14} />} label="FULL NAME" value={maskName(p.full_name)} />
        <Field icon={<Calendar size={14} />} label="DATE OF BIRTH" value={maskText(dob)} />
        <Field icon={<Mail size={14} />} label="EMAIL ADDRESS" value={maskEmail(p.email)} />
        <Field icon={<Phone size={14} />} label="PHONE" value={maskPhone(p.phone)} />
        <Field icon={<MapPin size={14} />} label="COUNTRY" value={maskText(p.country)} />
        <Field
          icon={<MapPin size={14} />}
          label="CITY ADDRESS"
          value={maskText([p.address, p.city].filter(Boolean).join(", "))}
        />
      </Section>

      <Section icon={<Building2 size={16} />} title="Account Settings">
        <Row
          left="Currency Preference"
          sub="Default transaction currency"
          right={
            <span className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 font-semibold">
              {p.currency || "USD"}
            </span>
          }
        />
        <Row
          left="Account Type"
          sub="Your loan tier"
          right={
            <span className="text-xs px-2 py-1 rounded bg-muted text-foreground font-semibold">
              {p.account_type}
            </span>
          }
        />
        <Row
          left="Security & Password"
          sub="Manage your security settings"
          right={<ChevronRight size={16} className="text-muted-foreground" />}
        />
      </Section>

      <Section
        icon={<AlertTriangle size={16} className="text-amber-600" />}
        title="Session Management"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-red-50/50 border border-red-100">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground">Logout from all devices</div>
            <div className="text-xs text-muted-foreground">
              End all active sessions and require re-authentication
            </div>
          </div>
          <Button
            onClick={logout}
            variant="outline"
            className="text-red-600 border-red-200 shrink-0"
          >
            <LogOut size={14} className="mr-1.5" /> Logout
          </Button>
        </div>
      </Section>
    </AppShell>
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
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-muted text-muted-foreground">
            {icon}
          </span>
          <h3 className="font-semibold text-sm text-foreground">{title}</h3>
        </div>
        <div className="space-y-2">{children}</div>
      </CardContent>
    </Card>
  );
}

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3 flex items-start justify-between gap-2">
      <div className="min-w-0">
        <div className="text-[10px] font-semibold tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm text-foreground truncate">{value}</div>
      </div>
      <span className="text-muted-foreground shrink-0">{icon}</span>
    </div>
  );
}

function Row({ left, sub, right }: { left: string; sub: string; right: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border">
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground truncate">{left}</div>
        <div className="text-[11px] text-muted-foreground truncate">{sub}</div>
      </div>
      <div className="shrink-0">{right}</div>
    </div>
  );
}
