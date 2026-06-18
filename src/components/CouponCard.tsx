"use client";

import { useState } from "react";
import { Copy, Check, ArrowUpRight, ShieldCheck, Users, Layers, Sparkles } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { StoreLogo } from "./StoreLogo";
import { STORE_META, type Coupon } from "@/lib/types";

export function CouponCard({ coupon }: { coupon: Coupon }) {
  const [copied, setCopied] = useState(false);
  const meta = STORE_META[coupon.store];
  const isExpired = coupon.status === "expired";

  async function copyCode() {
    if (!coupon.code) return;
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  // Uma unica linha de confianca (a mais relevante).
  const trust = coupon.verifiedText
    ? { icon: ShieldCheck, text: coupon.verifiedText, cls: "text-emerald-600 dark:text-emerald-400" }
    : coupon.usesToday
      ? { icon: Users, text: `${coupon.usesToday.toLocaleString("pt-BR")} usaram hoje`, cls: "text-zinc-500 dark:text-zinc-400" }
      : null;

  const scopeUncertain = !coupon.scopeGeneral && /restri|checkout/i.test(coupon.scope ?? "");

  return (
    <div
      className={`group flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[0_12px_40px_-12px_rgba(29,78,216,0.25)] dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 ${
        isExpired ? "opacity-55" : ""
      }`}
    >
      {/* Cabecalho enxuto */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <StoreLogo store={coupon.store} src={coupon.imageUrl} size={28} />
          <span className="truncate text-sm font-medium text-zinc-600 dark:text-zinc-400">{meta.label}</span>
          {coupon.exclusive && (
            <span title="Exclusivo — use pelo botão" className="text-violet-500">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
        <StatusBadge status={coupon.status} />
      </div>

      {/* Desconto (foco) */}
      <div className="mt-4 flex items-baseline gap-2">
        <span className="display text-3xl text-zinc-900 dark:text-white">{coupon.discountText ?? "Oferta"}</span>
        {typeof coupon.minPurchase === "number" && (
          <span className="text-xs font-medium text-zinc-400">acima de R${coupon.minPurchase}</span>
        )}
      </div>

      {/* Titulo curto */}
      <p className="mt-1.5 line-clamp-1 text-sm text-zinc-500 dark:text-zinc-400">{coupon.title}</p>

      {/* Onde vale + confianca: duas linhas discretas */}
      <div className="mt-3 space-y-1.5 text-xs">
        {coupon.scope && (
          <p
            className={`flex items-center gap-1.5 ${
              coupon.scopeGeneral
                ? "text-emerald-600 dark:text-emerald-400"
                : scopeUncertain
                  ? "text-zinc-500 dark:text-zinc-400"
                  : "text-brand-600 dark:text-brand-400"
            }`}
          >
            <Layers className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{coupon.scope}</span>
          </p>
        )}
        {!isExpired && trust && (
          <p className={`flex items-center gap-1.5 ${trust.cls}`}>
            <trust.icon className="h-3.5 w-3.5 shrink-0" />
            {trust.text}
          </p>
        )}
      </div>

      {/* Acao (codigo + ir a loja) */}
      <div className="mt-auto pt-5">
        {coupon.code ? (
          <div className="flex items-stretch gap-2">
            <button
              onClick={copyCode}
              disabled={isExpired}
              className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2.5 transition hover:border-brand-400 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800/60 dark:hover:border-brand-500 dark:hover:bg-zinc-800"
              title="Copiar código"
            >
              <span className="truncate font-mono text-sm font-semibold tracking-wide text-zinc-900 dark:text-zinc-100">
                {coupon.code}
              </span>
              {copied ? (
                <Check className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
              )}
            </button>
            <a
              href={coupon.url}
              target="_blank"
              rel="noopener noreferrer"
              title={coupon.exclusive ? "Ativar cupom" : "Ir à loja"}
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-brand-600 px-3.5 text-white transition hover:bg-brand-700"
            >
              <ArrowUpRight className="h-5 w-5" />
            </a>
          </div>
        ) : (
          <a
            href={coupon.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Ativar desconto <ArrowUpRight className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
}
