"use client";

import { useState } from "react";
import { Copy, Check, ArrowUpRight, ShieldCheck, Users } from "lucide-react";
import { StoreLogo } from "./StoreLogo";
import { STORE_META, type Coupon } from "@/lib/types";

/** Cupom em destaque (spotlight) — grande, editorial. */
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

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-950 p-6 text-white dark:border-zinc-800 sm:p-8">
      {/* brilho de fundo */}
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand-600/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-brand-500/20 blur-3xl" />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <StoreLogo store={coupon.store} src={coupon.imageUrl} size={32} />
            <span className="text-sm font-medium text-zinc-300">{meta.label}</span>
            <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-300">
              Destaque
            </span>
          </div>

          <p className="display mt-4 text-5xl text-white sm:text-6xl">{coupon.discountText ?? "Oferta"}</p>
          <p className="mt-2 max-w-md text-sm text-zinc-400">{coupon.title}</p>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
            {coupon.verifiedText && (
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" /> {coupon.verifiedText}
              </span>
            )}
            {!!coupon.usesToday && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {coupon.usesToday.toLocaleString("pt-BR")} usaram hoje
              </span>
            )}
            {typeof coupon.minPurchase === "number" && <span>mín. R${coupon.minPurchase}</span>}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:w-64">
          {coupon.code && (
            <button
              onClick={copy}
              className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-white/25 bg-white/5 px-4 py-3 transition hover:bg-white/10"
            >
              <span className="truncate font-mono text-lg font-bold tracking-wider">{coupon.code}</span>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand-300">
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
          )}
          <a
            href={coupon.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-500"
          >
            Ir à loja <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
