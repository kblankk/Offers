"use client";

import { useEffect, useRef } from "react";

/**
 * Animação temática: CUPONS CAINDO como folhas (o hero é uma floresta).
 * Pequenas etiquetas/tickets descem balançando e girando, em tinta vermelha,
 * preto e creme. Canvas leve, sem dependência. Aparece nas frestas do "board"
 * (os cards de papel cobrem o resto). Respeita prefers-reduced-motion e pausa
 * quando a aba está oculta.
 */
const COLORS = ["#c0392b", "#c0392b", "#1b1a17", "#f7f3ea", "#c0392b"];

export function AtmosphereBG() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    let w = 0;
    let h = 0;
    let raf = 0;

    type Ticket = {
      x: number;
      y: number;
      s: number; // tamanho
      vy: number; // queda
      sway: number; // amplitude do balanço
      ph: number; // fase
      rot: number;
      vrot: number;
      color: string;
      alpha: number;
    };

    const N = 34;
    const make = (top = false): Ticket => ({
      x: Math.random() * (w || window.innerWidth * dpr),
      y: top ? -20 * dpr : Math.random() * (h || window.innerHeight * dpr),
      s: (14 + Math.random() * 16) * dpr,
      vy: (0.22 + Math.random() * 0.5) * dpr,
      sway: (10 + Math.random() * 20) * dpr,
      ph: Math.random() * Math.PI * 2,
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 0.025,
      color: COLORS[(Math.random() * COLORS.length) | 0]!,
      alpha: 0.38 + Math.random() * 0.32,
    });

    const resize = () => {
      const box = cv.parentElement?.getBoundingClientRect();
      const cw = box && box.width ? box.width : window.innerWidth;
      const ch = box && box.height ? box.height : window.innerHeight;
      // clamp de seguranca contra qualquer dimensao absurda
      w = cv.width = Math.min(4096, Math.max(1, Math.floor(cw * dpr)));
      h = cv.height = Math.min(4096, Math.max(1, Math.floor(ch * dpr)));
    };
    resize();
    window.addEventListener("resize", resize);

    let tickets = Array.from({ length: N }, () => make(false));

    // desenha uma etiqueta (ticket) com furo, centrada em 0,0
    const drawTicket = (t: Ticket) => {
      const w0 = t.s;
      const h0 = t.s * 0.66;
      const r = t.s * 0.16;
      ctx.globalAlpha = t.alpha;
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.roundRect(-w0 / 2, -h0 / 2, w0, h0, r);
      ctx.fill();
      // furo (cor "vazada")
      ctx.globalCompositeOperation = "destination-out";
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(-w0 / 2 + h0 * 0.38, 0, t.s * 0.09, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    };

    let time = 0;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      time += 0.016;
      for (const t of tickets) {
        t.y += t.vy;
        t.rot += t.vrot;
        const x = t.x + Math.sin(time * 0.8 + t.ph) * t.sway;
        if (t.y - t.s > h) {
          t.y = -t.s;
          t.x = Math.random() * w;
        }
        ctx.save();
        ctx.translate(x, t.y);
        ctx.rotate(t.rot);
        drawTicket(t);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    };

    const frame = () => {
      draw();
      raf = requestAnimationFrame(frame);
    };

    if (reduce) {
      // estático: alguns tickets parados, sem animação
      tickets = Array.from({ length: 12 }, () => make(false));
      draw();
    } else {
      frame();
    }

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

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0" />;
}
