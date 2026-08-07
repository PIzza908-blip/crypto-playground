import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Ticket } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { fmtAmount } from "@/lib/coins";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/c/$code")({
  head: () => ({
    meta: [
      { title: "Чек — Коронка" },
      { name: "description", content: "Тебе прислали чек в Коронке. Активируй и забери монеты." },
      { property: "og:title", content: "Чек — Коронка" },
      { property: "og:description", content: "Забери монеты по чеку в Коронке." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <ClaimPage />
    </RequireAuth>
  ),
});

function ClaimPage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setState("busy");
      const { data, error } = await supabase.rpc("claim_check", { p_code: code });
      if (cancelled) return;
      if (error) {
        setState("error");
        setMessage(error.message);
        return;
      }
      const row = data as unknown as { amount: number; asset: string } | null;
      await qc.invalidateQueries();
      setState("done");
      setMessage(
        row ? `Ты получил ${fmtAmount(Number(row.amount), row.asset)} ${row.asset}` : "Чек активирован",
      );
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [code, qc]);

  return (
    <div className="surface glow mt-10 space-y-4 rounded-3xl p-8 text-center">
      <div className="royal mx-auto flex size-14 items-center justify-center rounded-2xl">
        {state === "busy" ? <Loader2 className="size-6 animate-spin" /> : <Ticket className="size-6" />}
      </div>
      <h1 className="font-display text-xl font-bold">
        {state === "error" ? "Чек недоступен" : state === "done" ? "Чек активирован" : "Активируем чек…"}
      </h1>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      {state !== "busy" && (
        <Button className="royal glow w-full" onClick={() => void navigate({ to: "/" })}>
          В кошелёк
        </Button>
      )}
    </div>
  );
}
