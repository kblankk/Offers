import { NextResponse } from "next/server";
import { collectAll } from "@/lib/collector";
import { closeBrowser } from "@/lib/browser";
import { isStale } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

let running = false;

/**
 * Dispara uma coleta. Sem parametros = coleta sempre (botao "Atualizar agora").
 * Com ?ifStale=1 = so coleta se os dados estiverem velhos (usado pela auto-coleta).
 */
export async function POST(req: Request) {
  const intervalMin = Number(process.env.COLLECT_INTERVAL_MIN) || 10;
  const ifStale = new URL(req.url).searchParams.get("ifStale") === "1";
  if (ifStale && !isStale(intervalMin * 0.8 * 60_000)) {
    return NextResponse.json({ ok: true, skipped: true });
  }
  if (running) {
    return NextResponse.json({ error: "Ja existe uma coleta em andamento." }, { status: 409 });
  }
  running = true;
  try {
    const summary = await collectAll();
    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  } finally {
    running = false;
    // Libera o Chromium apos a coleta sob demanda para nao reter memoria no dev server.
    await closeBrowser().catch(() => {});
  }
}
