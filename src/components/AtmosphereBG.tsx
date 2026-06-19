"use client";

import { useEffect, useRef } from "react";

/**
 * Fundo atmosférico sutil (motion.md §6a): "poeira de papel" que deriva devagar
 * atrás do conteúdo. Barato (Canvas), respeita prefers-reduced-motion e pausa
 * quando a aba está oculta. Cor adapta ao tema (claro no preto, escuro no kraft).
 */
export function AtmosphereBG() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const dark = document.documentElement.classList.contains("dark");
    const rgb = dark ? "245,243,234" : "27,26,23"; // creme no preto / tinta no kraft

    let w = 0;
    let h = 0;
    let raf = 0;
    const N = 90;
    const dots = Array.from({ length: N }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00028,
      vy: (Math.random() - 0.5) * 0.00028,
      r: Math.random() * 1.7 + 0.5,
      a: Math.random() * 0.11 + 0.04,
    }));

    const resize = () => {
      w = cv.width = window.innerWidth;
      h = cv.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        d.x = (d.x + d.vx + 1) % 1;
        d.y = (d.y + d.vy + 1) % 1;
        ctx.fillStyle = `rgba(${rgb},${d.a})`;
        ctx.beginPath();
        ctx.arc(d.x * w, d.y * h, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    frame();

    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) frame();
    }
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10" />;
}
