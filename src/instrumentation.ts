/**
 * Hook de inicializacao do Next.js. Roda UMA vez quando o servidor sobe.
 *
 * Para nao arrastar nenhum modulo de servidor (Playwright, node:crypto, etc.)
 * para o bundle da instrumentacao, AQUI nao importamos nada de lib/ — apenas
 * agendamos chamadas HTTP a rota /api/collect, onde o Playwright roda de fato.
 * Assim o app se atualiza sozinho, sem processo extra.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const port = process.env.PORT || "3000";
  const base = `http://127.0.0.1:${port}`;
  const intervalMin = Number(process.env.COLLECT_INTERVAL_MIN) || 10;
  const intervalMs = intervalMin * 60_000;

  async function trigger(reason: string, ifStale: boolean) {
    try {
      const url = `${base}/api/collect${ifStale ? "?ifStale=1" : ""}`;
      const res = await fetch(url, { method: "POST" });
      if (res.status === 409) return;
      const body = (await res.json().catch(() => null)) as
        | { skipped?: boolean; summary?: { collected: number } }
        | null;
      if (body?.skipped) console.log(`[auto-update] (${reason}) dados recentes; pulado.`);
      else console.log(`[auto-update] (${reason}) ${body?.summary?.collected ?? "?"} cupons coletados.`);
    } catch (err) {
      console.warn(`[auto-update] falha (${reason}): ${(err as Error).message}`);
    }
  }

  // Coleta inicial pouco depois do servidor subir (so se os dados estiverem velhos).
  setTimeout(() => void trigger("boot", true), 8_000);

  const timer = setInterval(() => void trigger("intervalo", false), intervalMs);
  if (typeof timer.unref === "function") timer.unref();

  console.log(`[auto-update] agendado a cada ${intervalMin} min (via /api/collect).`);
}
