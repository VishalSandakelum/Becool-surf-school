import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import variants from "./src/image-variants.json";

// Match every public image we might want to swap formats on. Excludes Next's
// internal asset pipeline and our API routes.
export const config = {
  matcher: ["/((?!_next/|api/|favicon.ico).*\\.(?:jpe?g|png|webp))"],
};

type Variant = { webp: boolean; avif: boolean };
const VARIANTS = variants as Record<string, Variant | undefined>;

/**
 * Serve the smallest format the browser advertises support for. The Place-
 * holder + cost of doing this in middleware:
 *
 *  - We do an O(1) lookup against the build-time manifest to decide whether
 *    a companion exists. No HEAD probe, no extra round trip.
 *  - We pick AVIF first (typically ~25% smaller than WebP), then WebP, then
 *    fall through to the original. The browser tells us which it accepts in
 *    the Accept header.
 *  - `Vary: Accept` is set so CloudFront caches one entry per format.
 */
export function middleware(req: NextRequest) {
  const accept = req.headers.get("accept") || "";
  const pathname = req.nextUrl.pathname;
  const variant = VARIANTS[pathname];
  if (!variant) return NextResponse.next();

  let targetExt: ".avif" | ".webp" | null = null;
  if (variant.avif && accept.includes("image/avif")) {
    targetExt = ".avif";
  } else if (
    variant.webp &&
    !pathname.endsWith(".webp") &&
    accept.includes("image/webp")
  ) {
    targetExt = ".webp";
  }
  if (!targetExt) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = pathname + targetExt;
  const res = NextResponse.rewrite(url);
  res.headers.set("Vary", "Accept");
  return res;
}
