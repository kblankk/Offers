"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { Link2, Loader2, CheckCircle2, AlertTriangle, XCircle, Search } from "lucide-react";
import { CouponCard } from "./CouponCard";
import { STORE_META, type Coupon, type Store } from "@/lib/types";

type FitLevel = "yes" | "maybe" | "no";
interface Fit {
  level: FitLevel;
  note: string;
}
type MatchedCoupon = Coupon & { fit: Fit };
interface Product {
  store: Store;
  url: string;
  title?: string;
  price?: number;
  image?: string;
}

const FIT_META: Record<FitLevel, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  yes: { label: "Pode usar", cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20", Icon: CheckCircle2 },
  maybe: { label: "Talvez — confira", cls: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20", Icon: AlertTriangle },
  no: { label: "Não serve", cls: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20", Icon: XCircle },
};

export function ProductChecker() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [coupons, setCoupons] = useState<MatchedCoupon[]>([]);
  const [done, setDone] = useState(false);

  async function check() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setDone(false);
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível verificar esse link.");
        setProduct(null);
        setCoupons([]);
      } else {
        setProduct(data.product);
        setCoupons(data.coupons ?? []);
        setDone(true);
      }
    } catch {
      setError("Falha de rede ao verificar o anúncio.");
    } finally {
      setLoading(false);
    }
  }

  const usable = coupons.filter((c) => c.fit.level !== "no");
  const meta = product ? STORE_META[product.store] : null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center gap-2">
        <Search className="h-5 w-5 text-brand-500" />
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
          Tem um produto em mente?
        </h2>
      </div>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Cole o link de um anúncio do Mercado Livre, Amazon ou Shopee e veja quais cupons dá pra usar nele.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && check()}
            placeholder="https://www.mercadolivre.com.br/..."
            className="w-full rounded-xl border border-slate-200 bg-white/80 py-3 pl-11 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
        <button
          onClick={check}
          disabled={loading || !url.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-fuchsia-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Verificar cupons
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </p>
      )}

      {done && product && meta && (
        <div className="mt-5">
          {/* Produto detectado */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5">
            {product.image ? (
              <img src={product.image} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-lg font-bold" style={{ backgroundColor: meta.color + "22" }}>
                {meta.label.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: meta.color }}>
                {meta.label}
              </p>
              <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                {product.title ?? "Anúncio detectado"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {product.price !== undefined
                  ? `Preço detectado: R$ ${product.price.toLocaleString("pt-BR")}`
                  : "Não consegui ler o preço — mostro os cupons da loja mesmo assim."}
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm font-medium text-slate-700 dark:text-slate-300">
            {usable.length > 0
              ? `${usable.length} cupom(ns) que provavelmente dá pra usar:`
              : "Não encontrei cupons aplicáveis a este anúncio agora."}
          </p>

          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {coupons.slice(0, 12).map((c) => {
              const fm = FIT_META[c.fit.level];
              return (
                <div key={c.id} className="flex flex-col gap-1.5">
                  <span className={`inline-flex items-center gap-1 self-start rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${fm.cls}`}>
                    <fm.Icon className="h-3.5 w-3.5" /> {fm.label}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{c.fit.note}</span>
                  <CouponCard coupon={c} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
