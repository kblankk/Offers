import type { RawCoupon, Store } from "../types";
import type { Logger } from "../logger";

export interface ProviderContext {
  log: Logger;
}

/** Um provedor coleta cupons de UMA loja. */
export interface Provider {
  readonly store: Store;
  readonly label: string;
  collect(ctx: ProviderContext): Promise<RawCoupon[]>;
}
