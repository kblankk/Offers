import type { MetadataRoute } from "next";
import { listCoupons } from "@/lib/store";
import { SITE_URL, STORE_SLUG } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const stores = Object.values(STORE_SLUG).map((slug) => ({
    url: `${SITE_URL}/loja/${slug}`,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  let coupons: MetadataRoute.Sitemap = [];
  try {
    coupons = listCoupons({ status: "active" })
      .slice(0, 1000)
      .map((c) => ({ url: `${SITE_URL}/cupom/${c.id}`, changeFrequency: "daily" as const, priority: 0.5 }));
  } catch {
    /* sem dados ainda */
  }

  return [{ url: SITE_URL, changeFrequency: "daily", priority: 1 }, ...stores, ...coupons];
}
