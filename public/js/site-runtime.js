/*!
 * Be Cool Surf School — minimal site runtime.
 *
 * Replaces the 1.2-2 MB Elementor + jQuery + Swiper bundle that the
 * WordPress export shipped, by reimplementing only the runtime features
 * the static markup actually depends on:
 *
 *   1. Mobile menu toggle ............ click .elementor-menu-toggle
 *   2. Background slideshow .......... data-settings → background_slideshow_*
 *   3. Reveal animation .............. .elementor-invisible → .elementor-visible
 *
 * Everything else (Lottie, Swiper for galleries, Element-Pack widgets, the
 * Buttonizer floating-button loader, LiteSpeed instant-click) is dropped
 * because the markup we ship doesn't use those widgets.
 *
 * No dependencies. ~3 KB minified. Self-initialises on DOMContentLoaded.
 */
(function () {
  "use strict";

  // ── First-load init ────────────────────────────────────────────────────
  // Runs once. Includes the setup that registers document-level listeners
  // and MutationObservers (initWrapperLinks, initPageNavigationFixes), which
  // would stack duplicates if called again.
  function initOnce() {
    initMobileMenu();
    initSlideshows();
    initRevealAnimations();
    initWrapperLinks();
    initPageNavigationFixes();
    initAccordions();
    initDynamicYear();
  }

  // ── Per-route refresh ──────────────────────────────────────────────────
  // ClientNavInterceptor calls this after a Next.js soft navigation, when
  // React has replaced the page body. Re-runs only the per-element binders
  // (each guards via dataset markers so re-running is safe and cheap). The
  // document-level click/keydown delegates and MutationObserver registered
  // in initOnce keep working across navigations, so they aren't repeated.
  function refresh() {
    initMobileMenu();
    initSlideshows();
    initRevealAnimations();
    initAccordions();
    initDynamicYear();
  }

  window.__BCSS_INIT__ = refresh;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initOnce, { once: true });
  } else {
    initOnce();
  }

  function initAccordions() {
    document.querySelectorAll(".bdt-ep-accordion-item").forEach(function (item) {
      if (item.dataset.bcssAccordionBound) return;
      item.dataset.bcssAccordionBound = "1";
      
      var title = item.querySelector(".bdt-ep-accordion-title");
      if (!title) return;
      
      title.addEventListener("click", function () {
        var isOpen = item.classList.contains("bcss-is-open");
        // Close all items (multiple: false behavior)
        var container = item.closest(".bdt-ep-accordion-container");
        if (container) {
          container.querySelectorAll(".bdt-ep-accordion-item").forEach(function (acc) {
            acc.classList.remove("bcss-is-open");
          });
        }
        
        if (!isOpen) {
          item.classList.add("bcss-is-open");
        }
      });
    });
  }

  function initDynamicYear() {
    var year = new Date().getFullYear();
    document.querySelectorAll(".bcss-current-year").forEach(function(el) {
      el.textContent = year;
    });
  }

  /* ── 1. Mobile menu ──────────────────────────────────────────────────── */
  /* Elementor's per-page CSS already wires up everything:
   *
   *   .elementor-menu-toggle.elementor-active +
   *     .elementor-nav-menu__container { transform:scaleY(1); max-height:… }
   *   .elementor-menu-toggle.elementor-active .elementor-menu-toggle__icon--open,
   *   .elementor-menu-toggle:not(.elementor-active) .elementor-menu-toggle__icon--close
   *     { display:none }
   *
   * So we only need to toggle the `.elementor-active` class on the button —
   * the CSS handles both the dropdown reveal animation and the ☰ ↔ ✕ icon
   * swap. aria-* attributes are updated for accessibility too. */
  function initMobileMenu() {
    document.querySelectorAll(".elementor-menu-toggle").forEach(function (btn) {
      if (btn.dataset.bcssBound) return;
      btn.dataset.bcssBound = "1";
      btn.setAttribute("role", "button");
      btn.setAttribute("aria-expanded", "false");
      btn.addEventListener("click", function () {
        var willOpen = !btn.classList.contains("elementor-active");
        btn.classList.toggle("elementor-active", willOpen);
        btn.setAttribute("aria-expanded", String(willOpen));
        // The dropdown is the immediate next sibling (matches the CSS
        // `.elementor-menu-toggle.elementor-active + .elementor-nav-menu__container`
        // selector). Keep its aria-hidden in sync for screen readers.
        var dropdown = btn.nextElementSibling;
        if (
          dropdown &&
          dropdown.classList.contains("elementor-nav-menu--dropdown")
        ) {
          dropdown.setAttribute("aria-hidden", String(!willOpen));
          if (willOpen) {
            // The per-page CSS sets the dropdown to `position: absolute`,
            // which resolves against the nearest positioned ancestor (the
            // narrow nav-widget container) — NOT the viewport. So
            // width:100vw + left:0 doesn't span the screen on mobile.
            // Override with inline `position: fixed`, anchored at the
            // toggle's bottom edge, full viewport width.
            var rect = btn.getBoundingClientRect();
            dropdown.style.position = "fixed";
            dropdown.style.top = rect.bottom + "px";
            dropdown.style.left = "0";
            dropdown.style.right = "0";
            dropdown.style.width = "100vw";
            dropdown.style.maxWidth = "100vw";
            dropdown.style.maxHeight = "calc(100vh - " + rect.bottom + "px)";
            dropdown.style.overflowY = "auto";
            dropdown.style.zIndex = "9997";
          } else {
            // Clear only the properties we set so the closed-state CSS
            // (max-height:0 + transform:scaleY(0)) animates back in.
            [
              "position",
              "top",
              "left",
              "right",
              "width",
              "maxWidth",
              "maxHeight",
              "overflowY",
              "zIndex",
            ].forEach(function (p) {
              dropdown.style[p] = "";
            });
          }
        }
        document.body.classList.toggle("bcss-menu-open", willOpen);
      });
    });

    // Close the menu when a nav link inside the dropdown is tapped, so the
    // overlay doesn't stay on top of the destination page during navigation.
    // Bound once per session (delegated on document) — guard so client-side
    // re-init doesn't stack duplicate listeners.
    if (!document.documentElement.dataset.bcssMenuCloseBound) {
      document.documentElement.dataset.bcssMenuCloseBound = "1";
      document.addEventListener("click", function (e) {
        var a =
          e.target.closest && e.target.closest(".elementor-nav-menu--dropdown a");
        if (!a) return;
        document
          .querySelectorAll(".elementor-menu-toggle.elementor-active")
          .forEach(function (btn) {
            btn.click();
          });
      });
    }
  }

  /* ── 2. Background slideshow ─────────────────────────────────────────── */
  function initSlideshows() {
    document.querySelectorAll("[data-settings]").forEach(function (el) {
      var settings = parseSettings(el.getAttribute("data-settings"));
      if (!settings || settings.background_background !== "slideshow") return;
      var gallery = settings.background_slideshow_gallery;
      if (!Array.isArray(gallery) || gallery.length === 0) return;

      // Apply the first slide synchronously so the LCP image paints immediately.
      applySlide(el, gallery[0].url);

      if (gallery.length === 1 || el.dataset.bcssSlideshow) return;
      el.dataset.bcssSlideshow = "1";

      var duration = Math.max(
        1500,
        Number(settings.background_slideshow_slide_duration) || 5000,
      );
      var transition = Math.max(
        150,
        Number(settings.background_slideshow_transition_duration) || 500,
      );
      var loop = settings.background_slideshow_loop !== "no";
      var i = 0;

      el.style.transition = "background-image " + transition + "ms ease-in-out";

      // Defer the first interval until the page is interactive — we don't want
      // to fire transitions during the LCP window.
      var startAt = window.requestIdleCallback || setTimeout;
      startAt(
        function () {
          setInterval(function () {
            i++;
            if (i >= gallery.length) {
              if (!loop) return;
              i = 0;
            }
            applySlide(el, gallery[i].url);
          }, duration);
        },
        { timeout: duration },
      );
    });
  }

  function applySlide(el, url) {
    el.style.backgroundImage = 'url("' + responsiveUrl(url) + '")';
    el.style.backgroundSize = el.style.backgroundSize || "cover";
    el.style.backgroundPosition =
      el.style.backgroundPosition || "center center";
    el.style.backgroundRepeat = "no-repeat";
  }

  /**
   * Swap a base image URL for the smallest pre-generated width variant that
   * still covers the viewport. Variants are emitted at build time and listed
   * in `window.__BCSS_RESPONSIVE__` (inlined by PageShell). The middleware
   * upgrades the chosen .webp to AVIF when the browser advertises support,
   * so we only need to pick the right width here.
   */
  function responsiveUrl(url) {
    var map = window.__BCSS_RESPONSIVE__;
    if (!map || !map[url]) return url;
    var widths = map[url];
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var target = Math.ceil(window.innerWidth * dpr);
    var pick = widths[widths.length - 1];
    for (var i = 0; i < widths.length; i++) {
      if (widths[i] >= target) {
        pick = widths[i];
        break;
      }
    }
    return url.replace(/(\.[^.]+)$/, "-" + pick + "$1");
  }

  function parseSettings(raw) {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  /* ── 3. Reveal-on-mount animations ───────────────────────────────────── */
  function initRevealAnimations() {
    var els = document.querySelectorAll(".elementor-invisible");
    if (els.length === 0) return;
    if (!("IntersectionObserver" in window)) {
      els.forEach(reveal);
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            reveal(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    els.forEach(function (el) {
      io.observe(el);
    });
  }

  function reveal(el) {
    el.classList.remove("elementor-invisible");
    var anim = el.getAttribute("data-settings");
    if (anim) {
      try {
        var parsed = JSON.parse(anim);
        if (parsed && parsed.animation) {
          el.classList.add("animated", parsed.animation);
        }
      } catch (e) {
        /* ignore */
      }
    }
  }

  /* ── 4. Element Pack wrapper-link clicks ─────────────────────────────── */
  /* The Services cards (and a few hero CTAs) carry a `data-ep-wrapper-link`
   * JSON blob that the WP "Element Pack Lite" plugin uses to make the whole
   * container clickable. Without that plugin's runtime nothing wires the
   * click handler, so the visible cursor:pointer hint is a lie.
   *
   * Implementation notes:
   *  - We use ONE document-level click listener and walk up via .closest()
   *    to find the wrapper. Per-element listeners would be lost the moment
   *    React replaces the dangerouslySetInnerHTML subtree (e.g. StrictMode
   *    double-mount in dev, or any hydration recovery), and the user would
   *    see "click does nothing" again.
   *  - A MutationObserver re-runs the cosmetic annotation pass so cards
   *    inserted later still get role/tabindex/cursor.
   *  - If the JSON URL still references becoolsrilanka.com (a page we
   *    haven't migrated yet), we strip the host so the link stays internal.
   */
  function initWrapperLinks() {
    annotateAll();
    if (window.MutationObserver) {
      new MutationObserver(annotateAll).observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    document.addEventListener("click", function (e) {
      var wrapper =
        e.target &&
        e.target.closest &&
        e.target.closest("[data-ep-wrapper-link]");
      if (!wrapper) return;
      // Don't hijack clicks on real interactive elements inside the card.
      if (e.target.closest("a, button, input, textarea, select, label")) return;

      var href = resolveHref(wrapper);
      if (!href) return;

      var settings = parseSettings(
        wrapper.getAttribute("data-ep-wrapper-link"),
      );
      e.preventDefault();
      if (settings && (settings.is_external || settings.target === "_blank")) {
        window.open(href, "_blank", "noopener");
      } else {
        window.location.href = href;
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var t = e.target;
      if (!t || !t.hasAttribute || !t.hasAttribute("data-ep-wrapper-link"))
        return;
      e.preventDefault();
      t.click();
    });
  }

  function annotateAll() {
    document.querySelectorAll("[data-ep-wrapper-link]").forEach(function (el) {
      if (el.dataset.bcssBound === "1") return;
      el.dataset.bcssBound = "1";
      el.setAttribute("role", "link");
      el.setAttribute("tabindex", "0");
      if (!el.style.cursor) el.style.cursor = "pointer";
    });
  }

  function resolveHref(wrapper) {
    var settings = parseSettings(wrapper.getAttribute("data-ep-wrapper-link"));
    if (!settings || !settings.url) return "";
    return String(settings.url).replace(/^https?:\/\/becoolsrilanka\.com/, "");
  }

  function initPageNavigationFixes() {
    // Run contact-link rewrite immediately, and re-run whenever the DOM
    // changes (Next.js soft-navigations replace the header HTML in-place).
    rewriteBookingContactLinks();
    if (window.MutationObserver) {
      new MutationObserver(function (mutations) {
        var hasRelevant = mutations.some(function (m) {
          return m.addedNodes.length > 0;
        });
        if (hasRelevant) {
          rewriteBookingContactLinks();
          initAccordions();
        }
      }).observe(document.body, { childList: true, subtree: true });
    }

    // Intercept footer link clicks:
    //  - If the link resolves to the current page → smooth-scroll to top
    //    instead of re-rendering (fixes same-page re-render on About page etc.)
    //  - Works regardless of which footer button is clicked.
    document.addEventListener("click", function (e) {
      if (e.defaultPrevented) return;
      var anchor = e.target && e.target.closest && e.target.closest("a[href]");
      if (!anchor) return;
      if (
        anchor.closest("footer") &&
        isSamePageHref(anchor.getAttribute("href"))
      ) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });

    function rewriteBookingContactLinks() {
      // Fix Contact links in the navbar that still point to the external
      // bookings sub-domain instead of our internal /book-now page.
      document
        .querySelectorAll('a[href^="https://bookings.becoolsrilanka.com"]')
        .forEach(function (anchor) {
          var menuItem = anchor.closest("li.menu-item-3134, .menu-item-3134");
          if (!menuItem) return;
          if (anchor.textContent && anchor.textContent.trim() === "Contact") {
            anchor.setAttribute("href", "/book-now");
          }
        });

      // Also catch Book Now navbar buttons that still point externally.
      // These share the same data-id across pages and only live in the header.
      document
        .querySelectorAll(
          'header a.elementor-button[href^="https://bookings.becoolsrilanka.com"]'
        )
        .forEach(function (anchor) {
          var text =
            anchor.textContent && anchor.textContent.trim().toLowerCase();
          if (text === "contact") {
            anchor.setAttribute("href", "/book-now");
          }
        });
    }
  }

  function isSamePageHref(href) {
    if (!href || href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0)
      return false;
    try {
      var url = new URL(href, window.location.href);
      return (
        url.origin === window.location.origin &&
        url.pathname === window.location.pathname
      );
    } catch (e) {
      return false;
    }
  }
})();
