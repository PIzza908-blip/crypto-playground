import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usernameToEmail, useAuth } from "@/lib/auth";
import { getTelegramUser } from "@/lib/telegram";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Вход в Коронку" },
      { name: "description", content: "Войди или зарегистрируйся в Коронке по своему юзернейму." },
      { property: "og:title", content: "Вход в Коронку" },
      { property: "og:description", content: "Крипто-кошелёк Коронка для своих." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { session, refreshProfile } = useAuth();

  useEffect(() => {
    const tgUser = getTelegramUser();
    if (tgUser?.username) setUsername(tgUser.username);
  }, []);

  useEffect(() => {
    if (session) void navigate({ to: "/" });
  }, [session, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = username.trim().replace(/^@/, "");
    if (!/^[A-Za-z0-9_]{3,32}$/.test(clean)) {
      toast.error("Юзернейм: 3–32 символа, буквы, цифры и _");
      return;
    }
    if (password.length < 6) {
      toast.error("Пароль минимум 6 символов");
      return;
    }
    setBusy(true);
    try {
      const email = usernameToEmail(clean);
      const tgId = getTelegramUser()?.id;
      const bootstrapArgs = tgId
        ? { p_username: clean, p_tg_id: tgId }
        : { p_username: clean };
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        const { error: rpcError } = await supabase.rpc("bootstrap_profile", bootstrapArgs);
        if (rpcError) throw rpcError;
        await refreshProfile();
        toast.success("Аккаунт создан. Держи стартовый бонус 25 USDT");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await supabase.rpc("bootstrap_profile", bootstrapArgs);
        await refreshProfile();
        toast.success("С возвращением");
      }
      void navigate({ to: "/" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не получилось";
      toast.error(
        message.includes("already registered")
          ? "Такой юзернейм уже занят"
          : message.includes("Invalid login")
            ? "Неверный юзернейм или пароль"
            : message,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <span className="royal glow mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl">
          <Crown className="size-8" />
        </span>
        <h1 className="text-royal font-display text-4xl font-bold">Коронка</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Крипто-кошелёк для своих. Чеки, переводы, обмен.
        </p>
      </div>

      <div className="surface rounded-3xl p-5">
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
          {(["register", "login"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
                mode === m ? "royal" : "text-muted-foreground"
              }`}
            >
              {m === "register" ? "Регистрация" : "Вход"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Юзернейм Telegram</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ZynxMedia"
              autoComplete="username"
              maxLength={32}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              maxLength={64}
            />
          </div>
          <Button type="submit" disabled={busy} className="royal glow h-12 w-full text-base">
            {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
            {mode === "register" ? "Создать кошелёк" : "Войти"}
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Внутренний проект для друзей. Активы отображаются по реальным курсам.
      </p>
    </div>
  );
}
