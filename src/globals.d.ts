// Ambient globals set up by /js/site-runtime.js and inlined by PageShell.
// Lives in src/ (outside components/) so the declaration isn't pulled into
// any Client Component's module graph by Next.js's RSC compiler.
export {};

declare global {
  interface Window {
    /**
     * Set by site-runtime.js once initOnce() has bound document-level
     * listeners. ClientNavInterceptor calls this after each Next.js client
     * navigation so the runtime re-binds mobile menu / slideshow /
     * accordions on the new page's DOM.
     */
    __BCSS_INIT__?: () => void;
    /**
     * Inlined by PageShell on routes that have responsive hero variants.
     * Maps a base image URL to the widths available on disk; site-runtime.js
     * picks the smallest one that covers the viewport.
     */
    __BCSS_RESPONSIVE__?: Record<string, number[]>;
  }
}
