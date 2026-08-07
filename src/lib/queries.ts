import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PriceRow = {
  asset: string;
  name: string;
  usd: number;
  change_24h: number;
  updated_at: string;
};

export type BalanceRow = { user_id: string; asset: string; amount: number };

export type TxRow = {
  id: string;
  kind: string;
  asset: string;
  amount: number;
  counterparty: string | null;
  status: string;
  note: string | null;
  created_at: string;
};

export type CheckRow = {
  id: string;
  code: string;
  creator_id: string;
  asset: string;
  amount: number;
  comment: string | null;
  claimed_by: string | null;
  claimed_at: string | null;
  created_at: string;
};

export type WithdrawalRow = {
  id: string;
  asset: string;
  amount: number;
  usd_value: number;
  method: string;
  destination: string;
  status: string;
  created_at: string;
};

export function usePrices() {
  return useQuery({
    queryKey: ["prices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("prices").select("*");
      if (error) throw error;
      return (data ?? []) as unknown as PriceRow[];
    },
    refetchInterval: 60_000,
  });
}

export function useBalances(userId: string | undefined) {
  return useQuery({
    queryKey: ["balances", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("balances").select("*");
      if (error) throw error;
      return (data ?? []) as unknown as BalanceRow[];
    },
  });
}

export function useTransactions(userId: string | undefined, limit = 50) {
  return useQuery({
    queryKey: ["transactions", userId, limit],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as TxRow[];
    },
  });
}

export function useMyChecks(userId: string | undefined) {
  return useQuery({
    queryKey: ["checks", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CheckRow[];
    },
  });
}

export function useWithdrawals(userId: string | undefined) {
  return useQuery({
    queryKey: ["withdrawals", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as WithdrawalRow[];
    },
  });
}

export function priceMap(prices: PriceRow[] | undefined) {
  const map = new Map<string, PriceRow>();
  (prices ?? []).forEach((p) => map.set(p.asset, p));
  return map;
}
