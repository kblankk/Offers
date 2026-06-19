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
          <span className="font-mono text-sm font-bold tracking-wide text-[#161410]">{it.code}</span>
          {it.discount && <span className="font-mono text-sm font-medium text-[#8a857a]">{it.discount}</span>}
        </span>
      ))}
    </div>
  );

  return (
    <div className="marquee-pause relative overflow-hidden border-y border-[#1b1a17]/10 bg-[#efe9db] py-3 dark:border-white/10 dark:bg-[#f7f3ea]">
      <div className="flex w-max animate-marquee">
        <Row />
        <Row />
      </div>
      {/* esmaecer nas bordas */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#e8e2d4] to-transparent dark:from-black" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#e8e2d4] to-transparent dark:from-black" />
    </div>
  );
}
