import { NextResponse } from "next/server";
import { recordFeedback } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Relato da comunidade sobre um cupom: { id, ok }.
 * ok=true  -> funcionou; ok=false -> nao funcionou / esgotado.
 * Quando os relatos negativos passam do limiar (no dia), o cupom some da lista.
 */
export async function POST(req: Request) {
  let id = "";
  let ok = false;
  try {
    const body = (await req.json()) as { id?: string; ok?: boolean };
    id = String(body.id ?? "");
    ok = body.ok === true;
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }
  if (!id) return NextResponse.json({ error: "id ausente." }, { status: 400 });

  const result = recordFeedback(id, ok);
  if (!result) return NextResponse.json({ error: "Cupom não encontrado." }, { status: 404 });
  return NextResponse.json({ ok: true, ...result });
}
