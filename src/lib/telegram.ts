export type TelegramUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
};

type TelegramWebApp = {
  ready: () => void;
  expand: () => void;
  initDataUnsafe?: { user?: TelegramUser };
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  HapticFeedback?: { impactOccurred: (style: string) => void };
};

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  const tg = (window as unknown as { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp;
  return tg ?? null;
}

export function getTelegramUser(): TelegramUser | null {
  return getTelegramWebApp()?.initDataUnsafe?.user ?? null;
}

export function initTelegram() {
  const tg = getTelegramWebApp();
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();
    tg.setHeaderColor?.("#0f0a16");
    tg.setBackgroundColor?.("#0f0a16");
  } catch {
    /* ignore */
  }
}

export function haptic() {
  try {
    getTelegramWebApp()?.HapticFeedback?.impactOccurred("light");
  } catch {
    /* ignore */
  }
}
