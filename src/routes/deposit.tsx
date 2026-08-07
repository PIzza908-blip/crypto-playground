import { createFileRoute } from "@tanstack/react-router";
import { Copy, QrCode } from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/deposit")({
  head: () => ({
    meta: [
      { title: "Пополнение — Коронка" },
      { name: "description", content: "Как пополнить баланс в Коронке: перевод от друга или чек." },
      { property: "og:title", content: "Пополнение — Коронка" },
      { property: "og:description", content: "Пополни баланс в Коронке переводом или чеком." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <DepositPage />
    </RequireAuth>
  ),
});

function DepositPage() {
  const { profile } = useAuth();
  const tag = `@${profile?.username ?? ""}`;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">Пополнение</h1>
        <p className="text-sm text-muted-foreground">Принимай переводы по своему юзернейму</p>
      </div>

      <div className="surface glow space-y-4 rounded-3xl p-6 text-center">
        <div className="royal mx-auto flex size-14 items-center justify-center rounded-2xl">
          <QrCode className="size-6" />
        </div>
        <p className="text-xs tracking-widest text-muted-foreground uppercase">Твой адрес</p>
        <p className="font-display text-2xl font-bold break-all">{tag}</p>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            void navigator.clipboard.writeText(tag);
            toast.success("Юзернейм скопирован");
          }}
        >
          <Copy className="mr-2 size-4" />
          Скопировать
        </Button>
      </div>

      <div className="surface space-y-2 rounded-3xl p-5 text-sm text-muted-foreground">
        <p className="text-foreground font-semibold">Как пополнить</p>
        <p>1. Попроси друга открыть «Отправить» и указать твой юзернейм.</p>
        <p>2. Или активируй присланный чек на вкладке «Чеки».</p>
        <p>3. Средства приходят мгновенно, без комиссии.</p>
      </div>
    </div>
  );
}
