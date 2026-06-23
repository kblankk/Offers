"use client";

import { useState } from "react";
import { Copy, Check, ArrowUpRight } from "lucide-react";
import { StoreLogo } from "./StoreLogo";
import { STORE_META, storeUrl, type Coupon } from "@/lib/types";

const RED = "#c0392b";

/** Cruzeta de registro de gráfica (print crop mark). */
function Cross({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 14" className={className} aria-hidden="true">
      <path d="M7 0v14M0 7h14" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

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
 * Destaque no formato de VALE-DESCONTO impresso (letterpress / risografia):
 * papel creme, DUAS tintas (preto + vermelho de carimbo), cruzetas de registro,
 * carimbo de validade que "prensa" na tela, número gigante e código de barras.
 */
export function FeaturedCoupon({ coupon }: { coupon: Coupon }) {
  const [copied, setCopied] = useState(false);
  const meta = STORE_META[coupon.store];
  const stamp = coupon.verifiedText || (coupon.usesToday ? `${coupon.usesToday.toLocaleString("pt-BR")} usaram hoje` : "Válido hoje");
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
    <div className="ticket-serrated paper-grain relative flex flex-col bg-[#f7f3ea] text-[#1b1a17] sm:flex-row">
      {/* cruzetas de registro nos cantos */}
      <Cross className="pointer-events-none absolute left-3 top-3 h-3 w-3 text-[#1b1a17]/30" />
      <Cross className="pointer-events-none absolute right-3 top-3 h-3 w-3 text-[#1b1a17]/30" />
      <Cross className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 text-[#1b1a17]/30" />
      <Cross className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 text-[#1b1a17]/30" />

      {/* OFERTA (esquerda) */}
      <div className="relative flex-1 px-8 py-9 sm:px-11">
        {/* carimbo de validade (prensa no load) */}
        <div
          className="animate-stamp pointer-events-none absolute right-6 top-8 hidden select-none rounded-[3px] border-[2.5px] px-2.5 py-1 sm:block"
          style={{ borderColor: RED, color: RED }}
        >
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]">{stamp}</span>
        </div>

        {/* eyebrow: ★ VALE-DESCONTO ★ em vermelho */}
        <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.34em]" style={{ color: RED }}>
          <span>✶</span> Vale-desconto <span>✶</span>
        </div>

        <div className="mt-4 flex items-center gap-2.5">
          <StoreLogo store={coupon.store} src={coupon.imageUrl} size={22} />
          <span className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#1b1a17]">{meta.label}</span>
        </div>

        {/* desconto gigante + regra vermelha */}
        <p className="display mt-2 text-[3.4rem] font-extrabold leading-[0.9] tracking-tight text-[#161410] sm:text-[5rem]">
          {coupon.discountText ?? "Oferta"}
        </p>
        <div className="mt-3 h-[3px] w-16" style={{ background: RED }} />

        <p className="mt-4 max-w-sm text-sm text-[#5b574e]">{title}</p>

        <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-[#8a857a]">
          {typeof coupon.minPurchase === "number" && <span>mín · R${coupon.minPurchase}</span>}
          {typeof coupon.maxDiscount === "number" && (
            <>
              <span style={{ color: RED }}>·</span>
              <span>limite R${coupon.maxDiscount}</span>
            </>
          )}
          {(typeof coupon.minPurchase === "number" || typeof coupon.maxDiscount === "number") && coupon.scope && (
            <span style={{ color: RED }}>·</span>
          )}
          {coupon.scope && <span className="normal-case tracking-normal">{coupon.scope}</span>}
        </div>
      </div>

      {/* PICOTE — vertical (desktop) / horizontal (mobile) */}
      <div className="relative shrink-0">
        <span className={`absolute left-1/2 top-0 hidden h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full sm:block ${hole}`} />
        <span className={`absolute bottom-0 left-1/2 hidden h-6 w-6 -translate-x-1/2 translate-y-1/2 rounded-full sm:block ${hole}`} />
        <div className="hidden h-full border-l-2 border-dashed border-[#1b1a17]/25 sm:block" />
        <span className={`absolute left-0 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full sm:hidden ${hole}`} />
        <span className={`absolute right-0 top-1/2 h-6 w-6 translate-x-1/2 -translate-y-1/2 rounded-full sm:hidden ${hole}`} />
        <div className="mx-7 border-t-2 border-dashed border-[#1b1a17]/25 sm:hidden" />
      </div>

      {/* CANHOTO (direita): codigo + barras + acao */}
      <div className="flex shrink-0 flex-col justify-center gap-3 px-8 py-8 sm:w-64 sm:px-9">
        {coupon.code ? (
          <>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: RED }}>
              Código
            </span>
            <div className="font-mono text-2xl font-bold tracking-[0.1em] text-[#161410]">{coupon.code}</div>
            <Barcode value={coupon.code} />
            <button
              onClick={copy}
              className="mt-1 flex items-center justify-center gap-1.5 rounded-[3px] border-[1.5px] py-2 font-mono text-xs font-bold uppercase tracking-wider transition hover:bg-[#c0392b]/8"
              style={{ borderColor: RED, color: RED }}
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
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: RED }}>
            Oferta sem código — ative no link
          </span>
        )}
        <a
          href={storeUrl(coupon)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-[3px] bg-[#1b1a17] py-2.5 font-mono text-sm font-bold uppercase tracking-wider text-[#f7f3ea] transition hover:bg-black"
        >
          Usar cupom <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
