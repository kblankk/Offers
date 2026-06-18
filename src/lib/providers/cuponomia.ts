import type { RawCoupon, Store } from "../types";
import { withPage } from "../browser";
import type { ProviderContext } from "./provider";

/**
 * Raspador compartilhado do Cuponomia (agregador de CUPONS reais — codigo + %).
 *
 * Estrutura de um card (descoberta por inspecao do HTML):
 *   li.item[data-id][data-type=code|offer][data-image-small]
 *     .js-couponSmallText  -> "10% OFF"          (o desconto)
 *     .item-title h3       -> titulo
 *     .item-desc           -> condicoes
 *     .js-itemCode         -> "APROVEITAJA"       (o codigo, quando data-type=code)
 */
const BASE = "https://www.cuponomia.com.br";

export async function collectFromCuponomia(
  store: Store,
  slug: string,
  ctx: ProviderContext,
): Promise<RawCoupon[]> {
  const url = `${BASE}/desconto/${slug}`;
  return withPage(async (page) => {
    ctx.log.info(`Coletando cupons de ${store} (${slug})...`);
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("li.item[data-id]", { timeout: 20_000 }).catch(() => {
      ctx.log.warn(`${store}: nenhum cupom encontrado (layout pode ter mudado).`);
    });

    // Rola a pagina para disparar o lazy-load e captar TODOS os cupons (nao so
    // os ~45 do primeiro render). Para quando a contagem de cards estabiliza.
    let prevCount = 0;
    for (let i = 0; i < 12; i++) {
      const count = await page.locator("li.item[data-id]").count();
      if (count === prevCount && i > 1) break;
      prevCount = count;
      // tenta clicar em "ver mais", se existir
      const more = page.getByText(/ver mais|carregar mais|mostrar mais/i).first();
      if (await more.isVisible().catch(() => false)) {
        await more.click().catch(() => {});
      } else {
        await page.mouse.wheel(0, 6000).catch(() => {});
      }
      await page.waitForTimeout(700);
    }
    ctx.log.info(`${store}: ${prevCount} cards apos scroll.`);

    const raw = await page.$$eval("li.item[data-id]", (items) => {
      const out: {
        id: string;
        type: string;
        code: string;
        discount: string;
        title: string;
        desc: string;
        image: string;
        status: string[];
        exclusive: boolean;
        storeWide: boolean;
      }[] = [];
      for (const el of items) {
        const id = el.getAttribute("data-id") ?? "";
        const type = el.getAttribute("data-type") ?? "";
        const image = el.getAttribute("data-image-small") ?? "";
        const code = (el.querySelector(".js-itemCode")?.textContent ?? "").trim();
        const discount = (el.querySelector(".js-couponSmallText")?.textContent ?? "").trim();
        const title = (el.querySelector(".item-title h3, .js-itemTitle")?.textContent ?? "").trim();
        const desc = (el.querySelector(".item-desc")?.textContent ?? "").trim();
        const status = Array.from(el.querySelectorAll(".couponStatus-item")).map(
          (s) => (s.textContent ?? "").trim(),
        );
        const exclusive = /\bexclusiv/i.test((el as HTMLElement).innerText || "");
        const storeWide = el.getAttribute("data-is-store-wide") === "true";
        if (id && (title || discount))
          out.push({ id, type, code, discount, title, desc, image, status, exclusive, storeWide });
      }
      return out;
    });

    const parseUses = (status: string[]): number | undefined => {
      const item = status.find((s) => /usad/i.test(s));
      if (!item) return undefined;
      const digits = item.replace(/\D/g, "");
      return digits ? Number(digits) : undefined;
    };
    const parseVerified = (status: string[]): string | undefined =>
      status.find((s) => /verificad/i.test(s));

    // Valor minimo de compra ("a partir de R$149", "acima de R$69", "compras de R$50").
    const parseMin = (text: string): number | undefined => {
      const m = text.match(/(?:a partir de|acima de|compras de|m[ií]nimo de|min\.?)\s*R\$\s*([\d.]+)/i);
      if (!m) return undefined;
      const n = Number(m[1]!.replace(/\./g, ""));
      return Number.isFinite(n) && n > 0 ? n : undefined;
    };

    const norm = (s: string) =>
      s.toLowerCase().normalize("NFD").replace(new RegExp(`[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`, "g"), "");

    // Categorias reconhecidas a partir do titulo/descricao.
    // OBS: nao usar "mercado" sozinho (casaria com a loja "Mercado Livre").
    const CATEGORIES: { label: string; re: RegExp }[] = [
      { label: "Produtos internacionais", re: /internaciona|importad/ },
      { label: "Moda", re: /\bmoda\b|vestuario|roupa|calcado|tenis|sapato|fashion/ },
      { label: "Beleza", re: /beleza|perfum|cosmetic|maquiagem|skincare/ },
      { label: "Eletrônicos", re: /eletronic|celular|smartphone|informatica|notebook|\btv\b|tecnolog|console|games?\b/ },
      { label: "Casa", re: /\bcasa\b|movei|decora|eletrodomestic|cozinha/ },
      { label: "Supermercado", re: /supermercado|hortifruti|mercearia|alimento|bebida|grocer/ },
      { label: "Pet", re: /\bpet\b|petshop/ },
      { label: "Bebês/Infantil", re: /bebe|infantil|crianca|brinquedo/ },
      { label: "Esporte", re: /esporte|fitness|academia/ },
      { label: "Farmácia/Saúde", re: /farmacia|medicament/ },
      { label: "Livros", re: /\blivro|\bbook/ },
    ];

    // Determina onde o cupom vale, de forma legivel.
    const parseScope = (
      text: string,
      storeWide: boolean,
    ): { scope: string; general: boolean } => {
      // Remove o nome da loja para nao confundir com categoria.
      const t = norm(text).replace(/mercado livre|mercadolivre|amazon|shopee/g, " ");
      const cats = CATEGORIES.filter((c) => c.re.test(t)).map((c) => c.label);
      const selected = /selecionad/.test(t);
      const firstBuy = /primeira compra|1a compra|novos clientes|novos usuarios/.test(t);
      const inApp = /\bno app\b|pelo app|aplicativo/.test(t);
      const freeShip = /frete gratis/.test(t);

      const parts: string[] = [];
      if (cats.length) parts.push(...cats);
      else if (storeWide) parts.push("Site todo");
      else if (selected) parts.push("Itens selecionados");
      else parts.push("Geral");

      if (selected && cats.length) parts.push("selecionados");
      if (firstBuy) parts.push("1ª compra");
      if (inApp) parts.push("no app");
      if (freeShip) parts.push("frete grátis");

      const general = cats.length === 0 && !selected && !firstBuy && (storeWide || parts[0] === "Geral");
      return { scope: parts.join(" · "), general };
    };

    // Alguns "codigos" sao na verdade placeholders ("Ative o cupom no link"),
    // i.e. nao ha codigo digitavel — o desconto e ativado pelo link (exclusivo).
    const isPlaceholder = (code: string) => /ative|no link|ver cupom|clique|resgat/i.test(code);

    const seen = new Set<string>();
    const coupons: RawCoupon[] = raw
      .map((r) => ({ ...r, code: isPlaceholder(r.code) ? "" : r.code }))
      .filter((r) => r.code || /%|off|cashback|gr[aá]tis/i.test(`${r.discount} ${r.title}`))
      // Deduplica: mesmo codigo (ou mesmo id, p/ ofertas sem codigo) aparece uma vez so.
      .filter((r) => {
        const key = r.code ? `code:${r.code.toUpperCase()}` : `id:${r.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((r) => ({
        store,
        kind: (r.type === "code" && r.code) || r.code ? "code" : "offer",
        code: r.code || null,
        title: r.title || `${r.discount} em ${slug}`,
        description: r.desc || undefined,
        url: `${BASE}/desconto/${slug}?c=${r.id}`,
        discountText: r.discount || undefined,
        imageUrl: r.image || undefined,
        verifiedText: parseVerified(r.status),
        usesToday: parseUses(r.status),
        exclusive: r.exclusive,
        minPurchase: parseMin(`${r.desc} ${r.title}`),
        ...(() => {
          const s = parseScope(`${r.title} ${r.desc}`, r.storeWide);
          return { scope: s.scope, scopeGeneral: s.general };
        })(),
        expiresAt: null,
      }));

    ctx.log.info(`${store}: ${coupons.length} cupons unicos (${raw.length} cards brutos).`);
    return coupons;
  });
}
