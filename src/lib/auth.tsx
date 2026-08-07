import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  username: string;
  tg_id: number | null;
  is_admin: boolean;
  created_at: string;
};

type AuthState = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export const usernameToEmail = (username: string) =>
  `${username.trim().replace(/^@/, "").toLowerCase()}@koronka.app`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string | undefined) => {
    if (!uid) {
      setProfile(null);
      return;
    }
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    setProfile((data as Profile) ?? null);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setTimeout(() => {
        void loadProfile(nextSession?.user?.id);
      }, 0);
    });

    void (async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      await loadProfile(data.session?.user?.id);
      setLoading(false);
    })();

    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthState = {
    user: session?.user ?? null,
    session,
    profile,
    loading,
    refreshProfile: () => loadProfile(session?.user?.id),
    signOut: async () => {
      await supabase.auth.signOut();
      setProfile(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
