"use client";

import { useEffect, useRef } from "react";

/**
 * Partículas azul-claras (cor do cupom luminoso do hero) flutuando DE LEVE em
 * volta dele. Canvas leve, confinado a uma nuvem elíptica em torno do centro do
 * símbolo; cintilam e derivam devagar. Respeita prefers-reduced-motion e pausa
 * com a aba oculta.
 */
export function HeroParticles() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    // centro aproximado do cupom luminoso na imagem (fração da caixa do hero)
    const CX = 0.47;
    const CY = 0.4;

    let w = 0;
    let h = 0;
    let raf = 0;

    const parts = Array.from({ length: 34 }, () => ({
      ang: Math.random() * Math.PI * 2,
      dist: 0.2 + Math.random() * 0.8, // 0..1 do raio da nuvem
      sp: (Math.random() * 0.5 + 0.2) * 0.0009 * (Math.random() < 0.5 ? -1 : 1),
      sz: Math.random() * 2 + 0.8,
      tw: Math.random() * 0.02 + 0.006,
      ph: Math.random() * Math.PI * 2,
    }));

    const resize = () => {
      const box = cv.parentElement?.getBoundingClientRect();
      const cw = box && box.width ? box.width : window.innerWidth;
      const ch = box && box.height ? box.height : window.innerHeight;
      w = cv.width = Math.min(4096, Math.floor(cw * dpr));
      h = cv.height = Math.min(4096, Math.floor(ch * dpr));
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const cx = w * CX;
      const cy = h * CY;
      const rx = w * 0.12;
      const ry = h * 0.17;
      ctx.shadowColor = "rgba(120,221,238,.9)";
      ctx.shadowBlur = 6 * dpr;
      for (const p of parts) {
        p.ang += p.sp;
        p.ph += p.tw;
        const x = cx + Math.cos(p.ang) * rx * p.dist;
        const y = cy + Math.sin(p.ang) * ry * p.dist;
        const fade = 1 - 0.7 * p.dist; // mais perto do centro = mais visível
        const tw = 0.45 + 0.55 * Math.sin(p.ph);
        const alpha = 0.6 * fade * tw;
        if (alpha <= 0.02) continue;
        ctx.beginPath();
        ctx.arc(x, y, p.sz * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(150,228,242,${alpha})`; // ciano claro do cupom
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    };

    const frame = () => {
      draw();
      raf = requestAnimationFrame(frame);
    };
    if (reduce) draw();
    else frame();

    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduce) frame();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 z-[4]" />;
}
