"use client";

import { useState } from "react";
import { Copy, Check, ArrowUpRight } from "lucide-react";
import { StoreLogo } from "./StoreLogo";
import { STORE_META, storeUrl, type Coupon } from "@/lib/types";

/** Codigo de barras "fake" mas deterministico (larguras vindas do codigo). */
function Barcode({ value }: { value: string }) {
  const seed = (value || "CUPOM").toUpperCase().repeat(4).slice(0, 44);
  const bars: React.ReactNode[] = [];
  for (let i = 0; i < seed.length; i++) {
    const code = seed.charCodeAt(i);
    bars.push(<span key={`b${i}`} className="bg-[#1b1a17]" style={{ width: (code % 3) + 1 }} />);
    bars.push(<span key={`g${i}`} style={{ width: (code % 2) + 1 }} />);
  }
  return <div className="flex h-9 items-stretch overflow-hidden" aria-hidden="true">{bars}</div>;
}

/**
 * Cupom em destaque como um VALE-DESCONTO de papel real:
 * papel creme (destaca no claro e no preto), borda serrilhada, carimbo de
 * validade rotacionado, picote e codigo de barras gerado do codigo.
 */
export function FeaturedCoupon({ coupon }: { coupon: Coupon }) {
  const [copied, setCopied] = useState(false);
  const meta = STORE_META[coupon.store];
  const stamp = coupon.verifiedText || (coupon.usesToday ? `${coupon.usesToday.toLocaleString("pt-BR")} usaram hoje` : "Válido hoje");
  // Tira emojis/pictogramas do titulo — destoam do visual de papel.
  const title = (coupon.title ?? "").replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}]/gu, "").replace(/\s+/g, " ").trim();

  async function copy() {
    if (!coupon.code) return;
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  // recortes do picote = cor do fundo da pagina (parecem furos no papel)
  const hole = "bg-[#e8e2d4] dark:bg-black";

  return (
    <div className="ticket-serrated relative flex flex-col bg-[#f7f3ea] text-[#1b1a17] sm:flex-row">
      {/* OFERTA (esquerda) */}
      <div className="relative flex-1 px-7 py-9 sm:px-10">
        {/* carimbo de validade */}
        <div className="pointer-events-none absolute right-5 top-7 hidden rotate-[-9deg] select-none rounded-md border-2 border-[#b23b3b]/55 px-2.5 py-1 sm:block">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#b23b3b]/70">{stamp}</span>
        </div>

        <div className="flex items-center gap-2.5">
          <StoreLogo store={coupon.store} src={coupon.imageUrl} size={24} />
          <span className="text-sm font-semibold" style={{ color: meta.color }}>
            {meta.label}
          </span>
        </div>

        <p className="mt-4 font-mono text-[11px] font-semibold uppercase tracking-[0.32em] text-[#8a857a]">
          Vale-desconto
        </p>
        <p className="display mt-1 text-[3rem] leading-[0.95] tracking-tight text-[#161410] sm:text-[4rem]">
          {coupon.discountText ?? "Oferta"}
        </p>
        <p className="mt-3 max-w-sm text-sm text-[#5b574e]">{title}</p>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-[#8a857a]">
          {typeof coupon.minPurchase === "number" && <span>mín · R${coupon.minPurchase}</span>}
          {coupon.scope && <span className="normal-case tracking-normal">{coupon.scope}</span>}
        </div>
      </div>

      {/* PICOTE — vertical (desktop) / horizontal (mobile) */}
      <div className="relative shrink-0">
        <span className={`absolute left-1/2 top-0 hidden h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full sm:block ${hole}`} />
        <span className={`absolute bottom-0 left-1/2 hidden h-6 w-6 -translate-x-1/2 translate-y-1/2 rounded-full sm:block ${hole}`} />
        <div className="hidden h-full border-l-2 border-dashed border-[#1b1a17]/20 sm:block" />
        <span className={`absolute left-0 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full sm:hidden ${hole}`} />
        <span className={`absolute right-0 top-1/2 h-6 w-6 translate-x-1/2 -translate-y-1/2 rounded-full sm:hidden ${hole}`} />
        <div className="mx-7 border-t-2 border-dashed border-[#1b1a17]/20 sm:hidden" />
      </div>

      {/* CANHOTO (direita): codigo + barras + acao */}
      <div className="flex shrink-0 flex-col justify-center gap-3 px-7 py-8 sm:w-64 sm:px-9">
        {coupon.code ? (
          <>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-[#8a857a]">
              Código
            </span>
            <div className="font-mono text-2xl font-bold tracking-[0.12em] text-[#161410]">{coupon.code}</div>
            <Barcode value={coupon.code} />
            <button
              onClick={copy}
              className="mt-1 flex items-center justify-center gap-1.5 rounded-md border-2 border-[#1b1a17]/15 py-2 text-xs font-bold uppercase tracking-wider text-[#1b1a17] transition hover:border-[#1b1a17]/40"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copiar código
                </>
              )}
            </button>
          </>
        ) : (
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-[#8a857a]">
            Oferta sem código — ative no link
          </span>
        )}
        <a
          href={storeUrl(coupon)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-md bg-[#1b1a17] py-2.5 text-sm font-bold uppercase tracking-wider text-[#f7f3ea] transition hover:bg-black"
        >
          Usar cupom <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
