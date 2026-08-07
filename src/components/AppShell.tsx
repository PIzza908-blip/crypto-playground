import { Link, useRouterState } from "@tanstack/react-router";
import { Wallet, LineChart, Ticket, ArrowLeftRight, Clock, Crown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Кошелёк", icon: Wallet },
  { to: "/market", label: "Рынок", icon: LineChart },
  { to: "/swap", label: "Обмен", icon: ArrowLeftRight },
  { to: "/checks", label: "Чеки", icon: Ticket },
  { to: "/history", label: "История", icon: Clock },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
      <header className="flex items-center justify-between px-5 pt-6 pb-2">
        <Link to="/" className="flex items-center gap-2">
          <span className="royal glow flex size-9 items-center justify-center rounded-xl">
            <Crown className="size-5" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">Коронка</span>
        </Link>
      </header>

      <main className="flex-1 px-5 pb-28">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t border-border bg-background/85 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur-xl">
        <ul className="flex items-stretch justify-between">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <li key={to} className="flex-1">
                <Link
                  to={to}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-colors",
                    active ? "text-primary-glow" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className={cn("size-5", active && "drop-shadow-[0_0_8px_currentColor]")} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
