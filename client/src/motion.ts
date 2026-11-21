import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let lenis: Lenis | undefined;

/** Lenis smooth scrolling driven by GSAP's ticker so ScrollTrigger stays in sync. */
export function initSmoothScroll(): () => void {
  if (prefersReducedMotion()) return () => {};
  lenis = new Lenis({ lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return () => {
    gsap.ticker.remove(tick);
    lenis?.destroy();
    lenis = undefined;
  };
}

/** Scrolls to an element, respecting reduced motion and moving focus for screen readers. */
export function scrollToSection(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: -72 });
  else el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  el.focus({ preventScroll: true });
}

export { gsap, ScrollTrigger };
