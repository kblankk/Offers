/**
 * Moldura de "jornal" (letterpress): trilhos verticais discretos nas margens
 * laterais vazias, com texto rotacionado repetido + marcas de registro de
 * gráfica nos cantos. Puramente decorativo; só em telas largas (xl+), onde há
 * margem. Não atrapalha cliques (pointer-events-none).
 */
const RAIL = "✶ ALLCUPOM PRESS ✶ CUPONS VERIFICADOS ✶ TESTADOS, NÃO CHUTADOS ✶ ".repeat(8);

function Cross({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 14 14" className={`absolute h-3 w-3 text-[#1b1a17]/30 dark:text-white/15 ${className}`} aria-hidden="true">
      <path d="M7 0v14M0 7h14" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function PageFrame() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1] hidden select-none xl:block">
      {/* trilho esquerdo (lê de baixo pra cima) */}
      <div className="absolute inset-y-0 left-0 flex w-12 items-center justify-center overflow-hidden">
        <span
          className="whitespace-nowrap font-mono text-[10px] font-medium uppercase tracking-[0.35em] text-[#1b1a17]/25 dark:text-white/12"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          {RAIL}
        </span>
      </div>

      {/* trilho direito (lê de cima pra baixo) */}
      <div className="absolute inset-y-0 right-0 flex w-12 items-center justify-center overflow-hidden">
        <span
          className="whitespace-nowrap font-mono text-[10px] font-medium uppercase tracking-[0.35em] text-[#1b1a17]/25 dark:text-white/12"
          style={{ writingMode: "vertical-rl" }}
        >
          {RAIL}
        </span>
      </div>

      {/* marcas de registro nos quatro cantos */}
      <Cross className="left-3 top-3" />
      <Cross className="right-3 top-3" />
      <Cross className="bottom-3 left-3" />
      <Cross className="bottom-3 right-3" />
    </div>
  );
}
