import type { Store } from "./types";

/**
 * Links de afiliado. Cada loja tem um parâmetro próprio, configurado por env
 * (formato "chave=valor"), porque cada programa é diferente:
 *  - Amazon Associados: basta acrescentar `tag=SEUID-20` em qualquer link.
 *  - Mercado Livre Afiliados / Shopee Affiliate: use o parâmetro que o programa
 *    te der (ex.: "matt_word=...", "af_siteid=..."). Se vazio, não muda nada.
 *
 * Defina no Render (Environment), sem aspas:
 *   NEXT_PUBLIC_AFF_AMAZON=tag=allcupom-20
 *   NEXT_PUBLIC_AFF_MERCADOLIVRE=...
 *   NEXT_PUBLIC_AFF_SHOPEE=...
 */
const AFF: Record<Store, string | undefined> = {
  amazon: process.env.NEXT_PUBLIC_AFF_AMAZON,
  mercadolivre: process.env.NEXT_PUBLIC_AFF_MERCADOLIVRE,
  shopee: process.env.NEXT_PUBLIC_AFF_SHOPEE,
};

const DOMAINS: Record<Store, RegExp> = {
  amazon: /amazon\.|amzn\./i,
  mercadolivre: /mercadolivre|mercadolibre/i,
  shopee: /shopee\.com|s\.shopee|shp\.ee/i,
};

/** True se há QUALQUER programa de afiliado configurado (controla a disclosure). */
export const hasAffiliate = Boolean(AFF.amazon || AFF.mercadolivre || AFF.shopee);

/**
 * Acrescenta o parâmetro de afiliado da loja, se configurado e a URL for mesmo
 * do domínio dela. Não duplica se o parâmetro já existir.
 */
export function withAffiliate(url: string, store: Store): string {
  const param = AFF[store];
  if (!param || !url || !DOMAINS[store].test(url)) return url;
  const key = param.split("=")[0];
  if (key && new RegExp(`[?&]${key}=`).test(url)) return url; // já tem
  return url + (url.includes("?") ? "&" : "?") + param;
}
