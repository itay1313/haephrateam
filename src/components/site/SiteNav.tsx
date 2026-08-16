"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/tree", label: "עץ המשפחה" },
  { href: "/contribute", label: "הוספה" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line-strong)] bg-paper">
      <div className="flex items-center justify-between gap-6 px-5 py-3.5 md:px-10">
        <Link href="/" className="text-base font-medium md:text-lg">
          משפחת האפרתי
        </Link>
        <nav className="flex items-center gap-5 md:gap-8">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm md:text-base ${
                pathname === link.href
                  ? "border-b border-ink pb-0.5"
                  : "border-b border-ink/35 pb-0.5 hover:border-ink"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
