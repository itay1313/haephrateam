"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteMark() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <Link
      href="/"
      className="fixed top-5 right-5 z-40 text-sm text-ink/70 transition-colors hover:text-ink"
    >
      משפחת האפרתי
    </Link>
  );
}
