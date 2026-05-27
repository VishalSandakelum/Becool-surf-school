"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Sliding active-page indicator for the desktop header nav.
 *
 * Earlier versions injected the underline as a child of the menu <ul>, but
 * that <ul> lives inside the WordPress-imported HTML that PageShell drops
 * via dangerouslySetInnerHTML — every soft nav rewrites the markup and
 * destroys the underline. Without a persistent DOM node there's nothing for
 * CSS transitions to interpolate against, so the slide always looked like a
 * width-from-zero growth (left → right) regardless of direction.
 *
 * This version renders the underline as a React-owned `<span>` mounted in
 * the root layout. The element survives every navigation; we just re-measure
 * the active link on each pathname change and update fixed-position coords.
 * Same DOM node + CSS transition = a real slide in both directions.
 *
 * Two subtle things this also handles:
 *
 *   1. **No grow-from-zero on first paint.** The CSS baseline has
 *      `width: 0, transform: translate3d(0, 0, 0)`. The very first
 *      measurement (initial mount) sets transition:none, applies the
 *      target coords, forces a reflow, then re-enables transition — so
 *      the underline appears at its starting tab with no animation. Every
 *      subsequent change is a true slide from old to new.
 *
 *   2. **Robust re-measurement.** Stylesheet load, image decode, font
 *      hinting and Elementor's own layout passes all settle at different
 *      moments after a soft nav. A single rAF call sometimes catches the
 *      active link mid-layout with width:0. We poll the position for
 *      ~500 ms, attach a ResizeObserver to the nav, and listen for new
 *      <link> load events — collectively that covers every settle path.
 */
export default function NavUnderline() {
  const pathname = usePathname();
  const underlineRef = useRef<HTMLSpanElement>(null);
  const hasMeasuredRef = useRef(false);

  useEffect(() => {
    const underline = underlineRef.current;
    if (!underline) return;

    let lastSig = "";

    function applyTarget(rect: DOMRect, color: string, animate: boolean) {
      if (!underline) return;
      const left = rect.left;
      const top = rect.bottom - 2;
      const width = rect.width;
      // Skip writes that wouldn't change anything — avoids restarting an
      // in-flight transition with the same end state.
      const sig = `${left.toFixed(1)},${top.toFixed(1)},${width.toFixed(1)},${color}`;
      if (sig === lastSig) return;
      lastSig = sig;

      if (!animate) {
        underline.style.transition = "none";
      }
      underline.style.background = color;
      underline.style.opacity = "1";
      underline.style.width = `${width}px`;
      underline.style.transform = `translate3d(${left}px, ${top}px, 0)`;
      if (!animate) {
        void underline.offsetWidth; // force a reflow before re-enabling
        underline.style.transition = "";
      }
    }

    function update() {
      if (!underline) return;
      const active = pickActiveLink();
      if (!active) {
        underline.style.opacity = "0";
        return;
      }
      const rect = active.getBoundingClientRect();
      if (rect.width < 2) return; // mid-layout; wait for next tick
      const color = getComputedStyle(active).color;
      const animate = hasMeasuredRef.current;
      applyTarget(rect, color, animate);
      hasMeasuredRef.current = true;
      document.body.classList.add("bcss-nav-enhanced");
    }

    // ── Aggressive re-measurement window after each pathname change ──
    // For ~500 ms after a nav, things shift: per-page CSS finishes loading,
    // fonts replace fallbacks, images decode. Re-measure every frame so
    // the underline stays glued to the active link through all of it.
    const start = performance.now();
    let rafId = 0;
    const tick = () => {
      update();
      if (performance.now() - start < 500) {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);

    // ── Persistent observers (until next pathname change unmounts them) ──
    function onResize() {
      update();
    }
    function onScroll() {
      update();
    }
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });

    // ResizeObserver catches CSS-driven layout shifts on the nav itself
    // (e.g. font-display swap, container query changes) that don't fire
    // a window resize.
    let resizeObserver: ResizeObserver | null = null;
    const nav = document.querySelector(".elementor-nav-menu");
    if (nav && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => update());
      resizeObserver.observe(nav);
    }

    // When any new stylesheet finishes loading, re-measure — covers the
    // case where blocking CSS resolves AFTER our initial useEffect tick.
    function onStylesheetLoad(e: Event) {
      const t = e.target as HTMLElement | null;
      if (t && t.tagName === "LINK") update();
    }
    document.addEventListener("load", onStylesheetLoad, true);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      resizeObserver?.disconnect();
      document.removeEventListener("load", onStylesheetLoad, true);
    };
  }, [pathname]);

  return (
    <span
      ref={underlineRef}
      className="bcss-nav-underline"
      aria-hidden="true"
    />
  );
}

/**
 * Find the active link in the **visible** nav. The page renders both a
 * desktop and a mobile-dropdown nav; pick whichever is visible so the
 * indicator lands on the right element.
 */
function pickActiveLink(): HTMLAnchorElement | null {
  const candidates = document.querySelectorAll<HTMLAnchorElement>(
    ".elementor-nav-menu .elementor-item-active, .elementor-nav-menu [aria-current='page']"
  );
  for (const a of candidates) {
    if (a.offsetParent !== null && a.offsetWidth > 0) return a;
  }
  return null;
}
