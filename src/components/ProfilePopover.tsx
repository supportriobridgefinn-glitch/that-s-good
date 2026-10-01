import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, UserCog, ShieldCheck, Receipt, Headphones, LogOut } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession } from "@/hooks/use-auth";
import { maskEmail, maskName } from "@/lib/privacy";

type P = { first_name: string; full_name: string; email: string; account_type: string };

export function ProfilePopover() {
  const { user } = useAuthSession();
  const navigate = useNavigate();
  const [p, setP] = useState<P | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("first_name,full_name,email,account_type")
        .eq("id", user.id)
        .maybeSingle();
      setP((data as unknown as P) ?? null);
    })();
  }, [user]);

  const initials = (p?.first_name?.[0] || p?.full_name?.[0] || "?").toUpperCase();
  const first = p?.first_name || p?.full_name?.split(" ")[0] || "Customer";

  async function signOut() {
    await supabase.auth.signOut();
    setOpen(false);
    navigate({ to: "/login" });
  }

  const items = [
    {
      icon: <UserCog size={16} />,
      title: "Account Settings",
      sub: "Manage your profile",
      to: "/account",
    },
    {
      icon: <ShieldCheck size={16} />,
      title: "Security & PIN",
      sub: "Update your PIN",
      to: "/account",
    },
    {
      icon: <Receipt size={16} />,
      title: "Transaction History",
      sub: "View all activities",
      to: "/activity",
    },
    { icon: <Headphones size={16} />, title: "Support Center", sub: "Get help", to: "/account" },
  ] as const;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1 p-1 rounded-full hover:bg-muted"
          aria-label="Profile menu"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback
              className="text-xs font-semibold"
              style={{ background: "var(--brand-navy)", color: "white" }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <ChevronDown size={14} className="text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[300px] p-0">
        <div className="px-4 py-3 border-b flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback
              className="text-sm font-semibold"
              style={{ background: "var(--brand-navy)", color: "white" }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="font-semibold truncate">{maskName(first)}</div>
            <div className="text-xs text-muted-foreground truncate">{maskEmail(p?.email)}</div>
            <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {p?.account_type || "Loan Account"}
            </span>
          </div>
        </div>
        <div className="py-1">
          {items.map((it) => (
            <Link
              key={it.title}
              to={it.to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground shrink-0">
                {it.icon}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{it.title}</div>
                <div className="text-[11px] text-muted-foreground truncate">{it.sub}</div>
              </div>
            </Link>
          ))}
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 border-t hover:bg-red-50 text-left"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-red-50 shrink-0">
            <LogOut size={16} className="text-red-600" />
          </span>
          <div>
            <div className="text-sm font-semibold text-red-600">Log Out</div>
            <div className="text-[11px] text-muted-foreground">Sign out of your account</div>
          </div>
        </button>
      </PopoverContent>
    </Popover>
  );
}
