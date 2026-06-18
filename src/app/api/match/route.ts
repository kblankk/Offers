import { NextResponse } from "next/server";
import { fetchProduct } from "@/lib/product";
import { listCoupons } from "@/lib/store";
import { detectCategories } from "@/lib/parse";
import type { Coupon } from "@/lib/types";

// detectCategories ainda e usado dentro de fitFor (categorias do cupom).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type FitLevel = "yes" | "maybe" | "no";
export interface Fit {
  level: FitLevel;
  note: string;
}

/**
 * Avalia, de forma RIGIDA, se um cupom serve para o produto:
 *  - valor minimo vs preco (quando conhecido);
 *  - categoria: um cupom de categoria especifica (Moda, Casa, etc.) so serve
 *    se a categoria do produto bater. Se nao bater => "no" (excluido).
 */
function fitFor(coupon: Coupon, productCats: string[], price?: number): Fit {
  const reasons: string[] = [];
  let level: FitLevel = "yes";

  // 1. valor minimo
  if (typeof coupon.minPurchase === "number") {
    if (price !== undefined && price < coupon.minPurchase) {
      return { level: "no", note: `produto R$${Math.round(price)} abaixo do mínimo R$${coupon.minPurchase}` };
    }
    if (price === undefined) {
      level = "maybe";
      reasons.push(`confira o mínimo de R$${coupon.minPurchase}`);
    } else {
      reasons.push(`atende o mínimo de R$${coupon.minPurchase}`);
    }
  }

  // 2. categoria/escopo
  const couponCats = detectCategories(`${coupon.scope ?? ""} ${coupon.title} ${coupon.description ?? ""}`);

  if (coupon.scopeGeneral) {
    reasons.push("vale no site todo");
  } else if (couponCats.length > 0) {
    // cupom de categoria especifica: precisa casar com o produto
    if (productCats.length > 0) {
      const overlap = couponCats.some((c) => productCats.includes(c));
      if (!overlap) {
        return { level: "no", note: `cupom é de outra categoria (${couponCats.join(", ")})` };
      }
      reasons.push(`categoria compatível (${couponCats.filter((c) => productCats.includes(c)).join(", ")})`);
    } else {
      // nao sabemos a categoria do produto
      if (level === "yes") level = "maybe";
      reasons.push(`vale só em ${couponCats.join(", ")} — confira se seu produto é dessa categoria`);
    }
  } else {
    // sem categoria e sem confirmacao de site-todo: incerto
    if (level === "yes") level = "maybe";
    reasons.push("pode ter restrições — confira no checkout");
  }

  return { level, note: reasons.join(" · ") };
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
  const productCats = product.categories;

  const coupons = listCoupons({ store: product.store, status: "active" })
    .map((c) => ({ ...c, fit: fitFor(c, productCats, product.price) }))
    // RIGIDO: nao mostramos o que claramente nao serve.
    .filter((c) => c.fit.level !== "no")
    .sort((a, b) => {
      if (RANK[a.fit.level] !== RANK[b.fit.level]) return RANK[a.fit.level] - RANK[b.fit.level];
      const ca = CONF[a.confidence] ?? 9;
      const cb = CONF[b.confidence] ?? 9;
      if (ca !== cb) return ca - cb;
      return (b.usesToday ?? 0) - (a.usesToday ?? 0);
    });

  return NextResponse.json({ product: { ...product, categories: productCats }, coupons });
}
