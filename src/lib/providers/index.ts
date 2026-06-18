import type { Store } from "../types";
import { config } from "../config";
import type { Provider, ProviderContext } from "./provider";
import { collectFromCuponomia } from "./cuponomia";

/** Slug de cada loja na fonte (Cuponomia). */
const SLUG: Record<Store, string> = {
  mercadolivre: "mercado-livre",
  amazon: "amazon",
  shopee: "shopee",
};

const LABEL: Record<Store, string> = {
  mercadolivre: "Mercado Livre",
  amazon: "Amazon",
  shopee: "Shopee",
};

function makeProvider(store: Store): Provider {
  return {
    store,
    label: LABEL[store],
    collect: (ctx: ProviderContext) => collectFromCuponomia(store, SLUG[store], ctx),
  };
}

const ALL: Record<Store, Provider> = {
  mercadolivre: makeProvider("mercadolivre"),
  amazon: makeProvider("amazon"),
  shopee: makeProvider("shopee"),
};

export function enabledProviders(): Provider[] {
  return config.enabledStores.map((s) => ALL[s]);
}

export function providerFor(store: Store): Provider {
  return ALL[store];
}

export type { Provider } from "./provider";
