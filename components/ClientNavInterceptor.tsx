"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * The site nav lives inside the WordPress-imported HTML that PageShell injects
 * via dangerouslySetInnerHTML, so its <a href> tags are plain anchors — every
 * click triggers a full document reload, which makes route changes feel slow
 * even though Next.js could serve them as a client navigation in <100 ms.
 *
 * This component sits in the root layout and does three things:
 *
 *   1. Intercepts internal link clicks and re-routes them through Next.js's
 *      client-side router. No full-page reload, no flash.
 *
 *   2. Prefetches RSC payload and per-page CSS for every route on idle
 *      (once the first page is interactive), and again on hover/focus of
 *      any internal link. With the CSS already in the HTTP cache, the
 *      destination page's blocking <link> resolves with zero RTT — no
 *      flash of unstyled content on click.
 *
 *   3. Re-runs site-runtime.js's per-element binders after each soft nav so
 *      the mobile menu / slideshow / accordions wire up to the new DOM.
 *
 * Note: we DON'T use the View Transitions API or any page-level fade/slide
 * here. The previous iteration's snapshot-based crossfade made navigation
 * feel like a "screenshot freeze" and the template fade-up looked like the
 * page was sliding in from below. The "solid app" feel comes from instant
 * content swap (CSS already cached → no FOUC) plus the sliding nav
 * underline as the single visual signal that the route changed.
 *
 * Bypasses (let the browser do its native thing):
 *   - Modifier keys (Ctrl/Cmd/Shift/Alt) and non-left clicks
 *   - target="_blank" or non-_self
 *   - Cross-origin hrefs
 *   - download attribute
 *   - mailto:/tel:/javascript: and other non-http(s) protocols
 *   - data-no-router opt-out
 *   - The current route (skips a router push)
 */

const ALL_ROUTE_SLUGS = [
  "home",
  "about",
  "package",
  "services",
  "book-now",
  "advanced-surf-lessons",
  "beginner-surf-lessons",
  "intermediate-surf-lesson",
  "private-surfing-lessons",
  "group-surfing-packages",
  "board-rent",
];
const KNOWN_SLUGS = new Set(ALL_ROUTE_SLUGS);
const prefetched = new Set<string>();

function pathToSlug(path: string): string {
  return path === "/" ? "home" : path.replace(/^\/+|\/+$/g, "");
}

function prefetchPath(path: string) {
  if (prefetched.has(path)) return;
  prefetched.add(path);
  const slug = pathToSlug(path);
  // Only emit a CSS prefetch for slugs we actually ship — otherwise stray
  // typo'd links in imported content (e.g. an old WordPress button pointing
  // to `/service`) make us request `/css/service.css` and get a 404 in the
  // console. We still let router.prefetch attempt the RSC fetch in the
  // caller — if the route is also missing it'll fail silently there.
  if (!KNOWN_SLUGS.has(slug)) return;
  const href = `/css/${slug}.css`;
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.as = "style";
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Wait for a stylesheet to be downloaded into the browser's HTTP cache before
 * resolving. Used in the click handler so that by the time we call
 * router.push the destination page's CSS is guaranteed cached — React's
 * subsequent <link rel="stylesheet"> for that file then resolves from cache
 * with zero RTT, eliminating the flash of unstyled content (the milliseconds
 * where the new page paints with browser-default styling because the
 * dynamically-inserted stylesheet hasn't finished loading yet).
 *
 * Implementation notes:
 *   - Uses `rel="preload"` not `rel="stylesheet"` so the CSS is fetched into
 *     cache without being *applied* to the currently-visible page. Applying
 *     mid-nav would flash the wrong styles on the outgoing page.
 *   - 600 ms timeout caps the wait. Slow network is preferable to a frozen
 *     click — better to FOUC than to feel unresponsive.
 *   - Reuses the existing <link rel="prefetch"> already in <head> from
 *     SSR or earlier hover-prefetch: if the link exists and its sheet is
 *     already populated, we resolve immediately.
 */
const cssLoadCache = new Map<string, Promise<void>>();
function ensureCssLoaded(href: string): Promise<void> {
  const cached = cssLoadCache.get(href);
  if (cached) return cached;

  const promise = new Promise<void>((resolve) => {
    // Already in <head> from SSR <link rel="prefetch">? Add a preload with
    // an onload listener to know when the fetch is actually complete.
    // Browsers dedupe identical URLs by HTTP cache, so this is cheap.
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "style";
    link.href = href;

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    link.addEventListener("load", finish, { once: true });
    link.addEventListener("error", finish, { once: true });
    document.head.appendChild(link);

    // Safety net — never block a click for more than 600 ms.
    setTimeout(finish, 600);
  });

  cssLoadCache.set(href, promise);
  return promise;
}

export default function ClientNavInterceptor() {
  const router = useRouter();
  const pathname = usePathname();

  // After a client-side route change, re-run site-runtime.js's per-element
  // binders so the new page's mobile menu / slideshow / accordions wire up.
  useEffect(() => {
    window.__BCSS_INIT__?.();
  }, [pathname]);

  // Idle-prefetch CSS + RSC payload for every route so subsequent navs
  // resolve their stylesheet from HTTP cache with zero render-block.
  useEffect(() => {
    const schedule =
      window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 200));
    const id = schedule(() => {
      for (const slug of ALL_ROUTE_SLUGS) {
        const path = slug === "home" ? "/" : `/${slug}`;
        prefetchPath(path);
        try {
          router.prefetch(path);
        } catch {
          /* prefetch can throw during HMR; safe to ignore */
        }
      }
    });
    return () => {
      if (window.cancelIdleCallback && typeof id === "number") {
        window.cancelIdleCallback(id);
      }
    };
  }, [router]);

  useEffect(() => {
    function maybePrefetch(anchor: HTMLAnchorElement) {
      if (anchor.dataset.noRouter !== undefined) return;
      const linkTarget = anchor.getAttribute("target");
      if (linkTarget && linkTarget !== "_self") return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (/^(mailto:|tel:|sms:|javascript:|data:)/i.test(href)) return;
      let url: URL;
      try {
        url = new URL(anchor.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      const path = url.pathname + url.search + url.hash;
      prefetchPath(path);
      try {
        router.prefetch(path);
      } catch {
        /* ignore */
      }
    }

    function onHover(e: Event) {
      const anchor = (e.target as Element | null)?.closest?.("a");
      if (anchor) maybePrefetch(anchor as HTMLAnchorElement);
    }

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = e.target as Element | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      if (anchor.hasAttribute("download")) return;
      if (anchor.dataset.noRouter !== undefined) return;

      const linkTarget = anchor.getAttribute("target");
      if (linkTarget && linkTarget !== "_self") return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      if (href.startsWith("#")) return;
      if (/^(mailto:|tel:|sms:|javascript:|data:)/i.test(href)) return;

      let url: URL;
      try {
        url = new URL(anchor.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;

      const path = url.pathname + url.search + url.hash;
      const here =
        window.location.pathname + window.location.search + window.location.hash;
      if (path === here) {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      navigate(path);
    }

    function navigate(path: string) {
      // The destination page's stylesheet is render-blocking when React
      // mounts the new PageShell, but ONLY for the initial HTML parse —
      // dynamically-inserted <link> elements don't reliably block paint on
      // SPA navigations, so the new DOM paints unstyled until the file
      // arrives. We sidestep that by ensuring the CSS is in HTTP cache
      // BEFORE we tell React to render the new page; the <link> React then
      // emits resolves from cache in zero RTT and the new content paints
      // already styled. With prefetching, the wait is usually near-zero.
      const slug = pathToSlug(path);
      if (KNOWN_SLUGS.has(slug)) {
        ensureCssLoaded(`/css/${slug}.css`).then(() => router.push(path));
      } else {
        router.push(path);
      }
    }

    document.addEventListener("click", onClick);
    document.addEventListener("pointerenter", onHover, true);
    document.addEventListener("focusin", onHover);

    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("pointerenter", onHover, true);
      document.removeEventListener("focusin", onHover);
    };
  }, [router]);

  return null;
}
