/**
 * Wordmark "allcupom" onde o "o" e uma etiqueta de preco (price tag) magenta,
 * no estilo aprovado pelo usuario. SVG => escala nitida em qualquer tamanho.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`display inline-flex select-none items-center text-2xl tracking-tight ${className}`}>
      <span className="text-zinc-900 dark:text-white">allcup</span>
      <span className="relative mx-[0.015em] inline-block h-[0.74em] w-[0.74em] translate-y-[0.05em]">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-full w-full drop-shadow-[0_0_7px_rgba(217,70,239,0.75)]"
          aria-hidden="true"
        >
          <rect
            x="3.4"
            y="3.4"
            width="17.2"
            height="17.2"
            rx="5.6"
            transform="rotate(12 12 12)"
            fill="url(#logo-tag)"
          />
          {/* furo da etiqueta */}
          <circle cx="9" cy="9" r="2.05" fill="#0a0f1a" />
          {/* brilho */}
          <path d="M6.5 14.5 14.5 6.5" stroke="rgba(255,255,255,0.45)" strokeWidth="1.1" strokeLinecap="round" />
          <defs>
            <linearGradient id="logo-tag" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f5a8ff" />
              <stop offset="1" stopColor="#d019e8" />
            </linearGradient>
          </defs>
        </svg>
      </span>
      <span className="text-zinc-900 dark:text-white">m</span>
    </span>
  );
}
