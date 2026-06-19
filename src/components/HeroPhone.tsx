/**
 * Mockup de celular para o lado direito do hero (baseado no design v2 do
 * Claude Design): card escuro inclinado + círculo amarelo + iPhone com 3 cupons
 * + dois cards flutuando ("usaram hoje" e "Cupom confirmado"). Decorativo
 * (pointer-events-none). Acento adaptado ao vermelho da marca (#c0392b).
 */
const RED = "#c0392b";

function MiniCoupon({ store, color, off, code }: { store: string; color: string; off: string; code: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 14, boxShadow: "0 2px 10px rgba(14,21,37,.06)" }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
        <span className="inline-flex items-center gap-[7px]" style={{ fontSize: 12, fontWeight: 600, color: "#3C4356" }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: color }} />
          {store}
        </span>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#127A4B", background: "#E7F7EF", padding: "2px 8px", borderRadius: 999 }}>
          Ativo
        </span>
      </div>
      <span className="display" style={{ fontWeight: 800, fontSize: 28, letterSpacing: "-.03em", color: "#0E1525" }}>
        {off}
      </span>
      <div className="flex items-center gap-2" style={{ marginTop: 10 }}>
        <div className="flex-1 font-mono" style={{ background: "#F4F6FB", borderRadius: 9, padding: "8px 10px", fontSize: 13, fontWeight: 500, color: "#0E1525" }}>
          {code}
        </div>
        <div style={{ background: RED, color: "#fff", fontWeight: 700, fontSize: 12, padding: "9px 14px", borderRadius: 9 }}>Copiar</div>
      </div>
    </div>
  );
}

export function HeroPhone() {
  return (
    <div className="pointer-events-none relative" style={{ width: 430, height: 560 }} aria-hidden="true">
      {/* card escuro inclinado atrás */}
      <div className="v2-reveal absolute" style={{ width: 412, height: 470, background: "#0E1525", borderRadius: 38, right: -18, top: 46 }} />
      {/* circulo amarelo */}
      <div className="v2-floatc absolute" style={{ width: 112, height: 112, borderRadius: "50%", background: "#FFD400", left: 18, bottom: 30, zIndex: 1 }} />

      {/* celular */}
      <div className="animate-fade-in absolute" style={{ left: 78, top: 8, zIndex: 2, width: 252 }}>
        <div style={{ background: "#0E1525", borderRadius: 44, padding: 9, boxShadow: "0 40px 80px -30px rgba(0,0,0,.6)" }}>
          <div className="relative overflow-hidden" style={{ background: "#F4F6FB", borderRadius: 36, height: 512 }}>
            {/* dynamic island */}
            <div className="absolute left-1/2 -translate-x-1/2" style={{ top: 10, width: 78, height: 22, background: "#0E1525", borderRadius: 999, zIndex: 5 }} />
            {/* conteudo do app */}
            <div style={{ padding: "44px 14px 18px", fontFamily: "var(--font-display)" }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
                <span style={{ fontWeight: 800, fontSize: 21, letterSpacing: "-.03em", color: "#0E1525" }}>allcupom</span>
                <span className="inline-flex items-center gap-[6px]" style={{ background: "#fff", borderRadius: 999, padding: "5px 11px", fontSize: 11, fontWeight: 600, color: "#0E1525", boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#19B36B" }} />
                  14 ativos
                </span>
              </div>
              <div className="font-mono" style={{ background: "#fff", borderRadius: 12, padding: "11px 13px", fontSize: 12, color: "#9AA1B2", boxShadow: "0 1px 3px rgba(0,0,0,.06)", marginBottom: 14 }}>
                ⌕ buscar cupom
              </div>
              <div className="flex flex-col gap-3">
                <MiniCoupon store="Mercado Livre" color="#FFE600" off="20% OFF" code="MELHOROFERTA" />
                <MiniCoupon store="Amazon" color="#FF9900" off="10% OFF" code="BRASILHOJE" />
                <MiniCoupon store="Shopee" color="#EE4D2D" off="R$20 OFF" code="CUP0N0M1A17" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* card flutuante: usaram hoje */}
      <div className="v2-float absolute flex items-center gap-[11px]" style={{ left: 0, top: 70, zIndex: 3, background: "#fff", borderRadius: 14, boxShadow: "0 16px 34px -14px rgba(14,21,37,.45)", padding: "12px 15px" }}>
        <div className="display flex items-center justify-center" style={{ width: 38, height: 38, borderRadius: 11, background: "#FFF3CC", fontWeight: 800, fontSize: 14, color: "#0E1525" }}>20%</div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0E1525" }}>MELHOROFERTA</div>
          <div style={{ fontSize: 11, color: "#19B36B", fontWeight: 600 }}>2.023 usaram hoje</div>
        </div>
      </div>

      {/* card flutuante: cupom confirmado */}
      <div className="v2-floatb absolute flex items-center gap-[9px]" style={{ right: -6, bottom: 92, zIndex: 3, background: "#fff", borderRadius: 14, boxShadow: "0 16px 34px -14px rgba(14,21,37,.45)", padding: "11px 15px" }}>
        <span className="flex items-center justify-center" style={{ width: 24, height: 24, borderRadius: "50%", background: "#E7F7EF", color: "#127A4B", fontSize: 13, fontWeight: 800 }}>✓</span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0E1525" }}>Cupom confirmado</span>
      </div>
    </div>
  );
}
