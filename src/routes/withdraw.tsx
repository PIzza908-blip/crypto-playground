import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useBalances, useWithdrawals, usePrices, priceMap } from "@/lib/queries";
import { COINS, fmtAmount, fmtUsd } from "@/lib/coins";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AssetPicker } from "@/components/AssetPicker";

export const Route = createFileRoute("/withdraw")({
  head: () => ({
    meta: [
      { title: "Вывод — Коронка" },
      { name: "description", content: "Заявка на вывод средств на банковскую карту из Коронки." },
      { property: "og:title", content: "Вывод — Коронка" },
      { property: "og:description", content: "Вывод средств на карту из Коронки." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <WithdrawPage />
    </RequireAuth>
  ),
});

function WithdrawPage() {
  const { user } = useAuth();
  const { data: balances } = useBalances(user?.id);
  const { data: withdrawals } = useWithdrawals(user?.id);
  const { data: prices } = usePrices();
  const pm = priceMap(prices);
  const qc = useQueryClient();

  const [asset, setAsset] = useState("USDT");
  const [amount, setAmount] = useState("");
  const [card, setCard] = useState("");
  const [busy, setBusy] = useState(false);

  const available = Number(balances?.find((b) => b.asset === asset)?.amount ?? 0);
  const usd = (Number(amount) || 0) * Number(pm.get(asset)?.usd ?? 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    const digits = card.replace(/\D/g, "");
    if (digits.length < 16) {
      toast.error("Введи номер карты");
      return;
    }
    if (!value || value <= 0 || value > available) {
      toast.error("Проверь сумму");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.rpc("request_withdrawal", {
        p_asset: asset,
        p_amount: value,
        p_method: "card",
        p_destination: `**** ${digits.slice(-4)}`,
      });
      if (error) throw error;
      await qc.invalidateQueries();
      setAmount("");
      setCard("");
      toast.success("Заявка принята — платёжная система обрабатывает перевод");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Заявка не создана");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">Вывод на карту</h1>
        <p className="text-sm text-muted-foreground">Обработка занимает до 3 рабочих дней</p>
      </div>

      <form onSubmit={submit} className="surface space-y-4 rounded-3xl p-5">
        <div className="space-y-2">
          <Label>Монета</Label>
          <AssetPicker value={asset} onChange={setAsset} assets={COINS.map((c) => c.asset)} />
          <p className="text-xs text-muted-foreground">
            Доступно: {fmtAmount(available, asset)} {asset}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="card">Номер карты</Label>
          <Input
            id="card"
            inputMode="numeric"
            value={card}
            onChange={(e) =>
              setCard(
                e.target.value
                  .replace(/\D/g, "")
                  .slice(0, 16)
                  .replace(/(.{4})/g, "$1 ")
                  .trim(),
              )
            }
            placeholder="0000 0000 0000 0000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="wd-amount">Сумма</Label>
          <Input
            id="wd-amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(",", "."))}
            placeholder="0.00"
          />
          <p className="text-xs text-muted-foreground">≈ {fmtUsd(usd)}</p>
        </div>

        <Button type="submit" disabled={busy} className="royal glow h-11 w-full">
          {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CreditCard className="mr-2 size-4" />}
          Вывести
        </Button>
      </form>

      <section className="space-y-2">
        <h2 className="font-display px-1 text-base font-semibold">Заявки</h2>
        <ul className="surface divide-y divide-border overflow-hidden rounded-3xl">
          {(withdrawals ?? []).length === 0 && (
            <li className="px-4 py-6 text-sm text-muted-foreground">Заявок пока нет</li>
          )}
          {(withdrawals ?? []).map((w) => (
            <li key={w.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {fmtAmount(Number(w.amount), w.asset)} {w.asset}
                </p>
                <p className="text-xs text-muted-foreground">{w.destination}</p>
              </div>
              <span className="rounded-full bg-warning/15 px-2.5 py-1 text-[11px] font-medium text-warning">
                Обрабатывается
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
