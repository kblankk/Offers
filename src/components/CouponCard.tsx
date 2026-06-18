"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, Tag, Clock, Users, Zap, AlertTriangle, Sparkles, Layers } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { StoreLogo } from "./StoreLogo";
import { STORE_META, type Coupon } from "@/lib/types";

function sourceLabel(source: string): string {
  if (source.startsWith("telegram:")) return `via Telegram @${source.slice("telegram:".length)}`;
  if (source === "cuponomia") return "via Cuponomia";
  return `via ${source}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.floor(h / 24)} d`;
}

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
      /* clipboard pode falhar em http */
    }
  }

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20 dark:hover:border-white/20 ${
        isExpired ? "opacity-60" : ""
      }`}
    >
      {/* brilho no hover */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-brand-500/10 opacity-0 blur-2xl transition group-hover:opacity-100" />
      {/* faixa colorida da loja */}
      <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: meta.color }} />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <StoreLogo store={coupon.store} src={coupon.imageUrl} />
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {meta.label}
              {coupon.exclusive && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                  <Sparkles className="h-2.5 w-2.5" /> Exclusivo
                </span>
              )}
            </p>
            <p className="flex flex-wrap items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
              <Clock className="h-3 w-3" /> visto {timeAgo(coupon.lastSeenAt)}
              {coupon.source && <span className="text-slate-300 dark:text-slate-600">·</span>}
              {coupon.source && <span>{sourceLabel(coupon.source)}</span>}
            </p>
          </div>
        </div>
        <StatusBadge status={coupon.status} />
      </div>

      <div className="mt-4 flex items-center gap-2">
        {coupon.discountText && (
          <span className="font-display text-2xl font-bold tracking-tight text-brand-600 dark:text-brand-300">
            {coupon.discountText}
          </span>
        )}
        {typeof coupon.minPurchase === "number" && (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
            mín. R${coupon.minPurchase}
          </span>
        )}
      </div>

      <h3 className="mt-1 line-clamp-2 text-sm font-medium text-slate-800 dark:text-slate-200">{coupon.title}</h3>

      {coupon.scope &&
        (() => {
          const uncertain = !coupon.scopeGeneral && /restri|checkout/i.test(coupon.scope);
          const cls = coupon.scopeGeneral
            ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20"
            : uncertain
              ? "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20"
              : "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/20";
          const prefix = coupon.scopeGeneral ? "Vale em: " : uncertain ? "" : "Só em: ";
          return (
            <p className={`mt-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${cls}`}>
              <Layers className="h-3.5 w-3.5" />
              {prefix}
              {coupon.scope}
            </p>
          );
        })()}

      {coupon.description && (
        <p className="mt-1.5 line-clamp-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs leading-snug text-slate-600 dark:bg-white/5 dark:text-slate-400">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Condições: </span>
          {coupon.description}
        </p>
      )}

      {(coupon.verifiedText || coupon.usesToday) && !isExpired && (
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          {coupon.verifiedText && (
            <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
              <Check className="h-3.5 w-3.5" /> {coupon.verifiedText}
            </span>
          )}
          {!!coupon.usesToday && (
            <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <Users className="h-3.5 w-3.5" /> {coupon.usesToday.toLocaleString("pt-BR")} usaram hoje
            </span>
          )}
        </p>
      )}

      {coupon.status === "suspected_exhausted" && (
        <p className="mt-2 flex items-start gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {coupon.statusReason}
        </p>
      )}

      <div className="mt-auto pt-4">
        {coupon.code ? (
          <button
            onClick={copyCode}
            disabled={isExpired}
            className="flex w-full items-center justify-between rounded-xl border border-dashed border-brand-300 bg-brand-50 px-3 py-2.5 text-left transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-400/40 dark:bg-brand-500/10 dark:hover:bg-brand-500/20"
          >
            <span className="flex items-center gap-2 font-mono text-sm font-bold tracking-wider text-brand-700 dark:text-brand-200">
              <Tag className="h-4 w-4" />
              {coupon.code}
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-300">
              {copied ? (
                <>
                  <Check className="h-4 w-4" /> Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" /> Copiar
                </>
              )}
            </span>
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 dark:bg-white/10 dark:text-slate-300">
            <Tag className="h-3.5 w-3.5" /> Desconto direto no link
          </span>
        )}

        {coupon.exclusive && (
          <p className="mt-1.5 text-[11px] leading-tight text-violet-600 dark:text-violet-300">
            Cupom exclusivo: ative pelo botão abaixo — o código pode não funcionar digitado direto na loja.
          </p>
        )}

        <a
          href={coupon.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-brand-600 dark:hover:bg-brand-500"
        >
          {coupon.exclusive ? (
            <>
              Ativar cupom <Zap className="h-4 w-4" />
            </>
          ) : (
            <>
              Ir à loja <ExternalLink className="h-4 w-4" />
            </>
          )}
        </a>
      </div>
    </div>
  );
}
