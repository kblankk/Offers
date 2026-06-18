/**
 * Worker de coleta periodica. Roda separado do app web (que so le os dados).
 *
 *   npm run worker
 *
 * Faz uma coleta ao iniciar e depois segue o cron de COLLECT_CRON.
 */
import cron from "node-cron";
import { config } from "../lib/config";
import { collectAll } from "../lib/collector";
import { closeBrowser } from "../lib/browser";
import { createLogger } from "../lib/logger";

const log = createLogger("worker");

let running = false;
async function runOnce() {
  if (running) return log.warn("Coleta anterior ainda em andamento; pulando.");
  running = true;
  try {
    await collectAll();
  } catch (err) {
    log.error(`Erro na coleta: ${(err as Error).message}`);
  } finally {
    running = false;
  }
}

async function main() {
  if (!cron.validate(config.collectCron)) throw new Error(`COLLECT_CRON invalido: ${config.collectCron}`);
  log.info(`Worker iniciado. Lojas: ${config.enabledStores.join(", ")} · cron: "${config.collectCron}"`);

  await runOnce(); // coleta inicial

  const task = cron.schedule(config.collectCron, runOnce);

  const shutdown = async () => {
    task.stop();
    await closeBrowser();
    process.exit(0);
  };
  process.once("SIGINT", () => void shutdown());
  process.once("SIGTERM", () => void shutdown());
}

main().catch((err) => {
  log.error(`Falha fatal: ${(err as Error).message}`);
  process.exit(1);
});
