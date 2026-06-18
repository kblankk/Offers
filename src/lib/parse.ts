/**
 * Utilitarios de extracao compartilhados entre as fontes (Cuponomia, Telegram).
 * Centralizar aqui garante a MESMA precisao em todas as fontes.
 */

export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp(`[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`, "g"), "");
}

/** Valor minimo de compra ("a partir de R$149", "acima de R$69", "compras de R$50"). */
export function parseMinPurchase(text: string): number | undefined {
  const m = text.match(
    /(?:a partir de|acima de|compras? (?:de|acima de)|m[ií]nimo de|min\.?)\s*R\$\s*([\d.]+)/i,
  );
  if (!m) return undefined;
  const n = Number(m[1]!.replace(/\./g, ""));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Desconto legivel a partir do texto (%, R$ OFF ou preco). */
export function parseDiscountText(text: string): string | undefined {
  const pct = text.match(/(\d{1,3})\s*%\s*(?:de\s*)?(?:off|desconto)?/i);
  if (pct) return `${pct[1]}% OFF`;
  const off = text.match(/R\$\s*([\d.]+)\s*(?:de\s*)?off/i);
  if (off) return `R$ ${off[1]} OFF`;
  const price = text.match(/por\s*:?\s*R?\$?\s*([\d.]+)\s*(?:reais|R\$)?/i);
  if (price) return `Por R$ ${price[1]}`;
  return undefined;
}

// Categorias reconhecidas no titulo/descricao.
// OBS: nao usar "mercado" sozinho (casaria com a loja "Mercado Livre").
export const CATEGORIES: { label: string; re: RegExp }[] = [
  { label: "Produtos internacionais", re: /internaciona|importad/ },
  { label: "Moda", re: /\bmoda\b|vestuario|roupa|calcado|tenis|sapato|fashion|camiseta/ },
  { label: "Beleza", re: /beleza|perfum|cosmetic|maquiagem|skincare|cabelo/ },
  {
    label: "Eletrônicos",
    re: /eletronic|celular|smartphone|informatica|notebook|\btv\b|tecnolog|console|games?\b|gamer|monitor|\bfone\b|headset|teclado|\bmouse\b|computador|\bpc\b|placa de video|ssd|processador|\bcabo\b|carregador|caixa de som|webcam/,
  },
  { label: "Casa", re: /\bcasa\b|movei|decora|eletrodomestic|cozinha|colchao|sofa|aspirador|extratora|limpeza/ },
  { label: "Supermercado", re: /supermercado|hortifruti|mercearia|alimento|bebida|grocer/ },
  { label: "Pet", re: /\bpet\b|petshop/ },
  { label: "Bebês/Infantil", re: /bebe|infantil|crianca|brinquedo/ },
  { label: "Esporte", re: /esporte|fitness|academia|bicicleta|pedal/ },
  { label: "Farmácia/Saúde", re: /farmacia|medicament|suplemento|creatina/ },
  { label: "Livros", re: /\blivro|\bbook/ },
];

const STORE_WORDS = /mercado livre|mercadolivre|mercadolibre|amazon|shopee/g;

/**
 * Determina onde o cupom vale, de forma legivel e honesta.
 * Sem categoria e sem confirmacao de site-todo => avisa possiveis restricoes
 * (a fonte costuma omitir limites que existem na loja).
 */
export function parseScope(text: string, storeWide: boolean): { scope: string; general: boolean } {
  const t = normalizeText(text).replace(STORE_WORDS, " ");
  const cats = CATEGORIES.filter((c) => c.re.test(t)).map((c) => c.label);
  const selected = /selecionad/.test(t);
  const firstBuy = /primeira compra|1a compra|novos clientes|novos usuarios/.test(t);
  const inApp = /\bno app\b|pelo app|aplicativo/.test(t);
  const freeShip = /frete gratis/.test(t);

  const parts: string[] = [];
  if (cats.length) parts.push(...cats);
  else if (storeWide) parts.push("Site todo");
  else if (selected) parts.push("Itens selecionados");
  else parts.push("Pode ter restrições — ver no checkout");

  if (selected && cats.length) parts.push("selecionados");
  if (firstBuy) parts.push("1ª compra");
  if (inApp) parts.push("no app");
  if (freeShip) parts.push("frete grátis");

  const general = storeWide && cats.length === 0 && !selected && !firstBuy;
  return { scope: parts.join(" · "), general };
}

/** Categorias detectadas num texto (titulo de produto, descricao de cupom, etc.). */
export function detectCategories(text: string): string[] {
  const t = normalizeText(text).replace(STORE_WORDS, " ");
  return CATEGORIES.filter((c) => c.re.test(t)).map((c) => c.label);
}
