import type { Store } from "./types";

const VALID_STORES: Store[] = ["mercadolivre", "amazon", "shopee"];

function csv(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const enabled = csv(process.env.ENABLED_STORES).filter((s): s is Store =>
  VALID_STORES.includes(s as Store),
);

/** Configuracao do app. Sem segredos obrigatorios — o app web funciona out-of-the-box. */
function intMin(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const config = {
  enabledStores: enabled.length ? enabled : VALID_STORES,
  /** Intervalo da auto-coleta, em minutos. */
  collectIntervalMin: intMin(process.env.COLLECT_INTERVAL_MIN, 30),
  headless: (process.env.HEADLESS || "true").toLowerCase() !== "false",
  dbPath: process.env.DB_PATH || "./data/coupons.json",
} as const;
