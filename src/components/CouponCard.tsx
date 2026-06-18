"use client";

import { useState } from "react";
import { Copy, Check, ArrowUpRight, ShieldCheck, Users, Layers, Sparkles, ThumbsUp, ThumbsDown } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { StoreLogo } from "./StoreLogo";
import { STORE_META, storeUrl, type Coupon } from "@/lib/types";

export function CouponCard({ coupon }: { coupon: Coupon }) {
  const [copied, setCopied] = useState(false);
  const [vote, setVote] = useState<null | "ok" | "fail">(null);
  const [reports, setReports] = useState({ worked: coupon.worked ?? 0, failed: coupon.failed ?? 0 });
  const meta = STORE_META[coupon.store];
  const isExpired = coupon.status === "expired";

  async function sendFeedback(ok: boolean) {
    if (vote) return;
    setVote(ok ? "ok" : "fail");
    setReports((r) => ({ worked: r.worked + (ok ? 1 : 0), failed: r.failed + (ok ? 0 : 1) }));
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: coupon.id, ok }),
      });
      const data = await res.json();
      if (res.ok && typeof data.worked === "number") setReports({ worked: data.worked, failed: data.failed });
    } catch {
      /* mantem o otimista */
    }
  }

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

  const trust = coupon.verifiedText
    ? { Icon: ShieldCheck, text: coupon.verifiedText, cls: "text-emerald-600 dark:text-emerald-400" }
    : coupon.usesToday
      ? { Icon: Users, text: `${coupon.usesToday.toLocaleString("pt-BR")} usaram hoje`, cls: "text-zinc-500 dark:text-zinc-400" }
      : null;

  const isNew = Date.now() - new Date(coupon.firstSeenAt).getTime() < 24 * 60 * 60 * 1000;
  const scopeUncertain = !coupon.scopeGeneral && /restri|checkout/i.test(coupon.scope ?? "");
  const scopeCls = coupon.scopeGeneral
    ? "text-emerald-600 dark:text-emerald-400"
    : scopeUncertain
      ? "text-zinc-500 dark:text-zinc-400"
      : "text-brand-600 dark:text-brand-400";

  // cor dos recortes laterais = cor do fundo da pagina
  const notch = "bg-[#f5f6f8] dark:bg-[#060b13]";

  return (
    <div
      className={`card-elev surface group relative flex h-full flex-col rounded-2xl border border-zinc-200/80 bg-white transition duration-200 hover:-translate-y-1 dark:bg-transparent ${
        isExpired ? "opacity-55" : ""
      }`}
    >
      {/* faixa de cor da loja no topo (sutil) */}
      <div
        className="absolute inset-x-5 top-0 h-0.5 rounded-full opacity-70"
        style={{ background: `linear-gradient(90deg, ${meta.color}, transparent)` }}
      />

      {/* conteudo */}
      <div className="flex flex-1 flex-col p-5">
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
          <div className="flex shrink-0 items-center gap-1.5">
            {isNew && !isExpired && (
              <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Novo
              </span>
            )}
            <StatusBadge status={coupon.status} />
          </div>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="display text-[2rem] leading-none text-zinc-900 dark:text-white">
            {coupon.discountText ?? "Oferta"}
          </span>
          {typeof coupon.minPurchase === "number" && (
            <span className="text-xs font-medium text-zinc-400">acima de R${coupon.minPurchase}</span>
          )}
        </div>

        <p className="mt-2 line-clamp-1 text-sm text-zinc-500 dark:text-zinc-400">{coupon.title}</p>

        <div className="mt-3 space-y-1.5 text-xs">
          {coupon.scope && (
            <p className={`flex items-center gap-1.5 ${scopeCls}`}>
              <Layers className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{coupon.scope}</span>
            </p>
          )}
          {!isExpired && trust && (
            <p className={`flex items-center gap-1.5 ${trust.cls}`}>
              <trust.Icon className="h-3.5 w-3.5 shrink-0" />
              {trust.text}
            </p>
          )}
        </div>
      </div>

      {/* perfuracao de ticket */}
      <div className="relative">
        <span className={`absolute left-0 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full ${notch}`} />
        <span className={`absolute right-0 top-1/2 h-4 w-4 translate-x-1/2 -translate-y-1/2 rounded-full ${notch}`} />
        <div className="mx-3 border-t border-dashed border-zinc-200 dark:border-zinc-700" />
      </div>

      {/* acao */}
      <div className="p-5 pt-4">
        {coupon.code ? (
          <div className="flex items-stretch gap-2">
            <button
              onClick={copyCode}
              disabled={isExpired}
              className="surface-2 flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg bg-zinc-100 px-3 py-2.5 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-white/10"
              title="Copiar código"
            >
              <span className="truncate font-mono text-sm font-semibold tracking-wider text-zinc-900 dark:text-zinc-100">
                {coupon.code}
              </span>
              {copied ? (
                <Check className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
              )}
            </button>
            <a
              href={storeUrl(coupon)}
              target="_blank"
              rel="noopener noreferrer"
              title={coupon.exclusive ? "Ativar cupom" : "Ir à loja"}
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-brand-600 px-3.5 text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700"
            >
              <ArrowUpRight className="h-5 w-5" />
            </a>
          </div>
        ) : (
          <a
            href={storeUrl(coupon)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700"
          >
            Ativar desconto <ArrowUpRight className="h-4 w-4" />
          </a>
        )}

        {/* Verificacao pela comunidade */}
        {!isExpired && (
          <div className="mt-3 flex items-center justify-between gap-2 text-xs">
            {vote ? (
              <span className="text-zinc-400 dark:text-zinc-500">
                {vote === "ok" ? "Valeu pelo retorno! 👍" : "Obrigado — vamos avisar os outros."}
              </span>
            ) : (
              <span className="text-zinc-400 dark:text-zinc-500">Funcionou?</span>
            )}
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={() => sendFeedback(true)}
                disabled={!!vote}
                title="Funcionou"
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 transition disabled:opacity-60 ${
                  vote === "ok"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                    : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/10"
                }`}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                {reports.worked > 0 && <span>{reports.worked}</span>}
              </button>
              <button
                onClick={() => sendFeedback(false)}
                disabled={!!vote}
                title="Não funcionou / esgotado"
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 transition disabled:opacity-60 ${
                  vote === "fail"
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                    : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/10"
                }`}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
                {reports.failed > 0 && <span>{reports.failed}</span>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
