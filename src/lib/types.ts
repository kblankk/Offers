import { withAffiliate } from "./affiliate";

/** Lojas suportadas. */
export type Store = "mercadolivre" | "amazon" | "shopee";

/**
 * Status de um cupom.
 * - active:   confirmado presente na fonte nesta coleta.
 * - expired:  saiu da lista da fonte (provavelmente acabou) ou passou da validade.
 * - suspected_exhausted: ainda listado, mas com sinais de esgotamento. Suspeita, nao garantia.
 * - unknown:  nao foi possivel verificar.
 */
export type CouponStatus = "active" | "expired" | "suspected_exhausted" | "unknown";

/** Nivel de confianca da verificacao. */
export type Confidence = "high" | "medium" | "low";

/** Tipo do cupom: codigo (digita no checkout) ou oferta (desconto direto no link). */
export type CouponKind = "code" | "offer";

/** Cupom recem-coletado de uma fonte, antes de persistir. */
export interface RawCoupon {
  store: Store;
  kind: CouponKind;
  /** Codigo do cupom (ex.: "APROVEITAJA") ou null se for oferta sem codigo. */
  code: string | null;
  title: string;
  description?: string;
  /** URL para usar/ver o cupom. */
  url: string;
  /** Desconto exibido (ex.: "10% OFF", "R$ 30"). */
  discountText?: string;
  /** Logo da loja / imagem do cupom. */
  imageUrl?: string;
  /** Texto de verificacao da fonte (ex.: "Verificado hoje", "Verificado ontem"). */
  verifiedText?: string;
  /** Quantas pessoas usaram hoje (sinal de que funciona). */
  usesToday?: number;
  /** Cupom exclusivo do agregador (so funciona ativando pelo link, nao digitando o codigo). */
  exclusive?: boolean;
  /** Valor minimo de compra para o cupom valer (R$), quando detectado. */
  minPurchase?: number;
  /** Teto do desconto em R$ ("limitado a R$X"), quando detectado. */
  maxDiscount?: number;
  /** Onde o cupom vale (ex.: "Site todo", "Moda", "Produtos internacionais · 1ª compra"). */
  scope?: string;
  /** true se vale no site inteiro (geral); false se restrito a categoria/itens. */
  scopeGeneral?: boolean;
  /** De onde o cupom veio (ex.: "cuponomia", "telegram:economizandocomjp"). */
  source?: string;
  /** Quando foi POSTADO na fonte (Telegram) — ISO. Tempo real, nao reseta no deploy. */
  postedAt?: string | null;
  /** Data de expiracao, se conhecida (ISO 8601). */
  expiresAt?: string | null;
}

/** Cupom como persistido no banco. */
export interface Coupon extends RawCoupon {
  /** Hash estavel derivado de store+code+url. */
  id: string;
  status: CouponStatus;
  confidence: Confidence;
  firstSeenAt: string;
  lastSeenAt: string;
  lastCheckedAt: string;
  statusReason: string;
  /** Maior nº de "usados hoje" observado no dia (para detectar queda = esgotando). */
  usesPeak?: number;
  /** Data (YYYY-MM-DD) a que `usesPeak`/`usesToday` se referem. */
  usesDate?: string;
  /** Relatos da comunidade no dia: confirmou que funcionou. */
  worked?: number;
  /** Relatos da comunidade no dia: nao funcionou / esgotado. */
  failed?: number;
  /** Data (YYYY-MM-DD) dos relatos worked/failed (resetam por dia). */
  votedDate?: string;
  /** Relatos ACUMULADOS (nunca resetam) — base da taxa de sucesso exibida. */
  workedAll?: number;
  failedAll?: number;
}

/** Resultado de uma verificacao individual. */
export interface VerificationResult {
  status: CouponStatus;
  confidence: Confidence;
  reason: string;
  expiresAt?: string | null;
}

export const STORE_META: Record<Store, { label: string; color: string }> = {
  mercadolivre: { label: "Mercado Livre", color: "#FFE600" },
  amazon: { label: "Amazon", color: "#146EB4" },
  shopee: { label: "Shopee", color: "#EE4D2D" },
};

/** Pagina oficial de cada loja (destino quando nao temos um link direto da loja). */
export const STORE_HOME: Record<Store, string> = {
  mercadolivre: "https://www.mercadolivre.com.br",
  amazon: "https://www.amazon.com.br",
  shopee: "https://shopee.com.br",
};

/**
 * Para onde o botao "Ir a loja" deve levar:
 * - se a URL do cupom ja for da loja (ex.: cupons do Telegram), usa ela;
 * - senao (link do agregador, etc.), manda para a pagina oficial da loja.
 * Nunca leva para um site intermediario "nada a ver".
 */
export function storeUrl(coupon: Pick<Coupon, "url" | "store">): string {
  const u = coupon.url ?? "";
  const isStore = /mercadolivre|mercadolibre|amazon\.|amzn\.|shopee\.com|s\.shopee|shp\.ee/i.test(u);
  const dest = isStore ? u : STORE_HOME[coupon.store];
  return withAffiliate(dest, coupon.store);
}
