"use client";

import { useEffect, useRef } from "react";

type Props = { html: string };

/**
 * Renders raw HTML and re-executes any <script> tags inside it after mount.
 * Browsers ignore <script> elements created via innerHTML, so we replace each
 * with a freshly-created <script> node — but only ONCE per script element,
 * marked with data-executed, so React StrictMode's double-effect in dev (and
 * future re-renders) don't re-run scripts that declare top-level globals.
 */
export default function HtmlContent({ html }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const hasExecuted = useRef(false);

  useEffect(() => {
    const root = ref.current;
    if (!root || hasExecuted.current) return;
    hasExecuted.current = true;

    const oldScripts = Array.from(root.querySelectorAll("script"));
    for (const oldScript of oldScripts) {
      if (oldScript.dataset.executed === "1") continue;

      const newScript = document.createElement("script");
      for (const { name, value } of Array.from(oldScript.attributes)) {
        newScript.setAttribute(name, value);
      }
      newScript.dataset.executed = "1";
      newScript.text = oldScript.textContent ?? "";
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    }
  }, [html]);

  return (
    <div
      ref={ref}
      className="contents"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
