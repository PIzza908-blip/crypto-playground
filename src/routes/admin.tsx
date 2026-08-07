import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { COINS, fmtUsd } from "@/lib/coins";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AssetPicker } from "@/components/AssetPicker";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Админ — Коронка" },
      { name: "description", content: "Панель администратора Коронки: пользователи и балансы." },
      { property: "og:title", content: "Админ — Коронка" },
      { property: "og:description", content: "Управление пользователями Коронки." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <AdminPage />
    </RequireAuth>
  ),
});

function AdminPage() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [username, setUsername] = useState("");
  const [asset, setAsset] = useState("USDT");
  const [delta, setDelta] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    enabled: !!profile?.is_admin,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_users");
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!profile?.is_admin) {
    return (
      <div className="surface mt-10 rounded-3xl p-8 text-center">
        <h1 className="font-display text-xl font-bold">Доступ закрыт</h1>
        <p className="mt-2 text-sm text-muted-foreground">Эта страница только для администратора.</p>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(delta);
    if (!username.trim() || !value) {
      toast.error("Заполни юзернейм и сумму");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.rpc("admin_adjust_balance", {
        p_username: username.trim().replace(/^@/, ""),
        p_asset: asset,
        p_delta: value,
      });
      if (error) throw error;
      await qc.invalidateQueries();
      setDelta("");
      toast.success("Баланс обновлён");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось изменить баланс");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="size-5 text-primary-glow" />
        <h1 className="font-display text-2xl font-bold">Админ-панель</h1>
      </div>

      <form onSubmit={submit} className="surface space-y-4 rounded-3xl p-5">
        <div className="space-y-2">
          <Label htmlFor="admin-user">Пользователь</Label>
          <Input
            id="admin-user"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="@username"
          />
        </div>
        <div className="space-y-2">
          <Label>Монета</Label>
          <AssetPicker value={asset} onChange={setAsset} assets={COINS.map((c) => c.asset)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="delta">Изменение (можно минус)</Label>
          <Input
            id="delta"
            inputMode="decimal"
            value={delta}
            onChange={(e) => setDelta(e.target.value.replace(",", "."))}
            placeholder="100"
          />
        </div>
        <Button type="submit" disabled={busy} className="royal glow h-11 w-full">
          {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
          Применить
        </Button>
      </form>

      <section className="space-y-2">
        <h2 className="font-display px-1 text-base font-semibold">Пользователи</h2>
        <ul className="surface divide-y divide-border overflow-hidden rounded-3xl">
          {(users ?? []).map((u) => (
            <li key={u.username} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">@{u.username}</p>
                <p className="text-xs text-muted-foreground">
                  {u.tg_id ? `TG ${u.tg_id} · ` : ""}
                  {new Date(u.created_at).toLocaleDateString("ru-RU")}
                </p>
              </div>
              <p className="text-sm font-semibold">{fmtUsd(Number(u.usd_total))}</p>
              <button
                type="button"
                onClick={() => setUsername(u.username)}
                className="text-xs text-primary-glow"
              >
                Выбрать
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
