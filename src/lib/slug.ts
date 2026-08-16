import { randomBytes } from "crypto";

/**
 * Slugs keep Hebrew letters (they read better in the URL bar than transliteration)
 * but drop anything that would break a path: spaces, slashes, punctuation.
 */
export function slugify(...parts: (string | null | undefined)[]) {
  const base = parts
    .filter(Boolean)
    .join(" ")
    .normalize("NFC")
    .replace(/["'’`]/g, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const suffix = randomBytes(3).toString("hex");
  return base ? `${base}-${suffix}` : suffix;
}
