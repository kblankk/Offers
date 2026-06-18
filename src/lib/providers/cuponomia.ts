import * as cheerio from "cheerio";
import type { RawCoupon, Store } from "../types";
import { parseMinPurchase, parseScope } from "../parse";
import type { ProviderContext } from "./provider";

/**
 * Raspador do Cuponomia (agregador de CUPONS reais — codigo + %).
 *
 * A pagina e renderizada no servidor, entao usamos `fetch` + cheerio (parser
 * HTML leve) — SEM navegador. Isso evita o consumo de memoria do Chromium
 * (que estoura o plano gratuito de 512MB) e e bem mais rapido.
 *
 * Estrutura de um card:
 *   li.item[data-id][data-type][data-image-small][data-is-store-wide]
 *     .js-couponSmallText  -> "10% OFF"
 *     .item-title h3       -> titulo
 *     .item-desc           -> condicoes
 *     .js-itemCode         -> codigo (quando ha)
 *     .couponStatus-item   -> "Verificado hoje", "2935 usados hoje"
 */
const BASE = "https://www.cuponomia.com.br";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const isPlaceholder = (code: string) => /ative|no link|ver cupom|clique|resgat/i.test(code);

export async function collectFromCuponomia(
  store: Store,
  slug: string,
  ctx: ProviderContext,
): Promise<RawCoupon[]> {
  const url = `${BASE}/desconto/${slug}`;
  ctx.log.info(`Coletando cupons de ${store} (${slug})...`);

  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8" },
  });
  if (!res.ok) {
    ctx.log.warn(`${store}: HTTP ${res.status} no Cuponomia.`);
    return [];
  }
  const $ = cheerio.load(await res.text());

  const parseUses = (texts: string[]): number | undefined => {
    const item = texts.find((s) => /usad/i.test(s));
    if (!item) return undefined;
    const digits = item.replace(/\D/g, "");
    return digits ? Number(digits) : undefined;
  };
  const parseVerified = (texts: string[]): string | undefined => texts.find((s) => /verificad/i.test(s));

  const seen = new Set<string>();
  const coupons: RawCoupon[] = [];

  $("li.item[data-id]").each((_, el) => {
    const $el = $(el);
    const id = $el.attr("data-id") ?? "";
    if (!id) return;

    const type = $el.attr("data-type") ?? "";
    const image = $el.attr("data-image-small") ?? "";
    const storeWide = $el.attr("data-is-store-wide") === "true";
    let code = $el.find(".js-itemCode").first().text().trim();
    if (isPlaceholder(code)) code = "";
    const discount = $el.find(".js-couponSmallText").first().text().trim();
    const title = $el.find(".item-title h3, .js-itemTitle").first().text().trim();
    const desc = $el.find(".item-desc").first().text().trim();
    const status = $el
      .find(".couponStatus-item")
      .map((_i, s) => $(s).text().trim())
      .get();
    const exclusive = /\bexclusiv/i.test($el.text());

    // Mantemos so o que tem desconto claro (% ou OFF) ou um codigo.
    if (!code && !/%|off|cashback|gr[aá]tis/i.test(`${discount} ${title}`)) return;

    // Deduplica por codigo (ou id, p/ ofertas sem codigo).
    const key = code ? `code:${code.toUpperCase()}` : `id:${id}`;
    if (seen.has(key)) return;
    seen.add(key);

    const { scope, general } = parseScope(`${title} ${desc}`, storeWide);
    coupons.push({
      store,
      kind: code ? "code" : "offer",
      code: code || null,
      title: title || `${discount} em ${slug}`,
      description: desc || undefined,
      url: `${BASE}/desconto/${slug}?c=${id}`,
      discountText: discount || undefined,
      imageUrl: image || undefined,
      verifiedText: parseVerified(status),
      usesToday: parseUses(status),
      exclusive,
      minPurchase: parseMinPurchase(`${desc} ${title}`),
      scope,
      scopeGeneral: general,
      expiresAt: null,
    });
  });

  ctx.log.info(`${store}: ${coupons.length} cupons.`);
  return coupons;
}
