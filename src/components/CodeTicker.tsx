"use client";

import { STORE_META, type Coupon } from "@/lib/types";

/** Faixa horizontal infinita com os codigos ativos (kinetic typography). */
export function CodeTicker({ coupons }: { coupons: Coupon[] }) {
  const items = coupons
    .filter((c) => c.code && c.status === "active")
    .slice(0, 24)
    .map((c) => ({ code: c.code as string, discount: c.discountText ?? "", store: c.store }));

  if (items.length < 4) return null;

  const Row = () => (
    <div className="flex shrink-0 items-center gap-8 pr-8">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-2 whitespace-nowrap">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STORE_META[it.store].color }} />
          <span className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">{it.code}</span>
          {it.discount && <span className="text-sm font-medium text-brand-600 dark:text-brand-400">{it.discount}</span>}
        </span>
      ))}
    </div>
  );

  return (
    <div className="marquee-pause relative overflow-hidden border-y border-zinc-200 bg-zinc-50/60 py-3 dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="flex w-max animate-marquee">
        <Row />
        <Row />
      </div>
      {/* esmaecer nas bordas */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent dark:from-[#08090c]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent dark:from-[#08090c]" />
    </div>
  );
}
