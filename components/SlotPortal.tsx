"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Props = {
  /** CSS selector for the placeholder div left in the page HTML by PageShell. */
  target: string;
  children: ReactNode;
};

/**
 * Mounts a client component into a placeholder div inside the dangerouslySet
 * page HTML. We use this instead of splitting the HTML around the slot,
 * because slicing mid-tree leaves unbalanced div tags that the browser's
 * HTML parser auto-closes — producing a DOM that doesn't match React's
 * virtual tree and triggers a hydration mismatch.
 *
 * The placeholder is empty in the server-rendered HTML, so there's a brief
 * (~50 ms) flash of empty space before the React component appears. For the
 * contact form on Book Now this is acceptable; we don't want anything
 * SEO-critical going through this path.
 */
export default function SlotPortal({ target, children }: Props) {
  const [el, setEl] = useState<Element | null>(null);
  useEffect(() => {
    setEl(document.querySelector(target));
  }, [target]);
  if (!el) return null;
  return createPortal(children, el);
}
