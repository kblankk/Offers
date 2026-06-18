import type { RawCoupon, Store } from "../types";
import { config } from "../config";
import type { ProviderContext } from "./provider";
import { collectFromCuponomia } from "./cuponomia";
import { collectFromTelegram } from "./telegram";

/** Slug de cada loja na fonte agregadora (Cuponomia). */
const SLUG: Record<Store, string> = {
  mercadolivre: "mercado-livre",
  amazon: "amazon",
  shopee: "shopee",
};

/**
 * Uma fonte de cupons. Pode cobrir uma loja (Cuponomia) ou varias (Telegram).
 * Cada cupom retornado ja vem com sua `store` e `source` definidas.
 */
export interface CouponSource {
  name: string;
  collect(ctx: ProviderContext): Promise<RawCoupon[]>;
}

/** Todas as fontes habilitadas: Cuponomia (por loja) + canais de Telegram. */
export function allSources(): CouponSource[] {
  const sources: CouponSource[] = [];

  for (const store of config.enabledStores) {
    sources.push({
      name: `cuponomia:${store}`,
      collect: async (ctx) =>
        (await collectFromCuponomia(store, SLUG[store], ctx)).map((c) => ({ ...c, source: "cuponomia" })),
    });
  }

  if (config.telegramChannels.length) {
    sources.push({
      name: "telegram",
      collect: (ctx) => collectFromTelegram(config.telegramChannels, ctx),
    });
  }

  return sources;
}
