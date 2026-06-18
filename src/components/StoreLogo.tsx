/* eslint-disable @next/next/no-img-element */
import { STORE_META, type Store } from "@/lib/types";

/** Logo da loja: imagem da fonte quando ha, com fallback colorido sobrio. */
export function StoreLogo({ store, src, size = 38 }: { store: Store; src?: string; size?: number }) {
  const meta = STORE_META[store];
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-zinc-200 dark:ring-zinc-700"
      style={{ width: size, height: size }}
      title={meta.label}
    >
      {src ? (
        <img src={src} alt="" width={size} height={size} className="h-full w-full object-contain p-1" />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center text-sm font-bold text-zinc-700"
          style={{ backgroundColor: meta.color + "22" }}
        >
          {meta.label.charAt(0)}
        </span>
      )}
    </div>
  );
}
