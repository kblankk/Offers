import { allSources } from "./providers/index";
import { expireUnseen, upsertCoupon } from "./store";
import type { Coupon } from "./types";
import { createLogger } from "./logger";

const log = createLogger("collector");


export interface CollectSummary {
  collected: number;
  newCount: number;
  expiredCount: number;
  newCoupons: Coupon[];
  errors: { source: string; message: string }[];
  bySource: Record<string, number>;
  finishedAt: string;
}

/**
 * Roda TODAS as fontes (Cuponomia por loja + canais de Telegram), faz upsert
 * (deduplicando por codigo entre fontes) e expira o que sumiu ha tempo demais.
 */
export async function collectAll(): Promise<CollectSummary> {
  const summary: CollectSummary = {
    collected: 0,
    newCount: 0,
    expiredCount: 0,
    newCoupons: [],
    errors: [],
    bySource: {},
    finishedAt: "",
  };

  for (const source of allSources()) {
    try {
      const raws = await source.collect({ log });
      summary.bySource[source.name] = raws.length;
      for (const raw of raws) {
        const { coupon, isNew } = upsertCoupon(raw);
        summary.collected++;
        if (isNew) {
          summary.newCount++;
          summary.newCoupons.push(coupon);
        }
      }
    } catch (err) {
      const message = (err as Error).message;
      log.error(`Fonte ${source.name} falhou: ${message}`);
      summary.errors.push({ source: source.name, message });
    }
  }

  summary.expiredCount = expireUnseen();
  summary.finishedAt = new Date().toISOString();
  log.info(
    `Coleta: ${summary.collected} cupons, ${summary.newCount} novos, ${summary.expiredCount} expirados, ${summary.errors.length} erros.`,
  );
  return summary;
}
