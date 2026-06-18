import { NextResponse } from "next/server";
import { fetchProduct } from "@/lib/product";
import { listCoupons } from "@/lib/store";
import type { Coupon } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type FitLevel = "yes" | "maybe" | "no";
export interface Fit {
  level: FitLevel;
  note: string;
}

/** Avalia se um cupom se encaixa no produto (preco vs minimo + escopo). */
function fitFor(c: Coupon, price?: number): Fit {
  const reasons: string[] = [];
  let level: FitLevel = "yes";

  if (typeof c.minPurchase === "number") {
    if (price === undefined) {
      level = "maybe";
      reasons.push(`exige mín. R$${c.minPurchase} (não consegui o preço do anúncio)`);
    } else if (price < c.minPurchase) {
      level = "no";
      reasons.push(`produto R$${Math.round(price)} é menor que o mínimo R$${c.minPurchase}`);
    } else {
      reasons.push(`atende o mínimo de R$${c.minPurchase}`);
    }
  }

  if (level !== "no") {
    if (c.scopeGeneral) {
      reasons.push("vale no site todo");
    } else if (/restri|checkout/i.test(c.scope ?? "")) {
      if (level === "yes") level = "maybe";
      reasons.push("pode ter restrições — confira no checkout");
    } else if (c.scope) {
      if (level === "yes") level = "maybe";
      reasons.push(`só vale em: ${c.scope}`);
    }
  }

  return { level, note: reasons.join(" · ") || "Sem condições conhecidas" };
}

const RANK: Record<FitLevel, number> = { yes: 0, maybe: 1, no: 2 };
const CONF: Record<string, number> = { high: 0, medium: 1, low: 2 };

export async function POST(req: Request) {
  let url: string | undefined;
  try {
    ({ url } = (await req.json()) as { url?: string });
  } catch {
    /* corpo invalido */
  }

  const result = await fetchProduct(url ?? "");
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const { product } = result;
  const active = listCoupons({ store: product.store, status: "active" });
  const coupons = active
    .map((c) => ({ ...c, fit: fitFor(c, product.price) }))
    .sort((a, b) => {
      if (RANK[a.fit.level] !== RANK[b.fit.level]) return RANK[a.fit.level] - RANK[b.fit.level];
      const ca = CONF[a.confidence] ?? 9;
      const cb = CONF[b.confidence] ?? 9;
      if (ca !== cb) return ca - cb;
      return (b.usesToday ?? 0) - (a.usesToday ?? 0);
    });

  return NextResponse.json({ product, coupons });
}
