import { NextResponse } from "next/server";
import { listCoupons, stats, lastUpdatedAt } from "@/lib/store";
import type { CouponStatus, Store } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STORES: Store[] = ["mercadolivre", "amazon", "shopee"];
const VALID_STATUS: CouponStatus[] = ["active", "expired", "suspected_exhausted", "unknown"];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const storeParam = searchParams.get("store");
  const statusParam = searchParams.get("status");
  const search = searchParams.get("q") ?? undefined;
  const trustedOnly = searchParams.get("trusted") === "1";
  const includeLow = searchParams.get("all") === "1";

  const store = VALID_STORES.includes(storeParam as Store) ? (storeParam as Store) : undefined;
  const status = VALID_STATUS.includes(statusParam as CouponStatus)
    ? (statusParam as CouponStatus)
    : undefined;

  const coupons = listCoupons({ store, status, search, trustedOnly, includeLow });
  // Quantos de baixa confianca estao escondidos (para o link "ver menos confiaveis").
  const lowHidden =
    trustedOnly || includeLow
      ? 0
      : listCoupons({ store, status, search, includeLow: true }).filter((c) => c.confidence === "low").length;
  return NextResponse.json({ coupons, stats: stats(), updatedAt: lastUpdatedAt(), lowHidden });
}
