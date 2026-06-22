import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCoupon } from "@/lib/store";
import { STORE_META } from "@/lib/types";
import { FeaturedCoupon } from "@/components/FeaturedCoupon";
import { Logo } from "@/components/Logo";
import { SITE_URL, STORE_SLUG } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const c = getCoupon(id);
  if (!c) return { title: "Cupom — AllCupom" };
  const label = STORE_META[c.store].label;
  const title = `${c.discountText ?? "Cupom"} ${label}${c.code ? ` · código ${c.code}` : ""} — AllCupom`;
  const description = `${c.title}. Cupom ${label} verificado no AllCupom — veja se está ativo e use no checkout.`;
  const url = `${SITE_URL}/cupom/${id}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", images: ["/header.jpg"] },
  };
}

export default async function CouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = getCoupon(id);
  if (!c) notFound();

  const label = STORE_META[c.store].label;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="flex items-center justify-between gap-3">
        <Link href="/" aria-label="AllCupom — início">
          <Logo />
        </Link>
        <Link
          href={`/loja/${STORE_SLUG[c.store]}`}
          className="text-sm font-medium text-[#5b574e] transition hover:text-[#1b1a17] dark:text-zinc-300 dark:hover:text-white"
        >
          ← Cupons {label}
        </Link>
      </header>

      <h1 className="sr-only">
        {c.discountText} {label} {c.code ?? ""}
      </h1>

      <div className="mt-10">
        <FeaturedCoupon coupon={c} />
      </div>

      <p className="mt-6 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300/80">{c.title}</p>
      <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
        Cupom verificado no AllCupom. A confirmação final do desconto é sempre no checkout da loja.
      </p>

      <Link href="/" className="mt-8 inline-block text-sm font-medium text-[#c0392b] hover:underline">
        ← Ver todos os cupons
      </Link>
    </main>
  );
}
