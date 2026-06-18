"use client";

import { useState } from "react";
import { Copy, Check, ArrowUpRight, ShieldCheck, Users, Sparkles } from "lucide-react";
import { StoreLogo } from "./StoreLogo";
import { STORE_META, storeUrl, type Coupon } from "@/lib/types";

/**
 * Cupom em destaque, no formato de um VOUCHER/ticket real:
 *  - faixa fina na cor da loja na borda;
 *  - oferta grande a esquerda;
 *  - picote (linha pontilhada + recortes) separando o "canhoto" com o codigo.
 * Sem glows genericos — visual de cupom de papel, tatil e intencional.
 */
export function FeaturedCoupon({ coupon }: { coupon: Coupon }) {
  const [copied, setCopied] = useState(false);
  const meta = STORE_META[coupon.store];

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

  // recortes do picote = cor do fundo da pagina (parecem furos)
  const notch = "bg-[#f5f6f8] dark:bg-black";

  return (
    <div className="card-elev surface relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white dark:bg-transparent sm:flex-row">
      {/* faixa vertical na cor da loja */}
      <div className="absolute inset-y-0 left-0 w-1.5" style={{ background: meta.color }} />

      {/* OFERTA (esquerda) */}
      <div className="flex-1 p-6 pl-8 sm:p-9 sm:pl-11">
        <div className="flex items-center gap-2.5">
          <StoreLogo store={coupon.store} src={coupon.imageUrl} size={26} />
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{meta.label}</span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{ color: meta.color, backgroundColor: `${meta.color}1f` }}
          >
            <Sparkles className="h-3 w-3" /> Destaque
          </span>
        </div>

        <p className="display mt-5 text-[2.75rem] leading-none text-zinc-900 dark:text-white sm:text-6xl">
          {coupon.discountText ?? "Oferta"}
        </p>
        <p className="mt-3 max-w-md text-sm text-zinc-500 dark:text-zinc-400">{coupon.title}</p>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          {coupon.verifiedText && (
            <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" /> {coupon.verifiedText}
            </span>
          )}
          {!!coupon.usesToday && (
            <span className="inline-flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
              <Users className="h-3.5 w-3.5" /> {coupon.usesToday.toLocaleString("pt-BR")} usaram hoje
            </span>
          )}
          {typeof coupon.minPurchase === "number" && (
            <span className="text-zinc-500 dark:text-zinc-400">mín. R${coupon.minPurchase}</span>
          )}
        </div>
      </div>

      {/* PICOTE — vertical no desktop, horizontal no mobile */}
      <div className="relative shrink-0">
        {/* desktop: linha vertical + recortes em cima e embaixo */}
        <span className={`absolute left-1/2 top-0 hidden h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full sm:block ${notch}`} />
        <span className={`absolute bottom-0 left-1/2 hidden h-5 w-5 -translate-x-1/2 translate-y-1/2 rounded-full sm:block ${notch}`} />
        <div className="hidden h-full border-l border-dashed border-zinc-300 dark:border-white/20 sm:block" />
        {/* mobile: linha horizontal + recortes nas laterais */}
        <span className={`absolute left-0 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full sm:hidden ${notch}`} />
        <span className={`absolute right-0 top-1/2 h-5 w-5 translate-x-1/2 -translate-y-1/2 rounded-full sm:hidden ${notch}`} />
        <div className="mx-6 border-t border-dashed border-zinc-300 dark:border-white/20 sm:hidden" />
      </div>

      {/* CANHOTO (direita): codigo + acao */}
      <div className="flex shrink-0 flex-col justify-center gap-3 p-6 sm:w-72 sm:p-9">
        {coupon.code ? (
          <>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Código do cupom
            </span>
            <button
              onClick={copy}
              className="surface-2 flex items-center justify-between gap-2 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 transition hover:border-brand-400 dark:border-white/20"
              title="Copiar código"
            >
              <span className="truncate font-mono text-lg font-bold tracking-wider text-zinc-900 dark:text-white">
                {coupon.code}
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-300">
                {copied ? (
                  <>
                    <Check className="h-4 w-4" /> Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> Copiar
                  </>
                )}
              </span>
            </button>
          </>
        ) : (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Oferta sem código — ative no link
          </span>
        )}
        <a
          href={storeUrl(coupon)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700"
        >
          Ir à loja <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
