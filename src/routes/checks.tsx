import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Loader2, Ticket } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useBalances, useMyChecks } from "@/lib/queries";
import { COINS, fmtAmount } from "@/lib/coins";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AssetPicker } from "@/components/AssetPicker";

export const Route = createFileRoute("/checks")({
  head: () => ({
    meta: [
      { title: "Чеки — Коронка" },
      { name: "description", content: "Создавай чеки со ссылкой и активируй чужие по коду." },
      { property: "og:title", content: "Чеки — Коронка" },
      { property: "og:description", content: "Чеки Коронки: отправь монеты ссылкой." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <ChecksPage />
    </RequireAuth>
  ),
});

function ChecksPage() {
  const { user } = useAuth();
  const { data: balances } = useBalances(user?.id);
  const { data: checks } = useMyChecks(user?.id);
  const qc = useQueryClient();

  const [asset, setAsset] = useState("USDT");
  const [amount, setAmount] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const available = Number(balances?.find((b) => b.asset === asset)?.amount ?? 0);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0 || value > available) {
      toast.error("Проверь сумму");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("create_check", {
        p_asset: asset,
        p_amount: value,
      });
      if (error) throw error;
      await qc.invalidateQueries();
      setAmount("");
      void copyLink(String(data));
      toast.success("Чек создан, ссылка скопирована");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось создать чек");
    } finally {
      setBusy(false);
    }
  };

  const claim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Введи код чека");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.rpc("claim_check", { p_code: code.trim() });
      if (error) throw error;
      await qc.invalidateQueries();
      setCode("");
      toast.success("Чек активирован");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Чек недоступен");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">Чеки</h1>
        <p className="text-sm text-muted-foreground">Отправь монеты ссылкой кому угодно</p>
      </div>

      <form onSubmit={create} className="surface space-y-4 rounded-3xl p-5">
        <div className="space-y-2">
          <Label>Монета</Label>
          <AssetPicker value={asset} onChange={setAsset} assets={COINS.map((c) => c.asset)} />
          <p className="text-xs text-muted-foreground">
            Доступно: {fmtAmount(available, asset)} {asset}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="check-amount">Сумма чека</Label>
          <Input
            id="check-amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(",", "."))}
            placeholder="0.00"
          />
        </div>
        <Button type="submit" disabled={busy} className="royal glow h-11 w-full">
          {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Ticket className="mr-2 size-4" />}
          Создать чек
        </Button>
      </form>

      <form onSubmit={claim} className="surface space-y-3 rounded-3xl p-5">
        <Label htmlFor="code">Активировать чек</Label>
        <div className="flex gap-2">
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Код чека"
          />
          <Button type="submit" disabled={busy} variant="secondary">
            Забрать
          </Button>
        </div>
      </form>

      <section className="space-y-2">
        <h2 className="font-display px-1 text-base font-semibold">Мои чеки</h2>
        <ul className="surface divide-y divide-border overflow-hidden rounded-3xl">
          {(checks ?? []).length === 0 && (
            <li className="px-4 py-6 text-sm text-muted-foreground">Пока нет чеков</li>
          )}
          {(checks ?? []).map((check) => {
            const active = !check.claimed_by;
            return (
              <li key={check.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {fmtAmount(Number(check.amount), check.asset)} {check.asset}
                  </p>
                  <p className="truncate font-mono text-xs text-muted-foreground">{check.code}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {active ? "Активен" : "Активирован"}
                </span>
                {active && (
                  <button
                    type="button"
                    onClick={() => void copyLink(check.code)}
                    className="text-primary-glow"
                    aria-label="Скопировать ссылку"
                  >
                    <Copy className="size-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

async function copyLink(code: string) {
  const link = `${window.location.origin}/c/${code}`;
  try {
    await navigator.clipboard.writeText(link);
    toast.success("Ссылка скопирована");
  } catch {
    toast.message(link);
  }
}
