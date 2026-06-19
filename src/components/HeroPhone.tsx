/**
 * Mockup de celular no lado direito do hero — uma prévia do AllCupom na NOSSA
 * identidade (papel creme + tinta + vermelho), com cards flutuando. Decorativo
 * (pointer-events-none). Sem bola amarela / quadrado navy (não combinavam).
 */
const RED = "#c0392b";
const PAPER = "#f7f3ea";
const BOARD = "#ece7da";
const INK = "#1b1a17";

function MiniCoupon({ store, dot, off, code }: { store: string; dot: string; off: string; code: string }) {
  return (
    <div style={{ background: PAPER, borderRadius: 14, padding: 13, boxShadow: "0 1px 2px rgba(27,26,23,.06)", border: "1px solid rgba(27,26,23,.10)" }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 7 }}>
        <span className="inline-flex items-center gap-[7px] font-mono" style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: INK }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot }} />
          {store}
        </span>
        <span style={{ fontSize: 9.5, fontWeight: 700, color: "#127A4B", background: "#E7F7EF", padding: "2px 7px", borderRadius: 999 }}>Ativo</span>
      </div>
      <span className="display" style={{ fontWeight: 800, fontSize: 26, letterSpacing: "-.03em", color: "#161410" }}>{off}</span>
      <div style={{ height: 3, width: 26, background: RED, marginTop: 5, marginBottom: 10 }} />
      <div className="flex items-center gap-2">
        <div className="flex-1 font-mono" style={{ border: "1px dashed rgba(27,26,23,.28)", borderRadius: 8, padding: "7px 10px", fontSize: 12, fontWeight: 700, color: "#161410" }}>
          {code}
        </div>
        <div className="font-mono" style={{ background: INK, color: PAPER, fontWeight: 700, fontSize: 11, letterSpacing: ".04em", textTransform: "uppercase", padding: "8px 13px", borderRadius: 8 }}>Copiar</div>
      </div>
    </div>
  );
}

export function HeroPhone() {
  return (
    <div className="pointer-events-none relative" style={{ width: 360, height: 560 }} aria-hidden="true">
      {/* grounding sutil: brilho escuro borrado atras do celular (sem quadrado duro) */}
      <div className="v2-reveal absolute" style={{ left: 22, top: 60, width: 320, height: 430, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(0,0,0,.55), transparent)", filter: "blur(26px)", transform: "none" }} />

      {/* celular */}
      <div className="animate-fade-in absolute" style={{ left: 50, top: 6, zIndex: 2, width: 258 }}>
        <div style={{ background: INK, borderRadius: 46, padding: 9, boxShadow: "0 44px 90px -32px rgba(0,0,0,.75)" }}>
          <div className="relative overflow-hidden" style={{ background: BOARD, borderRadius: 38, height: 520 }}>
            {/* dynamic island */}
            <div className="absolute left-1/2 -translate-x-1/2" style={{ top: 11, width: 80, height: 22, background: INK, borderRadius: 999, zIndex: 5 }} />
            <div style={{ padding: "46px 13px 18px", fontFamily: "var(--font-display)" }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 13 }}>
                <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-.03em", color: INK }}>allcupom</span>
                <span className="inline-flex items-center gap-[6px]" style={{ background: PAPER, borderRadius: 999, padding: "5px 10px", fontSize: 10.5, fontWeight: 700, color: INK, border: "1px solid rgba(27,26,23,.1)" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#19B36B" }} />14 ativos
                </span>
              </div>
              <div className="font-mono" style={{ background: PAPER, borderRadius: 11, padding: "10px 12px", fontSize: 11.5, color: "#8a857a", border: "1px solid rgba(27,26,23,.1)", marginBottom: 13 }}>⌕ buscar cupom</div>
              <div className="flex flex-col gap-[11px]">
                <MiniCoupon store="Mercado Livre" dot="#E8C400" off="20% OFF" code="MELHOROFERTA" />
                <MiniCoupon store="Amazon" dot="#FF9900" off="10% OFF" code="BRASILHOJE" />
                <MiniCoupon store="Shopee" dot="#EE4D2D" off="R$20 OFF" code="CUP0N0M1A17" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* card flutuante: usaram hoje (papel/tinta) */}
      <div className="v2-float absolute flex items-center gap-[11px]" style={{ left: 0, top: 78, zIndex: 3, background: PAPER, borderRadius: 13, boxShadow: "0 16px 34px -14px rgba(0,0,0,.5)", border: "1px solid rgba(27,26,23,.1)", padding: "11px 14px" }}>
        <div className="display flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(192,57,43,.12)", fontWeight: 800, fontSize: 13, color: RED }}>20%</div>
        <div>
          <div className="font-mono" style={{ fontSize: 11.5, fontWeight: 700, color: INK }}>MELHOROFERTA</div>
          <div style={{ fontSize: 10.5, color: "#19B36B", fontWeight: 600 }}>2.023 usaram hoje</div>
        </div>
      </div>

      {/* card flutuante: cupom confirmado (papel/tinta) */}
      <div className="v2-floatb absolute flex items-center gap-[9px]" style={{ right: -10, bottom: 104, zIndex: 3, background: PAPER, borderRadius: 13, boxShadow: "0 16px 34px -14px rgba(0,0,0,.5)", border: "1px solid rgba(27,26,23,.1)", padding: "10px 14px" }}>
        <span className="flex items-center justify-center" style={{ width: 23, height: 23, borderRadius: "50%", background: "#E7F7EF", color: "#127A4B", fontSize: 12, fontWeight: 800 }}>✓</span>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: INK }}>Cupom confirmado</span>
      </div>
    </div>
  );
}
