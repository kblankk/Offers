"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, RefreshCw, X, Inbox, ShieldCheck, Store as StoreIcon, SlidersHorizontal, ChevronDown } from "lucide-react";
import { CouponCard } from "@/components/CouponCard";
import { ProductChecker } from "@/components/ProductChecker";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CodeTicker } from "@/components/CodeTicker";
import { FeaturedCoupon } from "@/components/FeaturedCoupon";
import { Logo } from "@/components/Logo";
import { ScrollFX } from "@/components/ScrollFX";
import { HeroPhone } from "@/components/HeroPhone";
import { HeroParticles } from "@/components/HeroParticles";
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
      <ScrollFX />
      {/* Header em banner: a imagem de referencia INTEIRA (caixa na proporcao
          exata da foto => mostra a imagem toda, sem corte). */}
      <header className="relative w-full overflow-hidden">
        <div className="relative aspect-[2752/1536] w-full [@media(max-height:800px)]:max-h-[92vh]">
          {/* camada da foto (recebe o parallax ao rolar — box maior pra ter folga) */}
          <div
            data-parallax="0.12"
            className="absolute -top-[10%] left-0 h-[120%] w-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/header.jpg')" }}
          />
          {/* leve escurecimento no topo (nav legivel) e base fundindo no fundo */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/55 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[#000000] to-transparent" />

          {/* particulas azuis em volta do cupom luminoso */}
          <HeroParticles />

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

            <ThemeToggle />
          </div>

          {/* Texto do hero no lado direito (desktop), sobre a imagem */}
          <div className="absolute inset-y-0 left-0 z-10 hidden w-[50%] items-end md:flex lg:w-[46%]">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#000000]/90 via-black/45 to-transparent" />
            <div className="animate-fade-in relative px-8 pb-12 lg:px-14 lg:pb-16">
              <h1 className="display text-4xl text-white lg:text-5xl">
                Economize
                <br />
                <span className="neon text-brand-300">de verdade.</span>
              </h1>
              <p className="mt-4 max-w-md text-sm text-white/85 lg:text-base">
                Cupons de Mercado Livre, Amazon e Shopee, atualizados o tempo todo.
              </p>
            </div>
          </div>

          {/* Mockup de celular no lado direito (telas largas) */}
          <div className="absolute right-[2%] top-1/2 z-[5] hidden -translate-y-1/2 scale-[.66] lg:block xl:right-[5%] xl:scale-[.86] 2xl:right-[7%] 2xl:scale-100">
            <HeroPhone />
          </div>
        </div>
      </header>

      {/* Masthead editorial — so no mobile (no desktop o texto fica sobre a imagem) */}
      <section className="relative mx-auto max-w-6xl px-4 pt-12 sm:px-6 sm:pt-16 md:hidden">
        <h1 className="display text-5xl text-zinc-900 dark:text-white sm:text-7xl">
          Economize
          <br />
          <span className="text-brand-600 dark:text-brand-300 dark:neon">de verdade.</span>
        </h1>
        <p className="mt-5 max-w-xl text-base text-zinc-600 dark:text-zinc-300/80">
          Cupons de Mercado Livre, Amazon e Shopee, atualizados o tempo todo.
        </p>
      </section>

      {/* Destaque */}
      {featured && (
        <section id="destaque" className="animate-fade-in mx-auto mt-10 max-w-6xl scroll-mt-24 px-4 sm:px-6">
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
        <div id="cupons" className="mt-12 flex scroll-mt-24 flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: "#c0392b" }}>
              ✶ Cupons do dia ✶
            </p>
            <h2 className="display mt-1 text-3xl text-zinc-900 dark:text-white sm:text-4xl">Todos os cupons</h2>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {stats.active ?? 0} ativos · atualizado {timeAgo(updatedAt)}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden gap-4 text-right sm:flex">
              <Stat label="Ativos" value={stats.active ?? 0} accent="text-emerald-600 dark:text-emerald-400" />
              <Stat label="Suspeitos" value={stats.suspected_exhausted ?? 0} accent="text-amber-600 dark:text-amber-400" />
              <Stat label="Expirados" value={stats.expired ?? 0} accent="text-rose-600 dark:text-rose-400" />
            </div>
            <button
              onClick={refresh}
              disabled={collecting}
              className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-[#1b1a17] ring-1 ring-[#1b1a17]/20 transition hover:bg-[#1b1a17]/5 disabled:opacity-60 dark:text-zinc-200 dark:ring-white/15 dark:hover:bg-white/5"
            >
              <RefreshCw className={`h-4 w-4 ${collecting ? "animate-spin" : ""}`} />
              Atualizar
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#8a857a]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por loja, código ou desconto"
              className="w-full rounded-lg bg-[#f7f3ea] py-2.5 pl-10 pr-9 text-sm text-[#1b1a17] outline-none ring-1 ring-[#1b1a17]/15 transition placeholder:text-[#8a857a] focus:ring-2 focus:ring-[#1b1a17]/35"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a857a] hover:text-[#1b1a17]"
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
                <StoreIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a857a]" />
                <select
                  value={store}
                  onChange={(e) => setStore(e.target.value as StoreFilter)}
                  aria-label="Filtrar por loja"
                  className="w-full cursor-pointer appearance-none rounded-xl bg-[#f7f3ea] py-2.5 pl-9 pr-9 text-sm font-medium text-[#1b1a17] outline-none ring-1 ring-[#1b1a17]/15 transition [color-scheme:light] focus:ring-2 focus:ring-[#1b1a17]/35"
                >
                  <option value="all">Todas as lojas</option>
                  {(Object.keys(STORE_META) as Store[]).map((s) => (
                    <option key={s} value={s}>
                      {STORE_META[s].label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a857a] transition" />
              </div>
              {/* Status */}
              <div className="group relative min-w-0 flex-1">
                <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a857a]" />
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusFilter)}
                  aria-label="Filtrar por status"
                  className="w-full cursor-pointer appearance-none rounded-xl bg-[#f7f3ea] py-2.5 pl-9 pr-9 text-sm font-medium text-[#1b1a17] outline-none ring-1 ring-[#1b1a17]/15 transition [color-scheme:light] focus:ring-2 focus:ring-[#1b1a17]/35"
                >
                  {STATUS_TABS.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a857a] transition" />
              </div>
            </div>
            {/* Só confiáveis */}
            <button
              onClick={() => setTrusted((v) => !v)}
              aria-pressed={trusted}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                trusted
                  ? "bg-emerald-600 text-white"
                  : "bg-[#f7f3ea] text-[#5b574e] ring-1 ring-[#1b1a17]/15 hover:ring-[#1b1a17]/35"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              {trusted ? "Só cupons confiáveis" : "Mostrando todos"}
              <span
                className={`ml-1 h-2 w-2 rounded-full ${trusted ? "bg-white/90" : "bg-[#1b1a17]/25"}`}
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
            <span className="mx-1 h-5 w-px bg-[#1b1a17]/15" />
            {STATUS_TABS.map((t) => (
              <Chip key={t.key} active={status === t.key} onClick={() => setStatus(t.key)}>
                {t.label}
              </Chip>
            ))}
            <span className="mx-1 h-5 w-px bg-[#1b1a17]/15" />
            <button
              onClick={() => setTrusted((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                trusted
                  ? "bg-emerald-600 text-white"
                  : "bg-[#f7f3ea] text-[#5b574e] ring-1 ring-[#1b1a17]/15 hover:ring-[#1b1a17]/35"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              Só confiáveis
            </button>
          </div>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-[#8a857a]">
          Mostramos os mais confiáveis primeiro. Cupons{" "}
          <strong className="font-semibold text-[#5b574e]">Exclusivos</strong> funcionam pelo link;{" "}
          <strong className="font-semibold text-[#5b574e]">“Pode ter restrições”</strong> = a fonte não confirmou onde
          valem. A confirmação final é sempre no checkout.
        </p>

        <div className="mt-5">
          {loading ? (
            <SkeletonGrid />
          ) : coupons.length === 0 ? (
            <EmptyState onRefresh={refresh} collecting={collecting} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {coupons.map((c) => (
                <div key={c.id} data-reveal>
                  <CouponCard coupon={c} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-[#1b1a17]/12 dark:border-white/10">
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
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
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
          ? "bg-[#1b1a17] text-[#f7f3ea] dark:bg-[#f7f3ea] dark:text-[#1b1a17]"
          : "text-[#5b574e] ring-1 ring-[#1b1a17]/15 hover:ring-[#1b1a17]/35 dark:text-zinc-300 dark:ring-white/15 dark:hover:ring-white/30"
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
          className="card-elev h-56 animate-pulse rounded-xl bg-[#f7f3ea] ring-1 ring-[#1b1a17]/10"
        />
      ))}
    </div>
  );
}

function EmptyState({ onRefresh, collecting }: { onRefresh: () => void; collecting: boolean }) {
  return (
    <div className="card-elev flex flex-col items-center justify-center rounded-xl bg-[#f7f3ea] py-16 text-center text-[#1b1a17] ring-1 ring-[#1b1a17]/10">
      <Inbox className="h-9 w-9 text-[#1b1a17]/25" />
      <p className="mt-3 text-sm font-semibold text-[#1b1a17]">Nenhum cupom para este filtro</p>
      <p className="mt-1 max-w-sm text-sm text-[#5b574e]">
        Tente outro filtro ou atualize para buscar os mais recentes.
      </p>
      <button
        onClick={onRefresh}
        disabled={collecting}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#1b1a17] px-4 py-2 text-sm font-bold uppercase tracking-wider text-[#f7f3ea] transition hover:bg-black disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 ${collecting ? "animate-spin" : ""}`} />
        Atualizar
      </button>
    </div>
  );
}
