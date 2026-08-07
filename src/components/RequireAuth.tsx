import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) void navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  if (loading || !session || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-7 animate-spin text-primary-glow" />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
