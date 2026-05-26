"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * The site nav lives inside the WordPress-imported HTML that PageShell injects
 * via dangerouslySetInnerHTML, so its <a href> tags are plain anchors — every
 * click triggers a full document reload, which makes route changes feel slow
 * even though Next.js could serve them as a client navigation in <100 ms.
 *
 * This component sits in the root layout, listens for clicks on any internal
 * <a>, and routes the navigation through Next.js's router instead. The
 * delegated listener covers every link on every page (including links
 * inserted later by client components) without per-link wiring.
 *
 * Bypasses (let the browser do its native thing):
 *   - Modifier keys (Ctrl/Cmd/Shift/Alt) and non-left clicks (new tab/window)
 *   - target="_blank" or non-_self
 *   - Cross-origin hrefs
 *   - download attribute
 *   - mailto:/tel:/javascript: and other non-http(s) protocols
 *   - data-no-router opt-out
 *   - The current route (no-op anyway, but skips a router push)
 */
export default function ClientNavInterceptor() {
  const router = useRouter();
  const pathname = usePathname();

  // After a client-side route change, two things need a nudge:
  //   1. The per-page stylesheet PageShell rendered with media="print" needs
  //      its media swapped to "all" once it has loaded. The inline swap
  //      script that runs on first paint doesn't execute on SPA navigation
  //      because React doesn't run script content it inserts at runtime.
  //   2. site-runtime.js bound mobile menu / slideshow / reveal handlers on
  //      first load — the new page's DOM nodes need a second pass.
  useEffect(() => {
    document
      .querySelectorAll<HTMLLinkElement>('link[data-bcss-css][media="print"]')
      .forEach((link) => {
        const swap = () => {
          link.media = "all";
        };
        if (link.sheet) swap();
        else link.addEventListener("load", swap, { once: true });
      });
    window.__BCSS_INIT__?.();
  }, [pathname]);

  useEffect(() => {
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

      // Skip hash-only links (same-page anchors) — let the browser handle them.
      if (href.startsWith("#")) return;
      // Skip non-navigational protocols.
      if (/^(mailto:|tel:|sms:|javascript:|data:)/i.test(href)) return;

      let url: URL;
      try {
        url = new URL(anchor.href);
      } catch {
        return;
      }

      // Cross-origin → native navigation (browser handles).
      if (url.origin !== window.location.origin) return;

      const path = url.pathname + url.search + url.hash;
      const here =
        window.location.pathname + window.location.search + window.location.hash;
      if (path === here) {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      router.push(path);
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [router]);

  return null;
}
