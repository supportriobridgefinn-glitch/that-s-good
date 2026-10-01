import { Link, Outlet } from "@tanstack/react-router";
import { useAuthSession } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { ReactNode } from "react";
import { CurrencySelect } from "@/lib/currency";
import { MenuDrawer } from "@/components/MenuDrawer";
import { NotificationSheet } from "@/components/NotificationSheet";
import { ProfilePopover } from "@/components/ProfilePopover";
import { BottomNav } from "@/components/BottomNav";

const NAV_BG = "var(--brand-navy)";
const GOLD = "var(--brand-navy)";

export function AppShell({
  title,
  children,
  role,
  hideTitle,
}: {
  title: string;
  children: ReactNode;
  role: "customer" | "admin";
  hideTitle?: boolean;
}) {
  const navigate = useNavigate();
  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: role === "admin" ? "/admin/login" : "/login" });
  }

  if (role === "admin") {
    return (
      <div className="min-h-screen bg-muted">
        <header
          style={{ background: NAV_BG, borderBottom: `3px solid ${GOLD}` }}
          className="text-white"
        >
          <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <Link to="/admin" className="flex items-center gap-2 min-w-0">
              <img
                src="/site/images/rio-bridge-logo.png"
                alt="Rio Bridge Finance"
                className="h-9 sm:h-11 w-auto shrink-0"
              />
              <div className="min-w-0">
                <div className="font-bold leading-tight truncate text-sm sm:text-base">
                  RIO BRIDGE FINANCE
                </div>
                <div className="text-[9px] sm:text-[10px] opacity-80 leading-tight truncate">
                  Admin Console
                </div>
              </div>
            </Link>
            <nav className="flex items-center gap-1 text-xs sm:text-sm shrink-0">
              <Link to="/admin" className="px-2 sm:px-3 py-1 hover:underline">
                Customers
              </Link>
              <Link to="/admin/applications" className="px-2 sm:px-3 py-1 hover:underline">
                Apps
              </Link>
              <Link to="/admin/finance" className="px-2 sm:px-3 py-1 hover:underline">
                Finance
              </Link>
              <Link to="/admin/support" className="px-2 sm:px-3 py-1 hover:underline">
                Support
              </Link>
              <CurrencySelect />
              <Button
                size="sm"
                variant="outline"
                onClick={signOut}
                style={{ borderColor: GOLD, color: GOLD, background: "transparent" }}
              >
                Sign out
              </Button>
            </nav>
          </div>
          {!hideTitle && (
            <div className="max-w-6xl mx-auto px-3 sm:px-4 pb-3">
              <h1 className="text-base sm:text-xl font-semibold truncate">{title}</h1>
            </div>
          )}
        </header>
        <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">{children}</main>
      </div>
    );
  }

  // Customer shell — screenshot-style top bar + bottom nav
  return (
    <div className="min-h-screen bg-muted pb-[calc(72px+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-30 bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-3 h-14 grid grid-cols-[auto_1fr_auto] items-center gap-2">
          <MenuDrawer />
          <Link
            to="/dashboard"
            className="flex items-center justify-center gap-2 min-w-0 leading-none"
          >
            <img
              src="/site/images/rio-bridge-logo.png"
              alt="Rio Bridge Finance"
              className="h-7 w-auto"
            />
            <span className="flex flex-col items-start">
              <span className="text-lg font-extrabold leading-none" style={{ color: "var(--brand-navy)" }}>
                Rio Bridge Finance
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-1 shrink-0">
            <CurrencySelect />
            <NotificationSheet />
            <ProfilePopover />
          </div>
        </div>
        {!hideTitle && title && (
          <div className="max-w-6xl mx-auto px-4 pb-3 pt-1">
            <h1 className="text-base font-semibold text-foreground truncate">{title}</h1>
          </div>
        )}
      </header>
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4">{children}</main>
      <BottomNav />
    </div>
  );
}

export function GateLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-card">
      <div className="relative flex items-center justify-center">
        <span
          className="absolute inline-flex h-20 w-20 rounded-full opacity-30 animate-ping"
          style={{ background: "var(--brand-navy)" }}
        />
        <div
          className="relative flex h-16 w-16 items-center justify-center rounded-full shadow-lg animate-pulse"
          style={{ background: "var(--brand-navy)" }}
        >
          <img
            src="/site/images/rio-bridge-logo.png"
            alt="Rio Bridge Finance"
            className="h-10 w-10 object-contain"
          />
        </div>
      </div>
      <div className="text-sm font-semibold tracking-[0.2em]" style={{ color: "var(--brand-navy)" }}>
        RIO BRIDGE FINANCE
      </div>
    </div>
  );
}

export function useGate(required: "customer" | "admin") {
  const { user, role, loading } = useAuthSession();
  return { user, role, loading, allowed: !!user && role === required };
}

export { Outlet };
