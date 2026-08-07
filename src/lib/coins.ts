export type Coin = {
  asset: string;
  name: string;
  cg: string;
  color: string;
  emoji: string;
  decimals: number;
};

export const COINS: Coin[] = [
  { asset: "TON", name: "Toncoin", cg: "the-open-network", color: "#0098EA", emoji: "💎", decimals: 4 },
  { asset: "USDT", name: "Tether", cg: "tether", color: "#26A17B", emoji: "💵", decimals: 2 },
  { asset: "BTC", name: "Bitcoin", cg: "bitcoin", color: "#F7931A", emoji: "₿", decimals: 8 },
  { asset: "ETH", name: "Ethereum", cg: "ethereum", color: "#8A92B2", emoji: "Ξ", decimals: 6 },
  { asset: "NOT", name: "Notcoin", cg: "notcoin", color: "#1A1A1A", emoji: "🪙", decimals: 2 },
  { asset: "DOGS", name: "Dogs", cg: "dogs-2", color: "#C9A227", emoji: "🐶", decimals: 2 },
  { asset: "SOL", name: "Solana", cg: "solana", color: "#14F195", emoji: "◎", decimals: 4 },
  { asset: "TRX", name: "TRON", cg: "tron", color: "#EF0027", emoji: "⚡", decimals: 2 },
  { asset: "DOGE", name: "Dogecoin", cg: "dogecoin", color: "#C2A633", emoji: "🐕", decimals: 2 },
  { asset: "BNB", name: "BNB", cg: "binancecoin", color: "#F3BA2F", emoji: "🟡", decimals: 4 },
];

export const coinBy = (asset: string) =>
  COINS.find((c) => c.asset === asset) ?? {
    asset,
    name: asset,
    cg: "",
    color: "#8B5CF6",
    emoji: "🪙",
    decimals: 4,
  };

export function fmtAmount(value: number, asset: string) {
  const d = coinBy(asset).decimals;
  if (!Number.isFinite(value)) return "0";
  const fixed = value.toFixed(d);
  return fixed.replace(/\.?0+$/, "") || "0";
}

export function fmtUsd(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}
