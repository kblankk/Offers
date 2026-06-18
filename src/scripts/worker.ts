/**
 * Worker de coleta periodica autonomo (opcional).
 *
 *   npm run worker
 *
 * OBS: o servidor web (npm run dev / npm start) JA faz a auto-coleta sozinho
 * via instrumentation.ts. Este worker so e util se voce quiser rodar a coleta
 * separada do site (ex.: em outra maquina).
 */
import { startBackgroundCollection } from "../lib/scheduler";
import { createLogger } from "../lib/logger";

const log = createLogger("worker");

startBackgroundCollection();
log.info("Worker rodando. Pressione Ctrl+C para sair.");

// Mantem o processo vivo.
setInterval(() => {}, 1 << 30);
