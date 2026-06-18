import { enabledProviders } from "./providers/index";
import { markStaleAsExpired, upsertCoupon } from "./store";
import type { Coupon } from "./types";
import { createLogger } from "./logger";

const log = createLogger("collector");

export interface CollectSummary {
  collected: number;
  newCount: number;
  expiredCount: number;
  newCoupons: Coupon[];
  errors: { store: string; message: string }[];
  finishedAt: string;
}

/**
 * Roda todos os provedores habilitados. Para cada loja:
 *  1. coleta a lista atual de cupons e marca como ativos (upsert);
 *  2. marca como expirados os cupons daquela loja que sairam da lista.
 *
 * Ou seja, cada coleta JA e uma verificacao de validade — a fonte de verdade
 * e a propria lista de cupons no agregador.
 */
export async function collectAll(): Promise<CollectSummary> {
  const summary: CollectSummary = {
    collected: 0,
    newCount: 0,
    expiredCount: 0,
    newCoupons: [],
    errors: [],
    finishedAt: "",
  };

  for (const provider of enabledProviders()) {
    const runStartedAt = new Date().toISOString();
    try {
      const raws = await provider.collect({ log });
      for (const raw of raws) {
        const { coupon, isNew } = upsertCoupon(raw);
        summary.collected++;
        if (isNew) {
          summary.newCount++;
          summary.newCoupons.push(coupon);
        }
      }
      // So expira por ausencia se a coleta trouxe algo (evita zerar tudo num bloqueio).
      if (raws.length > 0) {
        summary.expiredCount += markStaleAsExpired(provider.store, runStartedAt);
      }
    } catch (err) {
      const message = (err as Error).message;
      log.error(`Provedor ${provider.label} falhou: ${message}`);
      summary.errors.push({ store: provider.store, message });
    }
  }

  summary.finishedAt = new Date().toISOString();
  log.info(
    `Coleta: ${summary.collected} cupons, ${summary.newCount} novos, ${summary.expiredCount} expirados, ${summary.errors.length} erros.`,
  );
  return summary;
}
