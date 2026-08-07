import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowDownUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useBalances, usePrices, priceMap } from "@/lib/queries";
import { COINS, fmtAmount, fmtUsd } from "@/lib/coins";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AssetPicker } from "@/components/AssetPicker";

export const Route = createFileRoute("/swap")({
  head: () => ({
    meta: [
      { title: "Обмен — Коронка" },
      { name: "description", content: "Меняй монеты между собой по актуальному курсу за секунду." },
      { property: "og:title", content: "Обмен — Коронка" },
      { property: "og:description", content: "Мгновенный обмен монет по рыночному курсу." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <SwapPage />
    </RequireAuth>
  ),
});

function SwapPage() {
  const { user } = useAuth();
  const { data: balances } = useBalances(user?.id);
  const { data: prices } = usePrices();
  const pm = priceMap(prices);
  const qc = useQueryClient();

  const [from, setFrom] = useState("USDT");
  const [to, setTo] = useState("TON");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const available = Number(balances?.find((b) => b.asset === from)?.amount ?? 0);

  const result = useMemo(() => {
    const value = Number(amount) || 0;
    const fromUsd = Number(pm.get(from)?.usd ?? 0);
    const toUsd = Number(pm.get(to)?.usd ?? 0);
    if (!fromUsd || !toUsd) return 0;
    return (value * fromUsd) / toUsd * 0.995;
  }, [amount, from, to, pm]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (from === to) {
      toast.error("Выбери разные монеты");
      return;
    }
    if (!value || value <= 0 || value > available) {
      toast.error("Проверь сумму");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.rpc("swap_assets", {
        p_from: from,
        p_to: to,
        p_amount: value,
      });
      if (error) throw error;
      await qc.invalidateQueries();
      setAmount("");
      toast.success(`Обменяно на ${fmtAmount(result, to)} ${to}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Обмен не прошёл");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">Обмен</h1>
        <p className="text-sm text-muted-foreground">Комиссия 0.5% · курс рыночный</p>
      </div>

      <div className="surface space-y-3 rounded-3xl p-5">
        <div className="space-y-2">
          <Label>Отдаёшь</Label>
          <AssetPicker value={from} onChange={setFrom} assets={COINS.map((c) => c.asset)} />
          <div className="relative">
            <Input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(",", "."))}
              placeholder="0.00"
              className="pr-20"
            />
            <button
              type="button"
              onClick={() => setAmount(String(available))}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-primary-glow"
            >
              МАКС
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Доступно: {fmtAmount(available, from)} {from}
          </p>
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              setFrom(to);
              setTo(from);
            }}
            className="royal glow flex size-10 items-center justify-center rounded-full"
          >
            <ArrowDownUp className="size-4" />
          </button>
        </div>

        <div className="space-y-2">
          <Label>Получаешь</Label>
          <AssetPicker value={to} onChange={setTo} assets={COINS.map((c) => c.asset)} />
          <div className="rounded-xl bg-muted px-4 py-3">
            <p className="font-display text-xl font-bold">
              {fmtAmount(result, to)} {to}
            </p>
            <p className="text-xs text-muted-foreground">
              ≈ {fmtUsd(result * Number(pm.get(to)?.usd ?? 0))}
            </p>
          </div>
        </div>
      </div>

      <Button type="submit" disabled={busy} className="royal glow h-12 w-full text-base">
        {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
        Обменять
      </Button>
    </form>
  );
}
