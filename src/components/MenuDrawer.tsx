import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Menu,
  LayoutDashboard,
  ArrowDownToLine,
  Building2,
  Globe,
  ArrowLeftRight,
  Receipt,
  FileText,
  CreditCard,
  TrendingUp,
  HandCoins,
  Headphones,
  UserCog,
  LogOut,
} from "lucide-react";
import { ReactNode, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Item = { icon: ReactNode; label: string; to: string; search?: Record<string, string> };

const MAIN: Item[] = [
  { icon: <LayoutDashboard size={18} />, label: "Dashboard", to: "/dashboard" },
  { icon: <ArrowDownToLine size={18} />, label: "Loans", to: "/loans" },
  {
    icon: <Building2 size={18} />,
    label: "Local Repayment",
    to: "/transfer",
    search: { tab: "local" },
  },
  {
    icon: <Globe size={18} />,
    label: "International Repayment",
    to: "/transfer",
    search: { tab: "international" },
  },
  {
    icon: <ArrowLeftRight size={18} />,
    label: "Loan Repayment",
    to: "/transfer",
    search: { tab: "wire" },
  },
  { icon: <Receipt size={18} />, label: "Transactions", to: "/activity" },
  { icon: <Building2 size={18} />, label: "Deposit Funds", to: "/deposit" },
  { icon: <UserCog size={18} />, label: "Beneficiaries", to: "/beneficiaries" },
  { icon: <FileText size={18} />, label: "Statements", to: "/activity" },
  { icon: <CreditCard size={18} />, label: "Cards", to: "/cards" },
  { icon: <TrendingUp size={18} />, label: "Accounts & Investments", to: "/accounts" },
  { icon: <HandCoins size={18} />, label: "Withdraw Funds", to: "/withdraw" },
  
];

const SETTINGS: Item[] = [
  { icon: <Headphones size={18} />, label: "Customer Support", to: "/account" },
  { icon: <UserCog size={18} />, label: "Profile Settings", to: "/account" },
];

export function MenuDrawer({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    setOpen(false);
    navigate({ to: "/login" });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children ?? (
          <button aria-label="Open menu" className="p-2 -ml-2 rounded-md hover:bg-muted">
            <Menu size={22} />
          </button>
        )}
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[340px] p-0 overflow-y-auto">
        <div className="px-5 pt-6 pb-4 border-b">
          <img
            src="/site/images/rio-bridge-logo.png"
            alt="Rio Bridge Finance"
            className="h-9 w-auto"
          />
        </div>
        <div className="py-3">
          <div className="px-5 text-[11px] font-semibold tracking-wider text-muted-foreground mb-2">
            MENU
          </div>
          <nav>
            {MAIN.map((m) => (
              <Link
                key={m.label}
                to={m.to}
                search={m.search as never}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-5 py-3 text-sm text-foreground hover:bg-muted"
              >
                <span className="grid h-8 w-8 place-items-center rounded-md bg-muted text-muted-foreground shrink-0">
                  {m.icon}
                </span>
                <span className="truncate">{m.label}</span>
              </Link>
            ))}
          </nav>
          <div className="px-5 text-[11px] font-semibold tracking-wider text-muted-foreground mt-4 mb-2 pt-3 border-t">
            SETTINGS
          </div>
          <nav>
            {SETTINGS.map((m) => (
              <Link
                key={m.label}
                to={m.to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-5 py-3 text-sm text-foreground hover:bg-muted"
              >
                <span className="grid h-8 w-8 place-items-center rounded-md bg-muted text-muted-foreground shrink-0">
                  {m.icon}
                </span>
                <span className="truncate">{m.label}</span>
              </Link>
            ))}
            <button
              onClick={signOut}
              className="w-full text-left flex items-center gap-3 px-5 py-3 text-sm text-red-600 hover:bg-red-50"
            >
              <span className="grid h-8 w-8 place-items-center rounded-md bg-red-50 shrink-0">
                <LogOut size={18} />
              </span>
              <span>Log Out</span>
            </button>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
