"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, RefreshCw, Ticket, ShieldCheck, X } from "lucide-react";
import { CouponCard } from "@/components/CouponCard";
import { STORE_META, type Coupon, type CouponStatus, type Store } from "@/lib/types";

type StoreFilter = Store | "all";
type StatusFilter = CouponStatus | "all";

interface ApiResponse {
  coupons: Coupon[];
  stats: Record<string, number>;
}

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "active", label: "Ativos" },
  { key: "all", label: "Todos" },
  { key: "suspected_exhausted", label: "Suspeitos" },
  { key: "expired", label: "Expirados" },
];

export default function Home() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);
  const [store, setStore] = useState<StoreFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("active");
  const [trusted, setTrusted] = useState(true);
  const [query, setQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (store !== "all") params.set("store", store);
    if (status !== "all") params.set("status", status);
    if (trusted) params.set("trusted", "1");
    if (query.trim()) params.set("q", query.trim());
    try {
      const res = await fetch(`/api/coupons?${params.toString()}`);
      const data: ApiResponse = await res.json();
      setCoupons(data.coupons ?? []);
      setStats(data.stats ?? {});
    } finally {
      setLoading(false);
    }
  }, [store, status, query, trusted]);

  // Refaz a busca quando filtros mudam (com debounce na digitacao).
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchCoupons, query ? 350 : 0);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchCoupons, query]);

  async function refresh() {
    setCollecting(true);
    try {
      await fetch("/api/collect", { method: "POST" });
      await fetchCoupons();
    } finally {
      setCollecting(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
            <Ticket className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Cupom Radar</h1>
            <p className="text-sm text-slate-500">
              Cupons verificados de Mercado Livre, Amazon e Shopee
            </p>
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={collecting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${collecting ? "animate-spin" : ""}`} />
          {collecting ? "Buscando cupons..." : "Atualizar agora"}
        </button>
      </header>

      {/* Stats */}
      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total" value={stats.total ?? 0} tone="slate" />
        <StatCard label="Ativos" value={stats.active ?? 0} tone="emerald" />
        <StatCard label="Suspeitos" value={stats.suspected_exhausted ?? 0} tone="amber" />
        <StatCard label="Expirados" value={stats.expired ?? 0} tone="rose" />
      </section>

      {/* Busca + filtros */}
      <section className="mt-6 flex flex-col gap-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por loja, código, desconto..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-10 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro de loja */}
          <FilterChip active={store === "all"} onClick={() => setStore("all")}>
            Todas as lojas
          </FilterChip>
          {(Object.keys(STORE_META) as Store[]).map((s) => (
            <FilterChip key={s} active={store === s} onClick={() => setStore(s)} dot={STORE_META[s].color}>
              {STORE_META[s].label}
            </FilterChip>
          ))}

          <span className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" />

          {/* Filtro de status */}
          {STATUS_TABS.map((t) => (
            <FilterChip key={t.key} active={status === t.key} onClick={() => setStatus(t.key)}>
              {t.label}
            </FilterChip>
          ))}

          <span className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" />

          {/* So os mais confiaveis */}
          <button
            onClick={() => setTrusted((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              trusted
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Só verificados hoje
          </button>
        </div>
      </section>

      {/* Aviso honesto */}
      <p className="mt-5 flex items-start gap-2 rounded-xl bg-brand-50 px-4 py-3 text-xs text-brand-700 ring-1 ring-inset ring-brand-100">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Ordenamos pelos mais confiáveis: <strong>verificados hoje</strong> e mais usados primeiro.
          Cupons marcados <strong>“Exclusivo”</strong> só funcionam ativando pelo link (não digite o
          código direto na loja). <strong>“Pode ter esgotado”</strong> aparece quando o uso despenca —
          a garantia de 100% só existe aplicando o cupom no checkout, respeitando as condições.
        </span>
      </p>

      {/* Grade de cupons */}
      <section className="mt-6">
        {loading ? (
          <SkeletonGrid />
        ) : coupons.length === 0 ? (
          <EmptyState onRefresh={refresh} collecting={collecting} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {coupons.map((c) => (
              <CouponCard key={c.id} coupon={c} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "slate" | "emerald" | "amber" | "rose";
}) {
  const tones = {
    slate: "text-slate-900",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tones[tone]}`}>{value}</p>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  dot?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-slate-900 text-white shadow-sm"
          : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
      }`}
    >
      {dot && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dot }} />}
      {children}
    </button>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      ))}
    </div>
  );
}

function EmptyState({ onRefresh, collecting }: { onRefresh: () => void; collecting: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 py-16 text-center">
      <Ticket className="h-10 w-10 text-slate-300" />
      <p className="mt-3 text-sm font-medium text-slate-700">Nenhum cupom por aqui ainda</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Clique em “Atualizar agora” para buscar os cupons mais recentes das lojas.
      </p>
      <button
        onClick={onRefresh}
        disabled={collecting}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 ${collecting ? "animate-spin" : ""}`} />
        Buscar cupons
      </button>
    </div>
  );
}
