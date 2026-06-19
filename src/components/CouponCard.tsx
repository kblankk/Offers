"use client";

import { useState } from "react";
import { Copy, Check, ArrowUpRight, ShieldCheck, Users, Layers, Sparkles, ThumbsUp, ThumbsDown } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { StoreLogo } from "./StoreLogo";
import { STORE_META, storeUrl, type Coupon } from "@/lib/types";

/** Card de cupom no formato de mini vale-desconto de papel (mesma linguagem do destaque). */
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
    ? { Icon: ShieldCheck, text: coupon.verifiedText, cls: "text-emerald-700" }
    : coupon.usesToday
      ? { Icon: Users, text: `${coupon.usesToday.toLocaleString("pt-BR")} usaram hoje`, cls: "text-[#8a857a]" }
      : null;

  const isNew = Date.now() - new Date(coupon.firstSeenAt).getTime() < 24 * 60 * 60 * 1000;
  const title = (coupon.title ?? "").replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}]/gu, "").replace(/\s+/g, " ").trim();

  // recortes do picote = cor do fundo da pagina (parecem furos no papel)
  const notch = "bg-[#f5f6f8] dark:bg-black";

  return (
    <div
      className={`card-elev relative flex h-full flex-col overflow-hidden rounded-xl bg-[#f7f3ea] text-[#1b1a17] ring-1 ring-[#1b1a17]/10 transition duration-200 hover:-translate-y-1 ${
        isExpired ? "opacity-60" : ""
      }`}
    >
      {/* aba na cor da loja */}
      <div className="h-1.5 w-full" style={{ background: meta.color }} />

      {/* conteudo */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <StoreLogo store={coupon.store} src={coupon.imageUrl} size={24} />
            <span className="truncate text-sm font-semibold text-[#1b1a17]">{meta.label}</span>
            {coupon.exclusive && (
              <span title="Exclusivo — use pelo botão" className="text-violet-600">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {isNew && !isExpired && (
              <span className="rounded-full bg-[#1b1a17] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#f7f3ea]">
                Novo
              </span>
            )}
            <StatusBadge status={coupon.status} />
          </div>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="display text-[2rem] leading-none text-[#161410]">{coupon.discountText ?? "Oferta"}</span>
          {typeof coupon.minPurchase === "number" && (
            <span className="font-mono text-[11px] uppercase tracking-wide text-[#8a857a]">mín R${coupon.minPurchase}</span>
          )}
        </div>

        <p className="mt-2 line-clamp-1 text-sm text-[#5b574e]">{title}</p>

        <div className="mt-3 space-y-1.5 text-xs">
          {coupon.scope && (
            <p className="flex items-center gap-1.5 text-[#8a857a]">
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

      {/* picote */}
      <div className="relative">
        <span className={`absolute left-0 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full ${notch}`} />
        <span className={`absolute right-0 top-1/2 h-4 w-4 translate-x-1/2 -translate-y-1/2 rounded-full ${notch}`} />
        <div className="mx-4 border-t border-dashed border-[#1b1a17]/25" />
      </div>

      {/* acao */}
      <div className="p-5 pt-4">
        {coupon.code ? (
          <div className="flex items-stretch gap-2">
            <button
              onClick={copyCode}
              disabled={isExpired}
              className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-md border border-dashed border-[#1b1a17]/30 px-3 py-2.5 transition hover:border-[#1b1a17]/60 disabled:cursor-not-allowed disabled:opacity-60"
              title="Copiar código"
            >
              <span className="truncate font-mono text-sm font-bold tracking-wider text-[#161410]">{coupon.code}</span>
              {copied ? (
                <Check className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4 shrink-0 text-[#1b1a17]/60" />
              )}
            </button>
            <a
              href={storeUrl(coupon)}
              target="_blank"
              rel="noopener noreferrer"
              title={coupon.exclusive ? "Ativar cupom" : "Ir à loja"}
              className="inline-flex shrink-0 items-center justify-center rounded-md bg-[#1b1a17] px-3.5 text-[#f7f3ea] transition hover:bg-black"
            >
              <ArrowUpRight className="h-5 w-5" />
            </a>
          </div>
        ) : (
          <a
            href={storeUrl(coupon)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-md bg-[#1b1a17] px-3 py-2.5 text-sm font-bold uppercase tracking-wider text-[#f7f3ea] transition hover:bg-black"
          >
            Ativar desconto <ArrowUpRight className="h-4 w-4" />
          </a>
        )}

        {/* Verificacao pela comunidade */}
        {!isExpired && (
          <div className="mt-3 flex items-center justify-between gap-2 text-xs">
            <span className="text-[#8a857a]">
              {vote ? (vote === "ok" ? "Valeu pelo retorno!" : "Obrigado — vamos avisar.") : "Funcionou?"}
            </span>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={() => sendFeedback(true)}
                disabled={!!vote}
                title="Funcionou"
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 transition disabled:opacity-60 ${
                  vote === "ok" ? "bg-emerald-100 text-emerald-700" : "text-[#8a857a] hover:bg-[#1b1a17]/5"
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
                  vote === "fail" ? "bg-rose-100 text-rose-700" : "text-[#8a857a] hover:bg-[#1b1a17]/5"
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
