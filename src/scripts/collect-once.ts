/**
 * Roda UMA coleta e imprime o resultado, sem subir o app.
 * Util para testar/ajustar os seletores.
 *
 *   npm run collect
 */
import { collectAll } from "../lib/collector";
import { listCoupons, stats } from "../lib/store";
import { createLogger } from "../lib/logger";

const log = createLogger("collect-once");

async function main() {
  const summary = await collectAll();
  log.info(`Coletados ${summary.collected}, novos ${summary.newCount}, expirados ${summary.expiredCount}.`);

  console.log("\n=== Amostra ===");
  for (const c of listCoupons({ limit: 12 })) {
    console.log(`[${c.status}] (${c.store}) ${c.discountText ?? ""} ${c.code ? `[${c.code}]` : ""} — ${c.title}`);
  }
  console.log("\n=== Stats ===", stats());
}

main()
  .catch((e) => log.error(e.message, e))
  .finally(() => process.exit(0));
