import { NextResponse } from "next/server";
import { collectAll } from "@/lib/collector";
import { closeBrowser } from "@/lib/browser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

let running = false;

/** Dispara uma coleta sob demanda (botao "Atualizar agora" na UI). */
export async function POST() {
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
