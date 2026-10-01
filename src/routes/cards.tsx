import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, GateLoading, useGate } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Activity, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/lib/currency";

export const Route = createFileRoute("/cards")({
  head: () => ({ meta: [{ title: "Cards | Rio Bridge Finance" }] }),
  component: CardsPage,
});

type Profile = { card_last4: string; card_network: string; card_type: string; card_expiry: string };

function CardsPage() {
  const navigate = useNavigate();
  const { user, role, loading } = useGate("customer");
  const { format } = useCurrency();
  const [profile, setProfile] = useState<Profile | null>(null);

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
        .select("card_last4,card_network,card_type,card_expiry")
        .eq("id", user.id)
        .maybeSingle();
      setProfile((data as unknown as Profile) ?? null);
    })();
  }, [loading, user, role, navigate]);

  if (loading) return <GateLoading />;
  const hasCard = !!profile?.card_last4;

  return (
    <AppShell title="" role="customer" hideTitle>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Cards</h1>
          <p className="text-sm text-muted-foreground">Manage your Rio Bridge Finance cards and card activity</p>
        </div>
        <Button style={{ background: "var(--brand-navy)" }} className="text-white shrink-0">
          + Apply for Card
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <Stat label="Total Balance" value={format(0)} icon={<CreditCard size={18} />} />
        <Stat label="Total Transactions" value="0" icon={<Activity size={18} />} />
        <Stat label="Pending Applications" value="0" icon={<Clock size={18} />} />
      </div>

      {hasCard ? (
        <Card>
          <CardContent className="p-5">
            <div
              className="rounded-2xl p-5 text-white"
              style={{ background: "var(--gradient-brand)" }}
            >
              <div className="text-xs uppercase opacity-80">{profile.card_network || "Card"}</div>
              <div className="mt-8 text-2xl tracking-widest">
                •••• •••• •••• {profile.card_last4}
              </div>
              <div className="mt-4 flex justify-between text-xs">
                <div>
                  <div className="opacity-60">Type</div>
                  <div className="font-semibold">{profile.card_type}</div>
                </div>
                <div>
                  <div className="opacity-60">Expires</div>
                  <div className="font-semibold">{profile.card_expiry || "—"}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-10 flex flex-col items-center text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-muted mb-3">
              <CreditCard size={28} className="text-muted-foreground" />
            </div>
            <div className="font-semibold text-foreground">No Cards Yet</div>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Apply for your first card to get started
            </p>
            <Button style={{ background: "var(--brand-navy)" }} className="text-white">
              + Apply Now
            </Button>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground truncate">{label}</div>
          <div className="text-lg font-bold text-foreground truncate">{value}</div>
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-md bg-muted text-muted-foreground shrink-0">
          {icon}
        </span>
      </CardContent>
    </Card>
  );
}
