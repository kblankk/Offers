"use client";

import { useEffect } from "react";

/**
 * Motion confiável e À PROVA DE FALHA (motion.md):
 *  - Parallax via JS (transform no scroll).
 *  - Scroll-reveal baseado no PRÓPRIO scroll (sem IntersectionObserver, que se
 *    mostrou instável): só esconde (.pre) o que está abaixo da dobra e remove
 *    .pre assim que o elemento entra na tela. Conteúdo já visível nunca some.
 *  - Rede de segurança: revela tudo após 3.5s, aconteça o que acontecer.
 * Respeita prefers-reduced-motion.
 */
export function ScrollFX() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const VH = () => window.innerHeight;

    // marca e esconde apenas o que está abaixo da dobra
    const prep = () => {
      document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-fx])").forEach((el) => {
        el.dataset.fx = "1";
        if (el.getBoundingClientRect().top > VH() * 0.92) el.classList.add("pre");
      });
    };
    prep();
    const mo = new MutationObserver(prep);
    mo.observe(document.body, { childList: true, subtree: true });

    const layers = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));
    let raf = 0;
    const tick = () => {
      const y = window.scrollY;
      for (const el of layers) {
        const sp = parseFloat(el.dataset.parallax || "0");
        el.style.transform = `translate3d(0, ${(y * sp).toFixed(1)}px, 0)`;
      }
      // revela o que já entrou na tela
      document.querySelectorAll<HTMLElement>(".pre").forEach((el) => {
        if (el.getBoundingClientRect().top < VH() * 0.92) el.classList.remove("pre");
      });
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    tick(); // estado inicial (parallax + revela in-view)
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    // rede de segurança: nada fica invisível para sempre
    const safety = window.setTimeout(() => {
      document.querySelectorAll(".pre").forEach((el) => el.classList.remove("pre"));
    }, 3500);

    return () => {
      mo.disconnect();
      clearTimeout(safety);
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return null;
}
