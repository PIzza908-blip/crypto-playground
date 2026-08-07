import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CreditCard,
  Gift,
  Ticket,
} from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth";
import { useTransactions } from "@/lib/queries";
import { fmtAmount } from "@/lib/coins";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "История — Коронка" },
      { name: "description", content: "Все операции в Коронке: переводы, чеки, обмены и выводы." },
      { property: "og:title", content: "История — Коронка" },
      { property: "og:description", content: "История операций твоего кошелька Коронка." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <HistoryPage />
    </RequireAuth>
  ),
});

const KIND: Record<string, { label: string; icon: typeof ArrowUpRight }> = {
  transfer_in: { label: "Получено", icon: ArrowDownLeft },
  transfer_out: { label: "Отправлено", icon: ArrowUpRight },
  check_created: { label: "Чек создан", icon: Ticket },
  check_claimed: { label: "Чек активирован", icon: Ticket },
  swap_out: { label: "Обмен", icon: ArrowLeftRight },
  swap_in: { label: "Обмен", icon: ArrowLeftRight },
  withdrawal: { label: "Вывод на карту", icon: CreditCard },
  bonus: { label: "Бонус", icon: Gift },
  admin_adjust: { label: "Корректировка", icon: Gift },
};

function HistoryPage() {
  const { user } = useAuth();
  const { data: txs, isLoading } = useTransactions(user?.id);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">История</h1>
        <p className="text-sm text-muted-foreground">Все операции по кошельку</p>
      </div>

      <ul className="surface divide-y divide-border overflow-hidden rounded-3xl">
        {isLoading && <li className="px-4 py-6 text-sm text-muted-foreground">Загрузка…</li>}
        {!isLoading && (txs ?? []).length === 0 && (
          <li className="px-4 py-6 text-sm text-muted-foreground">Операций пока нет</li>
        )}
        {(txs ?? []).map((tx) => {
          const meta = KIND[tx.kind] ?? { label: tx.kind, icon: ArrowLeftRight };
          const Icon = meta.icon;
          const delta = Number(tx.amount);
          const positive = delta > 0;
          return (
            <li key={tx.id} className="flex items-center gap-3 px-4 py-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                <Icon className="size-4 text-primary-glow" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{meta.label}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {tx.counterparty ? `@${tx.counterparty} · ` : ""}
                  {new Date(tx.created_at).toLocaleString("ru-RU", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <p className={`text-sm font-semibold ${positive ? "text-success" : "text-foreground"}`}>
                {positive ? "+" : ""}
                {fmtAmount(delta, tx.asset)} {tx.asset}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
