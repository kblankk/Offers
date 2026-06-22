/** URL canônica pública do site (sem barra no fim). Configure em produção com
 * NEXT_PUBLIC_SITE_URL (ex.: https://allcupom.com.br). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://offers-1gpo.onrender.com").replace(/\/+$/, "");

/** slug da URL <-> store interno */
export const STORE_SLUG = {
  mercadolivre: "mercado-livre",
  amazon: "amazon",
  shopee: "shopee",
} as const;
