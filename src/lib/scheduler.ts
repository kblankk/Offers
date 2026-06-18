import { config } from "./config";
import { collectAll } from "./collector";
import { isStale } from "./store";
import { createLogger } from "./logger";

const log = createLogger("scheduler");

let started = false;
let running = false;

async function runOnce(trigger: string): Promise<void> {
  if (running) {
    log.warn(`Coleta (${trigger}) ignorada: outra ainda em andamento.`);
    return;
  }
  running = true;
  try {
    log.info(`Coleta automatica iniciada (${trigger}).`);
    await collectAll();
  } catch (err) {
    log.error(`Erro na coleta automatica: ${(err as Error).message}`);
  } finally {
    running = false;
  }
}

/**
 * Inicia a auto-coleta dentro do processo (servidor ou worker):
 *  - coleta no boot se os dados estiverem velhos (> ~25 min) ou vazios;
 *  - depois repete a cada COLLECT_INTERVAL_MIN minutos (setInterval).
 *
 * Usa setInterval em vez de cron para nao depender de pacotes com worker
 * threads (que o bundler do Next nao consegue empacotar). Idempotente.
 */
export function startBackgroundCollection(): void {
  if (started) return;
  started = true;

  const intervalMs = Math.max(1, config.collectIntervalMin) * 60_000;

  if (isStale(intervalMs * 0.8)) {
    void runOnce("boot");
  } else {
    log.info("Dados recentes; pulando coleta de boot.");
  }

  const timer = setInterval(() => void runOnce("intervalo"), intervalMs);
  // Nao impede o processo de encerrar (ex.: testes/CLI).
  if (typeof timer.unref === "function") timer.unref();

  log.info(
    `Auto-coleta ativa: lojas=${config.enabledStores.join(",")} a cada ${config.collectIntervalMin} min.`,
  );
}
