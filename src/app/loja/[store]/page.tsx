import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listCoupons } from "@/lib/store";
import { STORE_META, type Store } from "@/lib/types";
import { CouponCard } from "@/components/CouponCard";
import { Logo } from "@/components/Logo";
import { SITE_URL, STORE_SLUG } from "@/lib/site";

export const dynamic = "force-dynamic";

const STORE_OF: Record<string, Store> = {
  "mercado-livre": "mercadolivre",
  amazon: "amazon",
  shopee: "shopee",
};

export async function generateMetadata({ params }: { params: Promise<{ store: string }> }): Promise<Metadata> {
  const { store: slug } = await params;
  const store = STORE_OF[slug];
  if (!store) return {};
  const label = STORE_META[store].label;
  const title = `Cupons ${label} verificados (${new Date().getFullYear()}) — AllCupom`;
  const description = `Cupons de desconto ${label} testados e atualizados o tempo todo: código, percentual e status (ativo/expirado). Veja os que realmente funcionam.`;
  const url = `${SITE_URL}/loja/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", images: ["/header.jpg"] },
  };
}

export default async function StorePage({ params }: { params: Promise<{ store: string }> }) {
  const { store: slug } = await params;
  const store = STORE_OF[slug];
  if (!store) notFound();

  const label = STORE_META[store].label;
  const coupons = listCoupons({ store, status: "active" }).slice(0, 60);
  const others = (Object.keys(STORE_SLUG) as Store[]).filter((s) => s !== store);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="flex items-center justify-between gap-3">
        <Link href="/" aria-label="AllCupom — início">
          <Logo />
        </Link>
        <Link href="/" className="text-sm font-medium text-[#5b574e] transition hover:text-[#1b1a17] dark:text-zinc-300 dark:hover:text-white">
          ← Início
        </Link>
      </header>

      <p className="mt-10 font-mono text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: "#c0392b" }}>
        ✶ Cupons {label} ✶
      </p>
      <h1 className="display mt-1 text-4xl text-zinc-900 dark:text-white sm:text-5xl">Cupons {label} verificados</h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-300/80">
        Cupons de desconto da {label} testados e atualizados o tempo todo — com código, percentual e status. Mostramos
        os mais confiáveis primeiro; a confirmação final do desconto é sempre no checkout da loja.
      </p>

      {coupons.length ? (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map((c) => (
            <CouponCard key={c.id} coupon={c} />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-sm text-zinc-500 dark:text-zinc-400">
          Nenhum cupom ativo da {label} no momento. Volte em breve — a lista atualiza sozinha.
        </p>
      )}

      <nav className="mt-12 border-t border-[#1b1a17]/12 pt-6 text-sm dark:border-white/10">
        <span className="text-[#8a857a]">Cupons por loja: </span>
        {others.map((s, i) => (
          <span key={s}>
            <Link href={`/loja/${STORE_SLUG[s]}`} className="font-medium text-[#c0392b] hover:underline">
              {STORE_META[s].label}
            </Link>
            {i < others.length - 1 ? " · " : ""}
          </span>
        ))}
      </nav>
    </main>
  );
}
