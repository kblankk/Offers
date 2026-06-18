"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, RefreshCw, X, Inbox, ShieldCheck, Store as StoreIcon, SlidersHorizontal, ChevronDown } from "lucide-react";
import { CouponCard } from "@/components/CouponCard";
import { ProductChecker } from "@/components/ProductChecker";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CodeTicker } from "@/components/CodeTicker";
import { FeaturedCoupon } from "@/components/FeaturedCoupon";
import { Logo } from "@/components/Logo";
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

// Navegacao central do header (ancoras para secoes reais da pagina).
const NAV: { href: string; label: string }[] = [
  { href: "#destaque", label: "Destaque" },
  { href: "#cupons", label: "Cupons" },
  { href: "#verificar", label: "Verificar anúncio" },
];

export default function Home() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [highlights, setHighlights] = useState<Coupon[]>([]);
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

  const fetchHighlights = useCallback(async () => {
    try {
      const res = await fetch("/api/coupons?status=active&trusted=1");
      const data: ApiResponse = await res.json();
      setHighlights(data.coupons ?? []);
    } catch {
      /* ignora */
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchCoupons, query ? 350 : 0);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchCoupons, query]);

  useEffect(() => {
    fetchHighlights();
    const id = setInterval(() => {
      fetchCoupons();
      fetchHighlights();
    }, 60_000);
    return () => clearInterval(id);
  }, [fetchCoupons, fetchHighlights]);

  async function refresh() {
    setCollecting(true);
    try {
      await fetch("/api/collect", { method: "POST" });
      await Promise.all([fetchCoupons(), fetchHighlights()]);
    } finally {
      setCollecting(false);
    }
  }

  const featured = highlights.find((c) => c.code) ?? highlights[0];

  return (
    <>
      {/* Header em banner: a imagem de referencia INTEIRA (caixa na proporcao
          exata da foto => mostra a imagem toda, sem corte). */}
      <header className="relative w-full overflow-hidden">
        <div
          className="relative aspect-[2752/1536] w-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/header.jpg')" }}
        >
          {/* leve escurecimento no topo (nav legivel) e base fundindo no fundo */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/55 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[#000000] to-transparent" />

          {/* barra de navegacao sobre a imagem */}
          <div className="absolute inset-x-0 top-0 z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
            <Logo light />

            <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
              {NAV.map((n) => (
                <a
                  key={n.href}
                  href={n.href}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-white/80 drop-shadow transition hover:bg-white/10 hover:text-white"
                >
                  {n.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={refresh}
                disabled={collecting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white shadow-[0_0_18px_-4px_rgba(34,211,238,0.7)] transition hover:bg-brand-700 disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${collecting ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Atualizar</span>
              </button>
            </div>
          </div>

          {/* Texto do hero no lado direito (desktop), sobre a imagem */}
          <div className="absolute inset-y-0 left-0 z-10 hidden w-[50%] items-end md:flex lg:w-[46%]">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#000000]/90 via-black/45 to-transparent" />
            <div className="relative px-8 pb-12 lg:px-14 lg:pb-16">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Atualização automática · {timeAgo(updatedAt)} · {stats.active ?? 0} cupons ativos
              </div>
              <h1 className="display mt-4 text-4xl text-white lg:text-5xl">
                Economize
                <br />
                <span className="neon text-brand-300">de verdade.</span>
              </h1>
              <p className="mt-4 max-w-md text-sm text-white/85 lg:text-base">
                Cupons verificados de Mercado Livre, Amazon e Shopee — com código, desconto e status. Reunidos de
                agregadores e canais de Telegram, atualizados sozinhos.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Masthead editorial — so no mobile (no desktop o texto fica sobre a imagem) */}
      <section className="relative mx-auto max-w-6xl px-4 pt-12 sm:px-6 sm:pt-16 md:hidden">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200/80 bg-white/70 px-3 py-1 text-xs font-medium text-zinc-500 backdrop-blur dark:border-cyan-400/15 dark:bg-white/5 dark:text-zinc-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Atualização automática · {timeAgo(updatedAt)} · {stats.active ?? 0} cupons ativos
        </div>
        <h1 className="display mt-5 text-5xl text-zinc-900 dark:text-white sm:text-7xl">
          Economize
          <br />
          <span className="text-brand-600 dark:text-brand-300 dark:neon">de verdade.</span>
        </h1>
        <p className="mt-5 max-w-xl text-base text-zinc-600 dark:text-zinc-300/80">
          Cupons verificados de Mercado Livre, Amazon e Shopee — com código, desconto e status. Reunidos de
          agregadores e canais de Telegram, atualizados sozinhos.
        </p>
      </section>

      {/* Destaque */}
      {featured && (
        <section id="destaque" className="mx-auto mt-10 max-w-6xl scroll-mt-24 px-4 sm:px-6">
          <FeaturedCoupon coupon={featured} />
        </section>
      )}

      {/* Ticker de codigos */}
      <div className="mt-8">
        <CodeTicker coupons={highlights} />
      </div>

      <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        {/* Checador */}
        <div id="verificar" className="mt-10 scroll-mt-24">
          <ProductChecker />
        </div>

        {/* Toolbar */}
        <div id="cupons" className="mt-12 flex scroll-mt-24 items-end justify-between gap-4">
          <h2 className="display text-2xl text-zinc-900 dark:text-white sm:text-3xl">Todos os cupons</h2>
          <div className="hidden gap-4 text-right sm:flex">
            <Stat label="Ativos" value={stats.active ?? 0} accent="text-emerald-600 dark:text-emerald-400" />
            <Stat label="Suspeitos" value={stats.suspected_exhausted ?? 0} accent="text-amber-600 dark:text-amber-400" />
            <Stat label="Expirados" value={stats.expired ?? 0} accent="text-rose-600 dark:text-rose-400" />
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por loja, código ou desconto"
              className="surface-2 w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-9 text-sm outline-none transition placeholder:text-zinc-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30 dark:text-zinc-100 dark:placeholder:text-zinc-500"
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

          {/* MOBILE: dropdowns estilizados (combinando com o tema) */}
          <div className="flex flex-col gap-2.5 sm:hidden">
            <div className="flex gap-2.5">
              {/* Loja */}
              <div className="group relative min-w-0 flex-1">
                <StoreIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500 dark:text-brand-300" />
                <select
                  value={store}
                  onChange={(e) => setStore(e.target.value as StoreFilter)}
                  aria-label="Filtrar por loja"
                  className="w-full cursor-pointer appearance-none rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-9 text-sm font-medium text-zinc-700 shadow-sm outline-none transition [color-scheme:light] focus:border-brand-400 focus:ring-2 focus:ring-brand-500/25 dark:border-cyan-400/20 dark:bg-white/[0.06] dark:text-zinc-100 dark:shadow-[0_0_0_1px_rgba(34,211,238,0.04)] dark:backdrop-blur dark:[color-scheme:dark]"
                >
                  <option value="all">Todas as lojas</option>
                  {(Object.keys(STORE_META) as Store[]).map((s) => (
                    <option key={s} value={s}>
                      {STORE_META[s].label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 transition group-focus-within:text-brand-500 dark:group-focus-within:text-brand-300" />
              </div>
              {/* Status */}
              <div className="group relative min-w-0 flex-1">
                <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500 dark:text-brand-300" />
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusFilter)}
                  aria-label="Filtrar por status"
                  className="w-full cursor-pointer appearance-none rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-9 text-sm font-medium text-zinc-700 shadow-sm outline-none transition [color-scheme:light] focus:border-brand-400 focus:ring-2 focus:ring-brand-500/25 dark:border-cyan-400/20 dark:bg-white/[0.06] dark:text-zinc-100 dark:shadow-[0_0_0_1px_rgba(34,211,238,0.04)] dark:backdrop-blur dark:[color-scheme:dark]"
                >
                  {STATUS_TABS.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 transition group-focus-within:text-brand-500 dark:group-focus-within:text-brand-300" />
              </div>
            </div>
            {/* Só confiáveis */}
            <button
              onClick={() => setTrusted((v) => !v)}
              aria-pressed={trusted}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                trusted
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_8px_24px_-10px_rgba(16,185,129,0.8)]"
                  : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-cyan-400/20 dark:text-zinc-300 dark:hover:bg-white/5"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              {trusted ? "Só cupons confiáveis" : "Mostrando todos"}
              <span
                className={`ml-1 h-2 w-2 rounded-full ${trusted ? "bg-white/90" : "bg-zinc-300 dark:bg-zinc-600"}`}
              />
            </button>
          </div>

          {/* DESKTOP: chips */}
          <div className="hidden flex-wrap items-center gap-2 sm:flex">
            <Chip active={store === "all"} onClick={() => setStore("all")}>
              Todas as lojas
            </Chip>
            {(Object.keys(STORE_META) as Store[]).map((s) => (
              <Chip key={s} active={store === s} onClick={() => setStore(s)} dot={STORE_META[s].color}>
                {STORE_META[s].label}
              </Chip>
            ))}
            <span className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-800" />
            {STATUS_TABS.map((t) => (
              <Chip key={t.key} active={status === t.key} onClick={() => setStatus(t.key)}>
                {t.label}
              </Chip>
            ))}
            <span className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-800" />
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

        <p className="mt-4 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          Mostramos os mais confiáveis primeiro. Cupons{" "}
          <strong className="font-medium text-zinc-600 dark:text-zinc-300">Exclusivos</strong> funcionam pelo link;{" "}
          <strong className="font-medium text-zinc-600 dark:text-zinc-300">“Pode ter restrições”</strong> = a fonte não
          confirmou onde valem. A confirmação final é sempre no checkout.
        </p>

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

      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-4 py-8 text-center sm:px-6">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Desenvolvido por{" "}
            <span className="font-medium text-zinc-700 dark:text-zinc-200">Kawã Crispim de Oliveira</span>
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            AllCupom · {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div>
      <p className={`display text-2xl ${accent ?? "text-zinc-900 dark:text-white"}`}>{value}</p>
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">{label}</p>
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
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-zinc-900 text-white dark:bg-brand-400 dark:text-zinc-950 dark:shadow-[0_0_14px_-2px_rgba(34,211,238,0.7)]"
          : "border border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-cyan-400/15 dark:text-zinc-300 dark:hover:bg-white/5"
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
          className="surface h-56 animate-pulse rounded-2xl border border-zinc-200 bg-white dark:bg-transparent"
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
