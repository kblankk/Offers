"use client";

import { useState } from "react";
import { Copy, Check, ArrowUpRight, ShieldCheck, Users, Layers, Sparkles, ThumbsUp, ThumbsDown, Share2 } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { StoreLogo } from "./StoreLogo";
import { STORE_META, storeUrl, type Coupon } from "@/lib/types";
import { SITE_URL } from "@/lib/site";

const RED = "#c0392b";

/** Card de cupom como mini vale-desconto impresso (letterpress, duas tintas). */
export function CouponCard({ coupon }: { coupon: Coupon }) {
  const [copied, setCopied] = useState(false);
  const [vote, setVote] = useState<null | "ok" | "fail">(null);
  const [reports, setReports] = useState({ worked: coupon.worked ?? 0, failed: coupon.failed ?? 0 });
  // Acumulado (nao reseta por dia) — base da taxa de sucesso exibida.
  const [rate, setRate] = useState({ worked: coupon.workedAll ?? 0, failed: coupon.failedAll ?? 0 });
  const meta = STORE_META[coupon.store];
  const isExpired = coupon.status === "expired";

  async function sendFeedback(ok: boolean) {
    if (vote) return;
    setVote(ok ? "ok" : "fail");
    setReports((r) => ({ worked: r.worked + (ok ? 1 : 0), failed: r.failed + (ok ? 0 : 1) }));
    setRate((r) => ({ worked: r.worked + (ok ? 1 : 0), failed: r.failed + (ok ? 0 : 1) }));
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: coupon.id, ok }),
      });
      const data = await res.json();
      if (res.ok && typeof data.worked === "number") setReports({ worked: data.worked, failed: data.failed });
      if (res.ok && typeof data.workedAll === "number") setRate({ worked: data.workedAll, failed: data.failedAll });
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

  function share() {
    const url = `${SITE_URL}/cupom/${coupon.id}`;
    const text = `${coupon.discountText ?? "Cupom"} ${meta.label}${
      coupon.code ? ` — código ${coupon.code}` : ""
    } no AllCupom`;
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (typeof nav.share === "function") {
      nav.share({ title: "AllCupom", text, url }).catch(() => {});
    } else {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(`${text}: ${url}`)}`,
        "_blank",
        "noopener,noreferrer",
      );
    }
  }

  const trust = coupon.verifiedText
    ? { Icon: ShieldCheck, text: coupon.verifiedText, cls: "text-emerald-700" }
    : coupon.usesToday
      ? { Icon: Users, text: `${coupon.usesToday.toLocaleString("pt-BR")} usaram hoje`, cls: "text-[#8a857a]" }
      : null;

  // Taxa de sucesso da comunidade (acumulada). So mostra com votos suficientes.
  const totalVotes = rate.worked + rate.failed;
  const successPct = totalVotes >= 3 ? Math.round((rate.worked / totalVotes) * 100) : null;
  const rateCls =
    successPct === null
      ? ""
      : successPct >= 70
        ? "text-emerald-700"
        : successPct >= 40
          ? "text-amber-600"
          : "text-rose-600";

  // "Novo" = postado na fonte (Telegram) nas ultimas 6h. Usa o tempo REAL do
  // post (nao o firstSeenAt, que reseta a cada deploy do servidor).
  const isNew = !!coupon.postedAt && Date.now() - new Date(coupon.postedAt).getTime() < 6 * 60 * 60 * 1000;
  const title = (coupon.title ?? "").replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}]/gu, "").replace(/\s+/g, " ").trim();

  // recortes do picote = cor do fundo da pagina (parecem furos no papel)
  const notch = "bg-[#e8e2d4] dark:bg-black";

  return (
    <div
      className={`card-elev paper-grain relative flex h-full flex-col overflow-hidden rounded-lg bg-[#f7f3ea] text-[#1b1a17] ring-1 ring-[#1b1a17]/12 transition duration-200 hover:-translate-y-1 ${
        isExpired ? "opacity-55" : ""
      }`}
    >
      {/* faixa na cor da loja */}
      <div className="h-1.5 w-full" style={{ background: meta.color }} />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <StoreLogo store={coupon.store} src={coupon.imageUrl} size={22} />
            <span className="truncate font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[#1b1a17]">
              {meta.label}
            </span>
            {coupon.exclusive && (
              <span title="Exclusivo — use pelo botão" style={{ color: RED }}>
                <Sparkles className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {isNew && !isExpired && (
              <span
                className="rotate-[-4deg] rounded-[3px] border-[1.5px] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider"
                style={{ borderColor: RED, color: RED }}
              >
                Novo
              </span>
            )}
            <StatusBadge status={coupon.status} />
          </div>
        </div>

        {/* desconto + regra vermelha (assinatura) */}
        <p className="display mt-4 text-[2.3rem] font-extrabold leading-none text-[#161410]">
          {coupon.discountText ?? "Oferta"}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="h-[3px] w-9 shrink-0" style={{ background: RED }} />
          {(typeof coupon.minPurchase === "number" || typeof coupon.maxDiscount === "number") && (
            <span className="font-mono text-[10px] uppercase tracking-wide text-[#8a857a]">
              {typeof coupon.minPurchase === "number" ? `mín R$${coupon.minPurchase}` : ""}
              {typeof coupon.minPurchase === "number" && typeof coupon.maxDiscount === "number" ? " · " : ""}
              {typeof coupon.maxDiscount === "number" ? `limite R$${coupon.maxDiscount}` : ""}
            </span>
          )}
        </div>

        <p className="mt-3 line-clamp-1 text-sm text-[#5b574e]">{title}</p>

        <div className="mt-3 space-y-1.5 font-mono text-[11px]">
          {successPct !== null && (
            <p className={`flex items-center gap-1.5 font-semibold ${rateCls}`}>
              <ThumbsUp className="h-3.5 w-3.5 shrink-0" />
              <span className="normal-case">{successPct}% funcionou</span>
              <span className="font-normal text-[#8a857a]">
                · {totalVotes} {totalVotes === 1 ? "voto" : "votos"}
              </span>
            </p>
          )}
          {coupon.scope && (
            <p className="flex items-center gap-1.5 text-[#8a857a]">
              <Layers className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate normal-case">{coupon.scope}</span>
            </p>
          )}
          {!isExpired && trust && (
            <p className={`flex items-center gap-1.5 ${trust.cls}`}>
              <trust.Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="normal-case">{trust.text}</span>
            </p>
          )}
        </div>
      </div>

      {/* picote */}
      <div className="relative">
        <span className={`absolute left-0 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full ${notch}`} />
        <span className={`absolute right-0 top-1/2 h-4 w-4 translate-x-1/2 -translate-y-1/2 rounded-full ${notch}`} />
        <div className="mx-4 border-t-2 border-dashed border-[#1b1a17]/25" />
      </div>

      {/* acao */}
      <div className="p-5 pt-4">
        {coupon.code ? (
          <div className="flex items-stretch gap-2">
            <button
              onClick={copyCode}
              disabled={isExpired}
              className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-[4px] border-[1.5px] border-dashed border-[#1b1a17]/30 px-3 py-2.5 transition hover:border-[#1b1a17]/60 disabled:cursor-not-allowed disabled:opacity-60"
              title="Copiar código"
            >
              <span className="truncate font-mono text-sm font-bold tracking-wider text-[#161410]">{coupon.code}</span>
              {copied ? (
                <Check className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4 shrink-0" style={{ color: RED }} />
              )}
            </button>
            <button
              onClick={share}
              title="Compartilhar"
              className="inline-flex shrink-0 items-center justify-center rounded-[4px] border-[1.5px] border-[#1b1a17]/20 px-2.5 text-[#1b1a17] transition hover:border-[#1b1a17]/50 hover:bg-[#1b1a17]/5"
            >
              <Share2 className="h-4 w-4" />
            </button>
            {/* clicar = copia o código E abre a loja num passo só */}
            <a
              href={storeUrl(coupon)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={copyCode}
              title="Copiar e abrir a loja"
              className="inline-flex shrink-0 items-center justify-center gap-1 rounded-[4px] bg-[#1b1a17] px-3 text-[11px] font-bold uppercase tracking-wide text-[#f7f3ea] transition hover:bg-black"
            >
              Abrir <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        ) : (
          <div className="flex items-stretch gap-2">
            <a
              href={storeUrl(coupon)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-[4px] bg-[#1b1a17] px-3 py-2.5 font-mono text-sm font-bold uppercase tracking-wider text-[#f7f3ea] transition hover:bg-black"
            >
              Ativar desconto <ArrowUpRight className="h-4 w-4" />
            </a>
            <button
              onClick={share}
              title="Compartilhar"
              className="inline-flex shrink-0 items-center justify-center rounded-[4px] border-[1.5px] border-[#1b1a17]/20 px-2.5 text-[#1b1a17] transition hover:border-[#1b1a17]/50 hover:bg-[#1b1a17]/5"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        )}

        {!isExpired && (
          <div className="mt-3 flex items-center justify-between gap-2 font-mono text-[11px]">
            <span className="uppercase tracking-wide text-[#8a857a]">
              {vote ? (vote === "ok" ? "Valeu!" : "Obrigado") : "Funcionou?"}
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
