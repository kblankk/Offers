import type { Coupon } from "./types";
import { createLogger } from "./logger";

const log = createLogger("persist");

/**
 * Persistencia duravel opcional via Supabase (Postgres gratuito).
 *
 * Guarda TODO o conjunto de cupons como um unico blob JSON na tabela `app_state`
 * (key='coupons'). Simples e suficiente para o nosso volume (centenas), e —
 * principalmente — sobrevive aos deploys do Render (disco efemero).
 *
 * Se as variaveis SUPABASE_URL/SUPABASE_KEY nao existirem, o app cai no
 * armazenamento em arquivo local (ver store.ts) — funciona sem configurar nada.
 *
 * SQL para criar a tabela (rode no SQL Editor do Supabase):
 *   create table if not exists app_state (
 *     key text primary key,
 *     data jsonb not null,
 *     updated_at timestamptz default now()
 *   );
 */
const URL = process.env.SUPABASE_URL?.replace(/\/$/, "");
const KEY = process.env.SUPABASE_KEY;
const ROW_KEY = process.env.SUPABASE_ROW_KEY || "coupons";

export const usingSupabase = !!(URL && KEY);

function headers(extra?: Record<string, string>): Record<string, string> {
  return {
    apikey: KEY!,
    Authorization: `Bearer ${KEY}`,
    ...extra,
  };
}

/** Carrega o conjunto de cupons do Supabase (ou null se nao configurado/erro). */
export async function supaLoad(): Promise<Coupon[] | null> {
  if (!usingSupabase) return null;
  try {
    const res = await fetch(`${URL}/rest/v1/app_state?key=eq.${ROW_KEY}&select=data`, {
      headers: headers(),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      log.warn(`Supabase load HTTP ${res.status} — usando vazio.`);
      return [];
    }
    const rows = (await res.json()) as { data?: Coupon[] }[];
    return rows[0]?.data ?? [];
  } catch (err) {
    log.warn(`Supabase load falhou (${(err as Error).message}).`);
    return [];
  }
}

/** Salva (upsert) todo o conjunto de cupons no Supabase. */
export async function supaSave(coupons: Coupon[]): Promise<void> {
  if (!usingSupabase) return;
  try {
    const res = await fetch(`${URL}/rest/v1/app_state`, {
      method: "POST",
      headers: headers({
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      }),
      body: JSON.stringify([{ key: ROW_KEY, data: coupons }]),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) log.warn(`Supabase save HTTP ${res.status}.`);
  } catch (err) {
    log.warn(`Supabase save falhou (${(err as Error).message}).`);
  }
}
