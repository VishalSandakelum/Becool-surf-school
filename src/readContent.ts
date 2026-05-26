import { readFileSync } from "node:fs";
import { join } from "node:path";

export type PageMeta = {
  title: string;
  description: string;
  bodyClass: string;
  externalScripts: string[];
};

const CONTENT_DIR = join(process.cwd(), "src", "page-content");

export function readPage(slug: string): { html: string; meta: PageMeta } {
  const html = readFileSync(join(CONTENT_DIR, `${slug}.html`), "utf8");
  const meta = JSON.parse(
    readFileSync(join(CONTENT_DIR, `${slug}.meta.json`), "utf8")
  ) as PageMeta;
  return { html, meta };
}
