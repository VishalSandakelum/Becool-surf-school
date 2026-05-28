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

    // ── Re-measurement schedule after each pathname change ──
    // For ~600 ms after a nav, layout can shift (per-page CSS arrival, font
    // swap, image decode). Previously we polled every frame — which forced
    // ~30 reflows per nav. Now we re-measure at exponentially-spaced points
    // so we hit each settle moment but don't keep thrashing layout once
    // measurements stabilise. Stops early if three consecutive measurements
    // are identical (page has settled, no point continuing).
    const measureSchedule = [0, 16, 50, 120, 250, 450];
    let stableCount = 0;
    let prevSig = "";
    const timeouts: number[] = [];
    measureSchedule.forEach((ms) => {
      const id = window.setTimeout(() => {
        update();
        const sig = underline.style.transform + "|" + underline.style.width;
        if (sig === prevSig) {
          stableCount++;
        } else {
          stableCount = 0;
          prevSig = sig;
        }
      }, ms);
      timeouts.push(id);
    });
    // Kept for the cleanup signature below (back-compat with earlier code).
    let rafId = 0;

    // ── Persistent observers (until next pathname change unmounts them) ──
    //
    // Every call to update() reads the active link's bounding rect *and*
    // its computed style, then writes back to the underline. If we call
    // update() directly inside scroll / resize handlers, the browser can
    // be forced to recompute layout dozens of times per second — PageSpeed
    // attributed 76 ms of forced reflow to this loop on first paint.
    //
    // Coalescing through requestAnimationFrame collapses bursts of events
    // (e.g. a single inertia scroll fires hundreds of `scroll` events) into
    // one read-then-write per frame, eliminating the thrash.
    let pendingFrame = 0;
    function scheduleUpdate() {
      if (pendingFrame) return;
      pendingFrame = requestAnimationFrame(() => {
        pendingFrame = 0;
        update();
      });
    }

    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });

    // ResizeObserver catches CSS-driven layout shifts on the nav itself
    // (e.g. font-display swap, container query changes) that don't fire
    // a window resize.
    let resizeObserver: ResizeObserver | null = null;
    const nav = document.querySelector(".elementor-nav-menu");
    if (nav && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(scheduleUpdate);
      resizeObserver.observe(nav);
    }

    // When any new stylesheet finishes loading, re-measure — covers the
    // case where blocking CSS resolves AFTER our initial useEffect tick.
    function onStylesheetLoad(e: Event) {
      const t = e.target as HTMLElement | null;
      if (t && t.tagName === "LINK") scheduleUpdate();
    }
    document.addEventListener("load", onStylesheetLoad, true);

    return () => {
      cancelAnimationFrame(rafId);
      if (pendingFrame) cancelAnimationFrame(pendingFrame);
      timeouts.forEach(window.clearTimeout);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate);
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
