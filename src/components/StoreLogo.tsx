/* eslint-disable @next/next/no-img-element */
import { STORE_META, type Store } from "@/lib/types";

/** Logo da loja: usa a imagem da fonte quando disponivel, com fallback colorido. */
export function StoreLogo({ store, src, size = 44 }: { store: Store; src?: string; size?: number }) {
  const meta = STORE_META[store];
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 dark:bg-white/90 dark:ring-white/10"
      style={{ width: size, height: size }}
      title={meta.label}
    >
      {src ? (
        <img src={src} alt={meta.label} width={size} height={size} className="h-full w-full object-contain p-1.5" />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center text-lg font-bold text-slate-700"
          style={{ backgroundColor: meta.color + "22" }}
        >
          {meta.label.charAt(0)}
        </span>
      )}
    </div>
  );
}
