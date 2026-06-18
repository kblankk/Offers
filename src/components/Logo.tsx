/**
 * Wordmark "allcupom" onde o "o" e um ICONE DE ETIQUETA DE CUPOM (price tag)
 * em ciano neon com brilho — no estilo aprovado pelo usuario.
 * SVG => escala nitida em qualquer tamanho.
 */
export function Logo({ className = "", light = false }: { className?: string; light?: boolean }) {
  // `light` força texto branco (para fundos sempre escuros, ex.: o header em foto).
  const letter = light ? "text-white" : "text-zinc-900 dark:text-white";
  return (
    <span className={`display inline-flex select-none items-center text-2xl tracking-tight ${className}`}>
      <span className={letter}>allcup</span>
      <span className="relative mx-[0.02em] inline-block h-[0.82em] w-[0.92em] translate-y-[0.04em]">
        <svg
          viewBox="0 0 26 22"
          fill="none"
          className="h-full w-full drop-shadow-[0_0_6px_rgba(34,211,238,0.85)]"
          aria-hidden="true"
        >
          {/* corpo da etiqueta apontando para a direita */}
          <path
            d="M2.4 5.2C2.4 3.7 3.6 2.5 5.1 2.5H13.2C13.9 2.5 14.6 2.8 15.1 3.3L23 11L15.1 18.7C14.6 19.2 13.9 19.5 13.2 19.5H5.1C3.6 19.5 2.4 18.3 2.4 16.8V5.2Z"
            fill="url(#tag-fill)"
            stroke="#a5f3fc"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          {/* furo da etiqueta */}
          <circle cx="7.2" cy="11" r="1.9" fill="#06121c" stroke="#a5f3fc" strokeWidth="1.1" />
          <defs>
            <linearGradient id="tag-fill" x1="3" y1="3" x2="22" y2="19" gradientUnits="userSpaceOnUse">
              <stop stopColor="#22d3ee" />
              <stop offset="1" stopColor="#0891b2" />
            </linearGradient>
          </defs>
        </svg>
      </span>
      <span className={letter}>m</span>
    </span>
  );
}
