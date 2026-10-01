import { Link, useRouterState } from "@tanstack/react-router";
import { Home, ArrowLeftRight, Send, CreditCard, User } from "lucide-react";

type Tab = { to: string; label: string; icon: typeof Home; fab?: boolean };
const TABS: Tab[] = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/activity", label: "Activity", icon: ArrowLeftRight },
  { to: "/transfer", label: "Transfer", icon: Send, fab: true },
  { to: "/cards", label: "Cards", icon: CreditCard },
  { to: "/account", label: "Account", icon: User },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border shadow-[0_-4px_16px_rgba(0,0,0,0.04)] pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <ul className="max-w-md mx-auto grid grid-cols-5 items-end">
        {TABS.map((t) => {
          const active = pathname === t.to || (t.to !== "/dashboard" && pathname.startsWith(t.to));
          const Icon = t.icon;
          if (t.fab) {
            return (
              <li key={t.to} className="flex justify-center -mt-5">
                <Link to={t.to} className="flex flex-col items-center gap-1" aria-label={t.label}>
                  <span
                    className="grid h-14 w-14 place-items-center rounded-full shadow-lg"
                    style={{ background: "var(--brand-navy)", color: "white" }}
                  >
                    <Icon size={22} />
                  </span>
                  <span className="text-[10px] font-medium" style={{ color: "var(--brand-navy)" }}>
                    {t.label}
                  </span>
                </Link>
              </li>
            );
          }
          return (
            <li key={t.to} className="flex justify-center">
              <Link
                to={t.to}
                className="flex flex-col items-center gap-1 py-2 px-3 w-full"
                aria-label={t.label}
              >
                <Icon
                  size={20}
                  className={active ? "" : "text-muted-foreground"}
                  style={active ? { color: "var(--brand-navy)" } : undefined}
                />
                <span
                  className={`text-[10px] ${active ? "font-semibold" : "text-muted-foreground"}`}
                  style={active ? { color: "var(--brand-navy)" } : undefined}
                >
                  {t.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
