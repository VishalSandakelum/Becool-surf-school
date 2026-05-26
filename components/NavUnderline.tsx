"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Sliding active-page indicator for the nav menu.
 *
 * Elementor's stock `e--pointer-underline` paints a per-item underline that
 * appears on hover and stays put under the active item. Switching pages just
 * fades one out and another in — there's no horizontal travel that signals
 * "this is the same indicator, moving."
 *
 * This component injects a single absolutely-positioned underline into each
 * `.elementor-nav-menu` <ul>, then on mount + on every pathname change
 * measures the active link's position and slides the underline to it via a
 * CSS transform transition. The pairing visually links the previous active
 * tab to the new one and matches the "smooth tab indicator" pattern users
 * recognise from Material / iOS tab bars.
 */
export default function NavUnderline() {
  const pathname = usePathname();

  useEffect(() => {
    function update() {
      document
        .querySelectorAll<HTMLUListElement>(".elementor-nav-menu")
        .forEach((menu) => {
          ensureUnderline(menu);
          positionUnderline(menu);
        });
    }

    // rAF lets the new PageShell HTML mount + compute layout before we
    // measure. Without it the first read after a client navigation can
    // sometimes hit stale rects from the outgoing page.
    const raf = requestAnimationFrame(update);

    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
    };
  }, [pathname]);

  return null;
}

function ensureUnderline(menu: HTMLUListElement) {
  if (menu.querySelector(":scope > .bcss-nav-underline")) return;
  // The underline is absolute-positioned, so the menu needs a positioning
  // context. Most Elementor menus are already `position: relative`, but
  // promote any that aren't so the maths works either way.
  if (getComputedStyle(menu).position === "static") {
    menu.style.position = "relative";
  }
  const u = document.createElement("span");
  u.className = "bcss-nav-underline";
  u.setAttribute("aria-hidden", "true");
  menu.appendChild(u);
}

function positionUnderline(menu: HTMLUListElement) {
  const underline = menu.querySelector<HTMLSpanElement>(
    ":scope > .bcss-nav-underline"
  );
  if (!underline) return;

  const active =
    menu.querySelector<HTMLAnchorElement>(".elementor-item-active") ??
    menu.querySelector<HTMLAnchorElement>('[aria-current="page"]');

  if (!active) {
    // No active item on this menu (e.g. dropdown variant on a page where
    // none of its items match the route) — keep the underline hidden.
    underline.style.opacity = "0";
    return;
  }

  const menuRect = menu.getBoundingClientRect();
  const linkRect = active.getBoundingClientRect();
  const left = linkRect.left - menuRect.left;
  const width = linkRect.width;

  underline.style.opacity = "1";
  underline.style.transform = `translate3d(${left}px, 0, 0)`;
  underline.style.width = `${width}px`;
}
