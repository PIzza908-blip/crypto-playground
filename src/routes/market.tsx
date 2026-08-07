import { createFileRoute } from "@tanstack/react-router";
import { TrendingDown, TrendingUp } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { usePrices } from "@/lib/queries";
import { COINS, coinBy, fmtUsd } from "@/lib/coins";

export const Route = createFileRoute("/market")({
  head: () => ({
    meta: [
      { title: "Рынок — Коронка" },
      { name: "description", content: "Актуальные курсы монет в Коронке, обновление каждую минуту." },
      { property: "og:title", content: "Рынок — Коронка" },
      { property: "og:description", content: "Реальные курсы криптовалют в Коронке." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <MarketPage />
    </RequireAuth>
  ),
});

function MarketPage() {
  const { data: prices, isLoading } = usePrices();

  const rows = (prices ?? [])
    .map((p) => ({ ...p, coin: coinBy(p.asset) }))
    .sort((a, b) => COINS.findIndex((c) => c.asset === a.asset) - COINS.findIndex((c) => c.asset === b.asset));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">Рынок</h1>
        <p className="text-sm text-muted-foreground">Курсы в реальном времени</p>
      </div>

      <ul className="surface divide-y divide-border overflow-hidden rounded-3xl">
        {isLoading && <li className="px-4 py-6 text-sm text-muted-foreground">Загрузка курсов…</li>}
        {rows.map((row) => {
          const change = Number(row.change_24h);
          const up = change >= 0;
          return (
            <li key={row.asset} className="flex items-center gap-3 px-4 py-3">
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-full text-lg"
                style={{ backgroundColor: `${row.coin.color}22`, color: row.coin.color }}
              >
                {row.coin.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{row.name}</p>
                <p className="text-xs text-muted-foreground">{row.asset}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{fmtUsd(Number(row.usd))}</p>
                <p
                  className={`flex items-center justify-end gap-1 text-xs ${up ? "text-success" : "text-destructive"}`}
                >
                  {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                  {up ? "+" : ""}
                  {change.toFixed(2)}%
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
