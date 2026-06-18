import type { RawCoupon, Store } from "../types";
import { normalizeText, parseDiscountText, parseMinPurchase, parseScope, PRODUCT_NOUNS } from "../parse";
import type { ProviderContext } from "./provider";

/**
 * Coletor de canais PUBLICOS do Telegram via a previa web `t.me/s/<canal>`.
 *
 * Nao precisa de login, API key nem bot — apenas HTTP. Canais de cupom postam
 * codigos em tempo quase real (muitas vezes ANTES dos agregadores), entao esta
 * e a fonte mais "fresca". Extraimos codigo + loja + titulo + link de cada post.
 *
 * Sem WhatsApp: grupos sao privados e libs nao-oficiais banem o numero. Os
 * mesmos cupons costumam aparecer nestes canais de Telegram.
 */

function unescapeHtml(s: string): string {
  return (
    s
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      // &amp; primeiro resolve casos duplo-codificados (ex.: &amp;#36; -> &#36;)
      .replace(/&amp;/g, "&")
      // entidades numericas (decimais e hex): &#36; -> $, &#x24; -> $
      .replace(/&#x([0-9a-fA-F]+);/g, (_m, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (_m, d) => String.fromCodePoint(Number(d)))
      .replace(/&quot;/g, '"')
      .replace(/&apos;|&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
  );
}

/** Detecta a loja pela URL ou pelo texto. */
function detectStore(text: string): Store | undefined {
  if (/shopee\.com|s\.shopee|shp\.ee/i.test(text)) return "shopee";
  if (/amazon\.com|amzn\.to|amzn\.com/i.test(text)) return "amazon";
  if (/mercadolivre|mercado\s?livre|\/sec\/|mercadolibre|\bmeli\b/i.test(text)) return "mercadolivre";
  if (/\bshopee\b/i.test(text)) return "shopee";
  if (/\bamazon\b/i.test(text)) return "amazon";
  return undefined;
}

/** Extrai o codigo do cupom do texto do post. */
function extractCode(text: string): string | null {
  // "CUPOM: X", "use o cupom X", "cupom: X", "codigo X", "voucher X"
  const m = text.match(/(?:cupom|c[oó]digo|voucher|cod\.?)\s*:?\s*([A-Z0-9][A-Z0-9._-]{3,24})/i);
  if (!m) return null;
  const raw = m[1]!.toUpperCase().replace(/[._-]+$/, "");
  // Evita capturar palavras comuns / nomes de loja / URLs como se fossem codigo.
  const BLOCK = new Set([
    "AQUI", "LINK", "HOJE", "AGORA", "GRATIS", "OFF", "AMAZON", "SHOPEE", "MERCADO",
    "LIVRE", "MELI", "DESCONTO", "DESCONTOS", "PROMO", "PROMOCAO", "OFERTA", "OFERTAS",
    "CUPOM", "CUPONS", "CODIGO", "VOUCHER", "FRETE", "REAIS", "COMPRE", "GANHE", "LOJA", "SITE",
    "HTTP", "HTTPS", "WWW", "COM", "PARA", "VALE", "ABAIXO", "PRECO", "PRECINHO",
  ]);
  if (BLOCK.has(raw)) return null;
  if (/^HTTP/.test(raw)) return null; // qualquer coisa de URL
  // Bom codigo: tem ao menos um digito OU >=5 chars maiusculos.
  if (!/[0-9]/.test(raw) && raw.length < 5) return null;
  return raw;
}

function extractUrl(text: string): string | null {
  const m = text.match(/https?:\/\/[^\s]+/i);
  return m ? m[0].replace(/[).,]+$/, "") : null;
}

function extractTitle(lines: string[]): string {
  for (const l of lines) {
    const t = l.trim();
    if (!t) continue;
    if (/^\(?an[uú]ncio\)?$/i.test(t)) continue;
    if (/^(cupom|c[oó]digo|link|por|use|adicione|salve)\b/i.test(t)) continue;
    if (/^https?:\/\//i.test(t)) continue;
    return t.slice(0, 120);
  }
  return "Cupom";
}

async function fetchChannel(channel: string, ctx: ProviderContext): Promise<RawCoupon[]> {
  const url = `https://t.me/s/${channel}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; CupomRadar/1)" } });
  if (!res.ok) {
    ctx.log.warn(`Telegram @${channel}: HTTP ${res.status}`);
    return [];
  }
  const html = await res.text();
  const blocks = [...html.matchAll(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/g)];

  const coupons: RawCoupon[] = [];
  for (const b of blocks) {
    const text = unescapeHtml(b[1]!).trim();
    const code = extractCode(text);
    if (!code) continue; // so posts com codigo de cupom
    const store = detectStore(text);
    if (!store) continue;

    // QUEREMOS SO CUPONS LIMPOS, nao deals de produto.
    // Deal de produto costuma trazer um PRECO ("POR R$ 61", "1349 reais",
    // "de R$X por R$Y"). Cupom de verdade traz um DESCONTO (% OFF ou R$ OFF).
    const discount = parseDiscountText(text);
    const hasRealDiscount = !!discount && /%|off/i.test(discount);
    const looksLikeProductPrice =
      /\bpor\b\s*:?\s*r?\$?\s*\d/i.test(text) ||
      /\d+\s*reais/i.test(text) ||
      /de\s*r\$\s*[\d.,]+\s*por/i.test(text);
    const looksLikeProduct = PRODUCT_NOUNS.test(normalizeText(text));
    if (!hasRealDiscount || looksLikeProductPrice || looksLikeProduct) continue;

    const lines = text.split("\n");
    const title = extractTitle(lines);
    const { scope, general } = parseScope(`${title} ${text}`, false);
    coupons.push({
      store,
      kind: "code",
      code,
      title,
      description: text.replace(/\n+/g, " ").slice(0, 180),
      url: extractUrl(text) ?? url,
      discountText: discount,
      minPurchase: parseMinPurchase(text),
      scope,
      scopeGeneral: general,
      source: `telegram:${channel}`,
      expiresAt: null,
    });
  }
  ctx.log.info(`Telegram @${channel}: ${coupons.length} cupons com codigo.`);
  return coupons;
}

export async function collectFromTelegram(
  channels: string[],
  ctx: ProviderContext,
): Promise<RawCoupon[]> {
  const all: RawCoupon[] = [];
  for (const ch of channels) {
    try {
      all.push(...(await fetchChannel(ch, ctx)));
    } catch (err) {
      ctx.log.warn(`Telegram @${ch} falhou: ${(err as Error).message}`);
    }
  }
  return all;
}
