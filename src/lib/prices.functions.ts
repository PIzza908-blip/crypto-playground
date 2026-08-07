import { createServerFn } from "@tanstack/react-start";

const CG_IDS: Record<string, string> = {
  "the-open-network": "TON",
  tether: "USDT",
  bitcoin: "BTC",
  ethereum: "ETH",
  notcoin: "NOT",
  "dogs-2": "DOGS",
  solana: "SOL",
  tron: "TRX",
  dogecoin: "DOGE",
  binancecoin: "BNB",
};

/**
 * Pulls live USD prices from CoinGecko and stores them so every client
 * sees the same rates. Fails soft: the DB keeps the last known values.
 */
export const refreshPrices = createServerFn({ method: "POST" }).handler(async () => {
  const ids = Object.keys(CG_IDS).join(",");
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

  try {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) return { ok: false, updated: 0 };
    const data = (await res.json()) as Record<
      string,
      { usd?: number; usd_24h_change?: number }
    >;

    const rows = Object.entries(CG_IDS)
      .map(([cgId, asset]) => {
        const entry = data[cgId];
        if (!entry?.usd) return null;
        return {
          asset,
          usd: entry.usd,
          change_24h: Number((entry.usd_24h_change ?? 0).toFixed(2)),
          updated_at: new Date().toISOString(),
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (rows.length === 0) return { ok: false, updated: 0 };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (const row of rows) {
      await supabaseAdmin
        .from("prices")
        .update({ usd: row.usd, change_24h: row.change_24h, updated_at: row.updated_at })
        .eq("asset", row.asset);
    }
    return { ok: true, updated: rows.length };
  } catch (error) {
    console.error("refreshPrices failed", error);
    return { ok: false, updated: 0 };
  }
});
