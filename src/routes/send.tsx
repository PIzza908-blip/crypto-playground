import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useBalances, usePrices, priceMap } from "@/lib/queries";
import { COINS, fmtAmount, fmtUsd } from "@/lib/coins";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { AssetPicker } from "@/components/AssetPicker";

export const Route = createFileRoute("/send")({
  head: () => ({
    meta: [
      { title: "Перевод — Коронка" },
      { name: "description", content: "Отправь монеты другу по юзернейму мгновенно и без комиссии." },
      { property: "og:title", content: "Перевод — Коронка" },
      { property: "og:description", content: "Мгновенные переводы монет по юзернейму." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <SendPage />
    </RequireAuth>
  ),
});

function SendPage() {
  const { user } = useAuth();
  const { data: balances } = useBalances(user?.id);
  const { data: prices } = usePrices();
  const pm = priceMap(prices);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [asset, setAsset] = useState("USDT");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const available = Number(balances?.find((b) => b.asset === asset)?.amount ?? 0);
  const usd = (Number(amount) || 0) * Number(pm.get(asset)?.usd ?? 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!to.trim()) {
      toast.error("Укажи юзернейм получателя");
      return;
    }
    if (!value || value <= 0) {
      toast.error("Некорректная сумма");
      return;
    }
    if (value > available) {
      toast.error("Недостаточно средств");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.rpc("transfer_to_user", {
        p_username: to.trim(),
        p_asset: asset,
        p_amount: value,
      });
      if (error) throw error;
      await qc.invalidateQueries();
      toast.success(`Отправлено ${fmtAmount(value, asset)} ${asset} для @${to.replace(/^@/, "")}`);
      void navigate({ to: "/" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Перевод не прошёл");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">Отправить</h1>
        <p className="text-sm text-muted-foreground">Перевод по юзернейму внутри Коронки</p>
      </div>

      <div className="surface space-y-4 rounded-3xl p-5">
        <div className="space-y-2">
          <Label>Монета</Label>
          <AssetPicker value={asset} onChange={setAsset} assets={COINS.map((c) => c.asset)} />
          <p className="text-xs text-muted-foreground">
            Доступно: {fmtAmount(available, asset)} {asset}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="to">Получатель</Label>
          <Input
            id="to"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="@username"
            maxLength={40}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Сумма</Label>
          <div className="relative">
            <Input
              id="amount"
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
          <p className="text-xs text-muted-foreground">≈ {fmtUsd(usd)}</p>
        </div>
      </div>

      <Button type="submit" disabled={busy} className="royal glow h-12 w-full text-base">
        {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ArrowUpRight className="mr-2 size-4" />}
        Отправить
      </Button>
    </form>
  );
}
