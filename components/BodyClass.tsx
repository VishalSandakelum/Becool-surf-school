"use client";

import { useEffect } from "react";

type Props = { className: string };

/**
 * Sets document.body.className to match the original WordPress export so
 * Astra/Elementor CSS that targets specific body classes still applies.
 */
export default function BodyClass({ className }: Props) {
  useEffect(() => {
    const previous = document.body.className;
    document.body.className = className;
    return () => {
      document.body.className = previous;
    };
  }, [className]);

  return null;
}
