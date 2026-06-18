import type { RawCoupon, Store } from "../types";
import { withPage } from "../browser";
import { parseMinPurchase, parseScope } from "../parse";
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
        minPurchase: parseMinPurchase(`${r.desc} ${r.title}`),
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
