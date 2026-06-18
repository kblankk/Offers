"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, RefreshCw, Radar, ShieldCheck, X, Inbox } from "lucide-react";
import { CouponCard } from "@/components/CouponCard";
import { ProductChecker } from "@/components/ProductChecker";
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
  if (!iso) return "—";
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
      {/* Barra superior */}
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/85 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Radar className="h-[18px] w-[18px]" />
            </div>
            <div className="leading-tight">
              <p className="text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-white">Cupom Radar</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Mercado Livre · Amazon · Shopee</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={refresh}
              disabled={collecting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${collecting ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6">
        {/* Intro */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Cupons verificados
            </h1>
            <p className="mt-1 max-w-xl text-sm text-zinc-500 dark:text-zinc-400">
              Reunimos cupons de agregadores e canais de Telegram, com status e condições de cada um.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Atualização automática · {timeAgo(updatedAt)}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Total" value={stats.total ?? 0} />
          <Stat label="Ativos" value={stats.active ?? 0} accent="text-emerald-600 dark:text-emerald-400" />
          <Stat label="Suspeitos" value={stats.suspected_exhausted ?? 0} accent="text-amber-600 dark:text-amber-400" />
          <Stat label="Expirados" value={stats.expired ?? 0} accent="text-rose-600 dark:text-rose-400" />
        </div>

        {/* Checador de produto */}
        <div className="mt-6">
          <ProductChecker />
        </div>

        {/* Toolbar */}
        <div className="mt-8 flex flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por loja, código ou desconto"
              className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-9 text-sm outline-none transition placeholder:text-zinc-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="h-[18px] w-[18px]" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Chip active={store === "all"} onClick={() => setStore("all")}>
              Todas as lojas
            </Chip>
            {(Object.keys(STORE_META) as Store[]).map((s) => (
              <Chip key={s} active={store === s} onClick={() => setStore(s)} dot={STORE_META[s].color}>
                {STORE_META[s].label}
              </Chip>
            ))}
            <span className="mx-1 hidden h-5 w-px bg-zinc-200 dark:bg-zinc-800 sm:block" />
            {STATUS_TABS.map((t) => (
              <Chip key={t.key} active={status === t.key} onClick={() => setStatus(t.key)}>
                {t.label}
              </Chip>
            ))}
            <span className="mx-1 hidden h-5 w-px bg-zinc-200 dark:bg-zinc-800 sm:block" />
            <button
              onClick={() => setTrusted((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                trusted
                  ? "bg-emerald-600 text-white"
                  : "border border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              Só confiáveis
            </button>
          </div>
        </div>

        {/* Nota de confianca */}
        <p className="mt-4 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          Mostramos os mais confiáveis primeiro. Cupons <strong className="font-medium text-zinc-600 dark:text-zinc-300">Exclusivos</strong> funcionam pelo link;{" "}
          <strong className="font-medium text-zinc-600 dark:text-zinc-300">“Pode ter restrições”</strong> significa que a fonte não confirmou onde valem. A confirmação final é sempre no checkout.
        </p>

        {/* Grade */}
        <div className="mt-5">
          {loading ? (
            <SkeletonGrid />
          ) : coupons.length === 0 ? (
            <EmptyState onRefresh={refresh} collecting={collecting} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {coupons.map((c) => (
                <div key={c.id} className="animate-fade-in">
                  <CouponCard coupon={c} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={`mt-0.5 text-2xl font-semibold tracking-tight ${accent ?? "text-zinc-900 dark:text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function Chip({
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
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
          : "border border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
      }`}
    >
      {dot && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dot }} />}
      {children}
    </button>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-56 animate-pulse rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
        />
      ))}
    </div>
  );
}

function EmptyState({ onRefresh, collecting }: { onRefresh: () => void; collecting: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-700">
      <Inbox className="h-9 w-9 text-zinc-300 dark:text-zinc-600" />
      <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-200">Nenhum cupom para este filtro</p>
      <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        Tente outro filtro ou atualize para buscar os mais recentes.
      </p>
      <button
        onClick={onRefresh}
        disabled={collecting}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 ${collecting ? "animate-spin" : ""}`} />
        Atualizar
      </button>
    </div>
  );
}
