"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, Users, ShieldCheck, AlertTriangle, Sparkles } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { StoreLogo } from "./StoreLogo";
import { STORE_META, type Coupon } from "@/lib/types";

function sourceLabel(source?: string): string {
  if (!source) return "";
  if (source.startsWith("telegram:")) return `Telegram @${source.slice("telegram:".length)}`;
  if (source === "cuponomia") return "Cuponomia";
  return source;
}

function timeAgo(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
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
      /* ignore */
    }
  }

  const scopeUncertain = !coupon.scopeGeneral && /restri|checkout/i.test(coupon.scope ?? "");
  const scopeCls = coupon.scopeGeneral
    ? "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10"
    : scopeUncertain
      ? "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10"
      : "text-sky-700 bg-sky-50 dark:text-sky-400 dark:bg-sky-500/10";

  return (
    <div
      className={`flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 ${
        isExpired ? "opacity-60" : ""
      }`}
    >
      {/* topo: loja + status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <StoreLogo store={coupon.store} src={coupon.imageUrl} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{meta.label}</span>
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: meta.color }} />
            </div>
            {coupon.exclusive && (
              <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-violet-600 dark:text-violet-400">
                <Sparkles className="h-3 w-3" /> Exclusivo
              </span>
            )}
          </div>
        </div>
        <StatusBadge status={coupon.status} />
      </div>

      {/* desconto */}
      <div className="mt-3 flex items-baseline gap-2">
        {coupon.discountText && (
          <span className="text-2xl font-bold tracking-tight text-brand-600 dark:text-brand-400">
            {coupon.discountText}
          </span>
        )}
        {typeof coupon.minPurchase === "number" && (
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            mín. R${coupon.minPurchase}
          </span>
        )}
      </div>

      {/* titulo */}
      <p className="mt-1 line-clamp-2 text-sm text-zinc-700 dark:text-zinc-300">{coupon.title}</p>

      {/* onde vale (sempre completo) */}
      {coupon.scope && (
        <p className={`mt-2 rounded-md px-2 py-1 text-xs font-medium ${scopeCls}`}>
          {coupon.scopeGeneral ? "Vale em " : scopeUncertain ? "" : "Vale só em "}
          {coupon.scope}
        </p>
      )}

      {/* condicoes */}
      {coupon.description && (
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          {coupon.description}
        </p>
      )}

      {/* sinais de confianca */}
      {!isExpired && (coupon.verifiedText || coupon.usesToday) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {coupon.verifiedText && (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" /> {coupon.verifiedText}
            </span>
          )}
          {!!coupon.usesToday && (
            <span className="inline-flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
              <Users className="h-3.5 w-3.5" /> {coupon.usesToday.toLocaleString("pt-BR")} usaram hoje
            </span>
          )}
        </div>
      )}

      {coupon.status === "suspected_exhausted" && (
        <p className="mt-2 flex items-start gap-1 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {coupon.statusReason}
        </p>
      )}

      {/* acao */}
      <div className="mt-auto pt-4">
        {coupon.code ? (
          <button
            onClick={copyCode}
            disabled={isExpired}
            className="flex w-full items-center justify-between gap-2 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2 transition hover:border-brand-400 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800/60 dark:hover:border-brand-500 dark:hover:bg-zinc-800"
          >
            <span className="truncate font-mono text-sm font-semibold tracking-wide text-zinc-900 dark:text-zinc-100">
              {coupon.code}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400">
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copiar
                </>
              )}
            </span>
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            Desconto aplicado pelo link
          </span>
        )}

        {coupon.exclusive && (
          <p className="mt-1.5 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
            Exclusivo: ative pelo botão — pode não funcionar digitado direto na loja.
          </p>
        )}

        <a
          href={coupon.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          {coupon.exclusive ? "Ativar cupom" : "Ir à loja"}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>

        {/* rodape: fonte + visto */}
        <p className="mt-2 truncate text-[11px] text-zinc-400 dark:text-zinc-500">
          {sourceLabel(coupon.source)} · visto {timeAgo(coupon.lastSeenAt)}
        </p>
      </div>
    </div>
  );
}
