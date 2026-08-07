import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpRight,
  CreditCard,
  LogOut,
  Shield,
  Ticket,
} from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth";
import { useBalances, usePrices, priceMap } from "@/lib/queries";
import { COINS, fmtAmount, fmtUsd } from "@/lib/coins";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Коронка — кошелёк" },
      {
        name: "description",
        content: "Твои балансы в Коронке: реальные курсы, чеки, переводы, обмен и вывод.",
      },
      { property: "og:title", content: "Коронка — кошелёк" },
      { property: "og:description", content: "Балансы, чеки и переводы в Коронке." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <WalletPage />
    </RequireAuth>
  ),
});

const ACTIONS = [
  { to: "/send", label: "Отправить", icon: ArrowUpRight },
  { to: "/checks", label: "Чек", icon: Ticket },
  { to: "/swap", label: "Обмен", icon: ArrowLeftRight },
  { to: "/withdraw", label: "Вывод", icon: CreditCard },
] as const;

function WalletPage() {
  const { user, profile, signOut } = useAuth();
  const { data: balances } = useBalances(user?.id);
  const { data: prices } = usePrices();
  const pm = priceMap(prices);

  const rows = COINS.map((coin) => {
    const amount = Number(balances?.find((b) => b.asset === coin.asset)?.amount ?? 0);
    const price = Number(pm.get(coin.asset)?.usd ?? 0);
    return { coin, amount, usd: amount * price, change: Number(pm.get(coin.asset)?.change_24h ?? 0) };
  }).sort((a, b) => b.usd - a.usd);

  const total = rows.reduce((sum, r) => sum + r.usd, 0);

  return (
    <div className="space-y-5">
      <section className="surface glow relative overflow-hidden rounded-3xl p-6">
        <div className="royal pointer-events-none absolute -top-16 -right-10 size-40 rounded-full opacity-25 blur-3xl" />
        <p className="text-xs tracking-widest text-muted-foreground uppercase">Общий баланс</p>
        <p className="font-display mt-1 text-4xl font-bold">{fmtUsd(total)}</p>
        <p className="mt-2 text-sm text-muted-foreground">@{profile?.username}</p>

        <div className="mt-6 grid grid-cols-4 gap-2">
          {ACTIONS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-secondary/70 py-3 text-[11px] font-medium transition-colors hover:bg-accent"
            >
              <Icon className="size-5 text-primary-glow" />
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-display text-base font-semibold">Активы</h2>
          <Link to="/market" className="text-xs text-primary-glow">
            Курсы
          </Link>
        </div>

        <ul className="surface divide-y divide-border overflow-hidden rounded-3xl">
          {rows.map(({ coin, amount, usd, change }) => (
            <li key={coin.asset} className="flex items-center gap-3 px-4 py-3">
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-full text-lg"
                style={{ backgroundColor: `${coin.color}22`, color: coin.color }}
              >
                {coin.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{coin.name}</p>
                <p className="text-xs text-muted-foreground">
                  {fmtUsd(Number(pm.get(coin.asset)?.usd ?? 0))}{" "}
                  <span className={change >= 0 ? "text-success" : "text-destructive"}>
                    {change >= 0 ? "+" : ""}
                    {change.toFixed(2)}%
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">
                  {fmtAmount(amount, coin.asset)} {coin.asset}
                </p>
                <p className="text-xs text-muted-foreground">{fmtUsd(usd)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <Link
          to="/deposit"
          className="surface flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium"
        >
          <ArrowDownToLine className="size-4 text-primary-glow" />
          Пополнить кошелёк
        </Link>
        {profile?.is_admin && (
          <Link
            to="/admin"
            className="surface flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium"
          >
            <Shield className="size-4 text-primary-glow" />
            Панель администратора
          </Link>
        )}
        <Button
          variant="ghost"
          onClick={() => void signOut()}
          className="justify-start gap-3 text-muted-foreground"
        >
          <LogOut className="size-4" />
          Выйти
        </Button>
      </section>
    </div>
  );
}

