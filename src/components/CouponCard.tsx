"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, Tag, Clock, Users, Zap, AlertTriangle, Sparkles } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { StoreLogo } from "./StoreLogo";
import { STORE_META, type Coupon } from "@/lib/types";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  return `há ${d} d`;
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
      /* clipboard pode falhar em http; ignora */
    }
  }

  return (
    <div
      className={`group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        isExpired ? "opacity-70" : ""
      }`}
    >
      {/* faixa colorida da loja no topo */}
      <div
        className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
        style={{ backgroundColor: meta.color }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <StoreLogo store={coupon.store} src={coupon.imageUrl} />
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
              {meta.label}
              {coupon.exclusive && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">
                  <Sparkles className="h-2.5 w-2.5" /> Exclusivo
                </span>
              )}
            </p>
            <p className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="h-3 w-3" /> visto {timeAgo(coupon.lastSeenAt)}
            </p>
          </div>
        </div>
        <StatusBadge status={coupon.status} />
      </div>

      {coupon.discountText && (
        <p className="mt-4 text-2xl font-extrabold tracking-tight text-brand-600">
          {coupon.discountText}
        </p>
      )}

      <h3 className="mt-1 line-clamp-2 text-sm font-medium text-slate-800">{coupon.title}</h3>

      {coupon.description && (
        <p className="mt-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs leading-snug text-slate-600">
          <span className="font-semibold text-slate-500">Condições: </span>
          {coupon.description}
        </p>
      )}

      {/* Sinal de confianca da fonte */}
      {(coupon.verifiedText || coupon.usesToday) && !isExpired && (
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          {coupon.verifiedText && (
            <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
              <Check className="h-3.5 w-3.5" /> {coupon.verifiedText}
            </span>
          )}
          {!!coupon.usesToday && (
            <span className="inline-flex items-center gap-1 text-slate-500">
              <Users className="h-3.5 w-3.5" /> {coupon.usesToday.toLocaleString("pt-BR")} usaram hoje
            </span>
          )}
        </p>
      )}

      {/* Aviso de esgotamento */}
      {coupon.status === "suspected_exhausted" && (
        <p className="mt-2 flex items-start gap-1 text-xs font-medium text-amber-600">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {coupon.statusReason}
        </p>
      )}

      <div className="mt-auto pt-4">
        {coupon.code ? (
          <button
            onClick={copyCode}
            disabled={isExpired}
            className="flex w-full items-center justify-between rounded-xl border border-dashed border-brand-300 bg-brand-50 px-3 py-2.5 text-left transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex items-center gap-2 font-mono text-sm font-bold tracking-wider text-brand-700">
              <Tag className="h-4 w-4" />
              {coupon.code}
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold text-brand-600">
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
          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
            <Tag className="h-3.5 w-3.5" /> Desconto direto no link
          </span>
        )}

        {coupon.exclusive && (
          <p className="mt-1.5 text-[11px] leading-tight text-violet-600">
            Cupom exclusivo: ative pelo botão abaixo — o código pode não funcionar digitado direto na loja.
          </p>
        )}

        <a
          href={coupon.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
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
