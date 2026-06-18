"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, RefreshCw, Ticket, ShieldCheck, X, Radar } from "lucide-react";
import { CouponCard } from "@/components/CouponCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { STORE_META, type Coupon, type CouponStatus, type Store } from "@/lib/types";

type StoreFilter = Store | "all";
type StatusFilter = CouponStatus | "all";

interface ApiResponse {
  coupons: Coupon[];
  stats: Record<string, number>;
  updatedAt: string | null;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "nunca";
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "agora mesmo";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.floor(h / 24)} d`;
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
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);
  const [store, setStore] = useState<StoreFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("active");
  const [trusted, setTrusted] = useState(true);
  const [query, setQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCoupons = useCallback(async () => {
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
      setUpdatedAt(data.updatedAt ?? null);
    } finally {
      setLoading(false);
    }
  }, [store, status, query, trusted]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchCoupons, query ? 350 : 0);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchCoupons, query]);

  useEffect(() => {
    const id = setInterval(fetchCoupons, 60_000);
    return () => clearInterval(id);
  }, [fetchCoupons]);

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
    <>
      {/* NAV fixa com glass */}
      <nav className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white shadow-lg shadow-brand-500/30">
              <Radar className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="font-display text-base font-bold tracking-tight text-slate-900 dark:text-white">
                Cupom Radar
              </p>
              <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
                cupons verificados · ML · Amazon · Shopee
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={refresh}
              disabled={collecting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:opacity-90 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${collecting ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{collecting ? "Buscando..." : "Atualizar agora"}</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        {/* HERO */}
        <header className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/60 px-3 py-1 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Atualiza sozinho · {timeAgo(updatedAt)}
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Os melhores <span className="text-gradient">cupons</span>, verificados.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500 dark:text-slate-400">
            Varremos agregadores e canais de Telegram em tempo quase real para te trazer cupons que
            realmente funcionam — com código, desconto e onde valem.
          </p>
        </header>

        {/* Stats */}
        <section className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total" value={stats.total ?? 0} tone="slate" />
          <StatCard label="Ativos" value={stats.active ?? 0} tone="emerald" />
          <StatCard label="Suspeitos" value={stats.suspected_exhausted ?? 0} tone="amber" />
          <StatCard label="Expirados" value={stats.expired ?? 0} tone="rose" />
        </section>

        {/* Busca + filtros */}
        <section className="mt-8 flex flex-col gap-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por loja, código, desconto..."
              className="w-full rounded-2xl border border-slate-200 bg-white/80 py-3.5 pl-12 pr-10 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FilterChip active={store === "all"} onClick={() => setStore("all")}>
              Todas as lojas
            </FilterChip>
            {(Object.keys(STORE_META) as Store[]).map((s) => (
              <FilterChip key={s} active={store === s} onClick={() => setStore(s)} dot={STORE_META[s].color}>
                {STORE_META[s].label}
              </FilterChip>
            ))}

            <span className="mx-1 hidden h-5 w-px bg-slate-200 dark:bg-white/10 sm:block" />

            {STATUS_TABS.map((t) => (
              <FilterChip key={t.key} active={status === t.key} onClick={() => setStatus(t.key)}>
                {t.label}
              </FilterChip>
            ))}

            <span className="mx-1 hidden h-5 w-px bg-slate-200 dark:bg-white/10 sm:block" />

            <button
              onClick={() => setTrusted((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                trusted
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10 dark:hover:bg-white/10"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              Só confiáveis
            </button>
          </div>
        </section>

        {/* Aviso honesto */}
        <p className="mt-5 flex items-start gap-2 rounded-xl border border-brand-100 bg-brand-50/70 px-4 py-3 text-xs text-brand-700 dark:border-brand-400/15 dark:bg-brand-500/10 dark:text-brand-200">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Ordenamos pelos mais confiáveis. Cupons <strong>“Exclusivo”</strong> só funcionam pelo link.
            <strong> “Pode ter restrições”</strong> = a fonte não confirmou onde vale — a garantia de 100%
            é sempre no checkout, respeitando as condições.
          </span>
        </p>

        {/* Grade */}
        <section className="mt-6">
          {loading ? (
            <SkeletonGrid />
          ) : coupons.length === 0 ? (
            <EmptyState onRefresh={refresh} collecting={collecting} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {coupons.map((c, i) => (
                <div key={c.id} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
                  <CouponCard coupon={c} />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
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
    slate: "text-slate-900 dark:text-white",
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    rose: "text-rose-600 dark:text-rose-400",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-center shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold ${tones[tone]}`}>{value}</p>
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
          ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900"
          : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10 dark:hover:bg-white/10"
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
        <div
          key={i}
          className="h-60 animate-pulse rounded-2xl border border-slate-200 bg-white/60 dark:border-white/10 dark:bg-white/5"
        />
      ))}
    </div>
  );
}

function EmptyState({ onRefresh, collecting }: { onRefresh: () => void; collecting: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/50 py-16 text-center dark:border-white/10 dark:bg-white/5">
      <Ticket className="h-10 w-10 text-slate-300 dark:text-slate-600" />
      <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">Nenhum cupom para este filtro</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        Tente outro filtro ou clique para buscar os cupons mais recentes.
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
