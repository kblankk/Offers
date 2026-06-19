"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { Link2, Loader2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { CouponCard } from "./CouponCard";
import { STORE_META, type Coupon, type Store } from "@/lib/types";

type FitLevel = "yes" | "maybe" | "no";
interface Fit {
  level: FitLevel;
  score: number;
  note: string;
}
type MatchedCoupon = Coupon & { fit: Fit };
interface Product {
  store: Store;
  url: string;
  title?: string;
  price?: number;
  image?: string;
  categories?: string[];
}

const FIT: Record<FitLevel, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  yes: { label: "Pode usar", cls: "text-emerald-700 bg-emerald-50 ring-emerald-600/20", Icon: CheckCircle2 },
  maybe: { label: "Talvez — confira", cls: "text-amber-700 bg-amber-50 ring-amber-600/20", Icon: AlertTriangle },
  no: { label: "Não serve", cls: "text-rose-700 bg-rose-50 ring-rose-600/20", Icon: XCircle },
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

  const meta = product ? STORE_META[product.store] : null;

  return (
    <section className="card-elev paper-grain rounded-2xl bg-[#f7f3ea] p-5 text-[#1b1a17] ring-1 ring-[#1b1a17]/10 sm:p-6">
      <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8a857a]">Verificar anúncio</h2>
      <p className="mt-2 text-lg font-semibold text-[#161410]">Tem um produto em mente?</p>
      <p className="mt-1 text-sm text-[#5b574e]">
        Cole o link de um anúncio (Mercado Livre, Amazon ou Shopee) e veja quais cupons dá pra usar nele.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#8a857a]" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && check()}
            placeholder="https://www.mercadolivre.com.br/..."
            className="w-full rounded-lg bg-[#efe9db] py-2.5 pl-10 pr-3 text-sm text-[#1b1a17] outline-none ring-1 ring-[#1b1a17]/15 transition placeholder:text-[#8a857a] focus:ring-2 focus:ring-[#1b1a17]/35"
          />
        </div>
        <button
          onClick={check}
          disabled={loading || !url.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1b1a17] px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-[#f7f3ea] transition hover:bg-black disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Verificar
        </button>
      </div>

      {error && <p className="mt-3 rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">{error}</p>}

      {done && product && meta && (
        <div className="mt-5 border-t border-dashed border-[#1b1a17]/15 pt-5">
          <div className="flex items-center gap-3">
            {product.image ? (
              <img src={product.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover ring-1 ring-[#1b1a17]/15" />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-base font-bold" style={{ backgroundColor: meta.color + "22" }}>
                {meta.label.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#5b574e]">{meta.label}</p>
              <p className="truncate text-sm font-medium text-[#1b1a17]">{product.title ?? "Anúncio detectado"}</p>
              <p className="text-xs text-[#8a857a]">
                {product.categories && product.categories.length > 0
                  ? `Categoria: ${product.categories.join(", ")}`
                  : "Categoria não identificada"}
                {product.price !== undefined ? ` · R$ ${product.price.toLocaleString("pt-BR")}` : ""}
              </p>
            </div>
          </div>

          {(() => {
            const yes = coupons.filter((c) => c.fit.level === "yes").length;
            const maybe = coupons.length - yes;
            const txt =
              coupons.length === 0
                ? "Nenhum cupom aplicável a este produto no momento."
                : yes > 0
                  ? `${yes} cupom(ns) combinam com este produto${maybe ? ` · +${maybe} possíveis (confira as condições)` : ""}`
                  : `${maybe} cupom(ns) possíveis — confira as condições de cada um`;
            return <p className="mt-4 text-sm font-medium text-[#1b1a17]">{txt}</p>;
          })()}

          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {coupons.slice(0, 9).map((c) => {
              const f = FIT[c.fit.level];
              return (
                <div key={c.id} className="flex flex-col gap-2">
                  <div className="flex flex-col gap-1">
                    <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${f.cls}`}>
                      <f.Icon className="h-3.5 w-3.5" /> {f.label}
                    </span>
                    <span className="text-xs leading-snug text-[#8a857a]">{c.fit.note}</span>
                  </div>
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
