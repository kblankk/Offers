import * as cheerio from "cheerio";
import { detectCategories } from "./parse";
import type { Store } from "./types";

/**
 * Dado o link de um anuncio, detecta a loja e tenta extrair titulo/preco/imagem
 * (best-effort, via fetch + cheerio). Se a loja bloquear o fetch (Amazon/Shopee
 * costumam), degrada para "so a loja" — o casamento de cupons ainda funciona.
 */
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export function detectStoreFromUrl(url: string): Store | undefined {
  const u = url.toLowerCase();
  if (/shopee\.com|s\.shopee|shp\.ee/.test(u)) return "shopee";
  if (/amazon\.|amzn\./.test(u)) return "amazon";
  if (/mercadolivre|mercadolibre|\/sec\/|\bmeli\b/.test(u)) return "mercadolivre";
  return undefined;
}

export interface ProductInfo {
  store: Store;
  url: string;
  title?: string;
  price?: number;
  image?: string;
  /** Categorias detectadas (a partir do titulo E do slug da URL). */
  categories: string[];
}

function clean(s?: string): string | undefined {
  const t = s?.replace(/\s+/g, " ").trim();
  return t || undefined;
}

/**
 * Extrai um titulo aproximado do produto a partir do slug da URL (ex.:
 * ".../teclado-mecanico-gamer-rgb/p/MLB123" -> "teclado mecanico gamer rgb").
 * Util quando a loja bloqueia o fetch (anti-bot) e nao temos og:title.
 */
function titleFromUrl(url: string): string | undefined {
  try {
    const { pathname } = new URL(url);
    const seg = pathname
      .split("/")
      .filter(Boolean)
      .filter((s) => !/^MLB/i.test(s) && s !== "p" && /[a-z]/i.test(s) && s.includes("-"));
    const best = seg.sort((a, b) => b.length - a.length)[0];
    if (!best) return undefined;
    return clean(decodeURIComponent(best).replace(/-/g, " ").replace(/[^a-zA-ZÀ-ÿ0-9 ]/g, " "));
  } catch {
    return undefined;
  }
}

/** Procura um preco em qualquer lugar de um objeto JSON-LD. */
function findPrice(node: unknown): number | undefined {
  if (!node || typeof node !== "object") return undefined;
  const obj = node as Record<string, unknown>;
  for (const key of ["price", "lowPrice", "highPrice"]) {
    const v = obj[key];
    if (typeof v === "number" && v > 0) return v;
    if (typeof v === "string") {
      const n = Number(v.replace(/[^\d.,]/g, "").replace(",", "."));
      if (n > 0) return n;
    }
  }
  for (const v of Object.values(obj)) {
    const found = findPrice(v);
    if (found) return found;
  }
  return undefined;
}

export type FetchProductResult =
  | { ok: true; product: ProductInfo }
  | { ok: false; error: string };

export async function fetchProduct(rawUrl: string): Promise<FetchProductResult> {
  const url = (rawUrl || "").trim();
  if (!/^https?:\/\//i.test(url)) {
    return { ok: false, error: "Cole um link completo do anúncio (começando com http)." };
  }
  const store = detectStoreFromUrl(url);
  if (!store) {
    return { ok: false, error: "Não reconheci a loja. Use um link do Mercado Livre, Amazon ou Shopee." };
  }

  const info: ProductInfo = { store, url, categories: [] };
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "pt-BR,pt;q=0.9", "Accept-Encoding": "identity" },
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
    });
    if (res.ok) {
      const $ = cheerio.load(await res.text());
      info.title =
        clean($('meta[property="og:title"]').attr("content")) ??
        clean($('meta[name="twitter:title"]').attr("content")) ??
        clean($("h1").first().text()) ??
        clean($("title").first().text());
      info.image = $('meta[property="og:image"]').attr("content") || undefined;

      $('script[type="application/ld+json"]').each((_i, s) => {
        if (info.price !== undefined) return;
        try {
          const p = findPrice(JSON.parse($(s).text()));
          if (p) info.price = p;
        } catch {
          /* ignora json invalido */
        }
      });
      if (info.price === undefined) {
        const meta = $('meta[itemprop="price"]').attr("content") || $('[itemprop="price"]').attr("content");
        if (meta) {
          const n = Number(String(meta).replace(/[^\d.,]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));
          if (n > 0) info.price = n;
        }
      }
    }
  } catch {
    /* fetch bloqueado/timeout: seguimos so com a loja */
  }
  // Slug da URL (sempre considerado p/ categoria; ML costuma ter o nome no slug).
  const slug = titleFromUrl(url);
  if (!info.title) info.title = slug;
  // Categoria a partir do titulo E do slug (mais robusto que so um deles).
  info.categories = detectCategories(`${info.title ?? ""} ${slug ?? ""}`);
  return { ok: true, product: info };
}
