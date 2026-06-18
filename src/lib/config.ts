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

function csvList(value: string | undefined, fallback: string[]): string[] {
  const list = csv(value);
  return list.length ? list : fallback;
}

// Canais publicos de cupom no Telegram (sobrescreva com TELEGRAM_CHANNELS).
// Selecionados por varredura: os que mais postam codigos reais com loja.
const DEFAULT_CHANNELS = [
  "economizandocomjp",
  "pechinchou",
  "promobit",
  "cuponomia",
  "ofertasdodia",
  "cupomdedesconto",
  "achadinhosshopee",
  "cuponzeiros",
  "ofertasrelampago",
  "economizaai",
  "ofertasdoluan",
];

export const config = {
  enabledStores: enabled.length ? enabled : VALID_STORES,
  /** Intervalo da auto-coleta, em minutos. */
  collectIntervalMin: intMin(process.env.COLLECT_INTERVAL_MIN, 5),
  /** Canais do Telegram para varrer (previa web t.me/s/<canal>). */
  telegramChannels: csvList(process.env.TELEGRAM_CHANNELS, DEFAULT_CHANNELS),
  dbPath: process.env.DB_PATH || "./data/coupons.json",
} as const;
