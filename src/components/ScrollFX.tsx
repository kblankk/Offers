"use client";

import { useEffect } from "react";

/**
 * Motion confiável (motion.md): parallax via JS (transform no scroll, funciona
 * em qualquer navegador) + scroll-reveal via IntersectionObserver. Respeita
 * prefers-reduced-motion.
 *  - elementos com [data-parallax="0.2"] deslocam por scrollY * fator
 *  - elementos com [data-reveal] sobem/aparecem ao entrar na viewport
 */
export function ScrollFX() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---- Scroll-reveal ----
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    const observeAll = () =>
      document.querySelectorAll("[data-reveal]:not(.is-in)").forEach((el) => io.observe(el));
    observeAll();
    // cards entram de forma assíncrona (fetch) — observa os novos
    const mo = new MutationObserver(observeAll);
    mo.observe(document.body, { childList: true, subtree: true });

    // ---- Parallax ----
    const layers = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));
    let raf = 0;
    const apply = () => {
      const y = window.scrollY;
      for (const el of layers) {
        const sp = parseFloat(el.dataset.parallax || "0");
        el.style.transform = `translate3d(0, ${(y * sp).toFixed(1)}px, 0)`;
      }
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    if (!reduce && layers.length) {
      apply();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    return () => {
      io.disconnect();
      mo.disconnect();
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return null;
}
