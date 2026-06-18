import { NextResponse } from "next/server";
import { fetchProduct } from "@/lib/product";
import { listCoupons } from "@/lib/store";
import { detectCategories, categoryHintsFromCode, normalizeText } from "@/lib/parse";
import type { Coupon } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type FitLevel = "yes" | "maybe" | "no";
export interface Fit {
  level: FitLevel;
  /** Quanto maior, mais provavel que o cupom REALMENTE funcione neste produto. */
  score: number;
  note: string;
}

/**
 * Avalia se um cupom serve — e o quao confiavel ele e — para o produto.
 *
 * Filosofia: so mostramos o que tem chance real de funcionar e ordenamos pela
 * evidencia de que funciona. As decisoes:
 *  - EXCLUI ("no") o que claramente nao serve: preco abaixo do minimo conhecido,
 *    ou cupom restrito a uma categoria que nao e a do produto.
 *  - REBAIXA condicoes que costumam quebrar numa compra normal: "1a compra /
 *    novos clientes" e "so no app".
 *  - PONTUA pela melhor evidencia de que funciona: quantas pessoas usaram hoje
 *    (usesToday), confianca da fonte, categoria batendo e minimo atendido.
 */
function fitFor(coupon: Coupon, productCats: string[], price?: number): Fit {
  const reasons: string[] = [];
  const uses = coupon.usesToday ?? coupon.usesPeak ?? 0;

  // Texto completo do cupom (inclui o CODIGO: muitos codigos revelam a restricao,
  // ex.: "INTERNACIONAL15OFF", "PRIMEIRACOMPRA").
  const full = normalizeText(`${coupon.code ?? ""} ${coupon.scope ?? ""} ${coupon.title} ${coupon.description ?? ""}`);
  // Categoria do cupom: do texto (escopo/titulo/descricao) UNIDO com pistas do codigo.
  const couponCats = [
    ...new Set([
      ...detectCategories(`${coupon.scope ?? ""} ${coupon.title} ${coupon.description ?? ""}`),
      ...categoryHintsFromCode(coupon.code),
    ]),
  ];
  const firstBuy = /primeira compra|1[aª]\s*compra|novos? clientes|novos? usuarios|conta nova|cadastro novo/.test(full);
  const appOnly = /\bno app\b|pelo app|aplicativo|exclusivo no app/.test(full);

  // ---- Desqualificadores: nao serve ("no", escondido) ----
  // a) preco conhecido abaixo do minimo
  if (typeof coupon.minPurchase === "number" && price !== undefined && price < coupon.minPurchase) {
    return { level: "no", score: -100, note: `produto R$${Math.round(price)} abaixo do mínimo R$${coupon.minPurchase}` };
  }
  // b) cupom restrito a uma categoria que NAO e a do produto (so quando sabemos a do produto)
  const overlap = couponCats.filter((c) => productCats.includes(c));
  if (couponCats.length > 0 && productCats.length > 0 && overlap.length === 0) {
    return { level: "no", score: -100, note: `cupom é de outra categoria (${couponCats.join(", ")})` };
  }

  // ---- Pontuacao (evidencia de que funciona) ----
  let score = 0;
  let level: FitLevel = "yes";

  // Uso real hoje = melhor prova de que o cupom funciona de verdade.
  score += Math.min(uses, 5000) / 50; // ate +100
  if (coupon.confidence === "high") score += 15;
  else if (coupon.confidence === "medium") score += 5;

  // Relevancia de categoria/escopo.
  if (overlap.length > 0) {
    score += 40;
    reasons.push(`feito pra ${overlap.join(", ")}`);
  } else if (couponCats.length > 0 && productCats.length === 0) {
    // cupom restrito, mas nao sabemos a categoria do produto: incerto
    level = "maybe";
    score -= 12;
    reasons.push(`vale só em ${couponCats.join(", ")} — confirme que seu produto é dessa categoria`);
  } else if (coupon.scopeGeneral) {
    score += 20;
    reasons.push("vale no site todo");
  } else {
    // generico, sem restricao detectada
    score += 10;
  }

  // Valor minimo de compra.
  if (typeof coupon.minPurchase === "number") {
    if (price !== undefined) {
      score += 12; // preco conhecido E atende (ja passou o desqualificador)
      reasons.push(`atende o mínimo de R$${coupon.minPurchase}`);
    } else if (coupon.minPurchase <= 50) {
      // preco desconhecido, mas minimo baixo: praticamente toda compra atinge
      score += 4;
      reasons.push(`mínimo baixo (R$${coupon.minPurchase})`);
    } else {
      score -= 4;
      if (level === "yes") level = "maybe";
      reasons.push(`confira o mínimo de R$${coupon.minPurchase}`);
    }
  }

  // Condicoes que costumam fazer o cupom NAO funcionar numa compra comum.
  if (firstBuy) {
    score -= 60;
    level = "maybe";
    reasons.push("só p/ 1ª compra / novos clientes");
  }
  if (appOnly) {
    score -= 8;
    reasons.push("use pelo app");
  }
  if (coupon.exclusive) {
    reasons.push("ative pelo link (cupom exclusivo)");
  }

  // Cupom generico, sem categoria batendo e com pouca prova de uso: incerto.
  if (level === "yes" && overlap.length === 0 && !coupon.scopeGeneral && uses < 50) {
    level = "maybe";
    reasons.push("pode ter restrições — confira no checkout");
  }

  return { level, score, note: reasons.join(" · ") };
}

const RANK: Record<FitLevel, number> = { yes: 0, maybe: 1, no: 2 };

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
      // 1) os que REALMENTE funcionam ("yes") primeiro;
      if (RANK[a.fit.level] !== RANK[b.fit.level]) return RANK[a.fit.level] - RANK[b.fit.level];
      // 2) dentro do mesmo nivel, o de maior evidencia de funcionamento.
      return b.fit.score - a.fit.score;
    });

  return NextResponse.json({ product: { ...product, categories: productCats }, coupons });
}
