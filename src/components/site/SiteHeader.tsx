"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { Role } from "@/lib/auth";

const LINKS = [
  { href: "/", label: "הבית" },
  { href: "/tree", label: "העץ" },
  { href: "/archive", label: "הארכיון" },
  { href: "/stories", label: "סיפורים" },
  { href: "/timeline", label: "ציר הזמן" },
  { href: "/generations", label: "דורות" },
  { href: "/search", label: "חיפוש" },
];

export function SiteHeader({
  user,
}: {
  user: { displayName: string | null; role: Role; email: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color:var(--paper)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-5 py-4 md:px-8">
        <Link href="/" className="shrink-0">
          <div className="text-xl font-medium leading-none md:text-2xl">
            משפחת האפרתי
          </div>
          <div className="mt-1 text-[10px] tracking-[0.28em] text-bronze">הארכיון המשפחתי</div>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-link"
              data-active={pathname === link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <form
            className="hidden md:block"
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
            }}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="חיפוש במשפחה"
              className="w-44 border-0 border-b border-[var(--line-strong)] bg-transparent px-0 py-1 text-sm md:w-56"
            />
          </form>
          <button
            type="button"
            className="cursor-pointer border border-[var(--line-strong)] px-3 py-1.5 text-sm text-ink transition-colors hover:bg-ink hover:text-cream"
            onClick={() => window.dispatchEvent(new Event("haephrati:add"))}
          >
            הוספה
          </button>
          <button
            type="button"
            className="hidden cursor-pointer text-xs text-muted lg:block"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/login");
              router.refresh();
            }}
          >
            יציאה
          </button>
          <button
            type="button"
            className="cursor-pointer lg:hidden"
            aria-label="תפריט"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="block h-px w-6 bg-ink" />
            <span className="mt-1.5 block h-px w-6 bg-ink" />
          </button>
        </div>
      </div>
      {open ? (
        <div className="border-t border-[var(--line)] px-5 py-4 lg:hidden">
          <div className="flex flex-col gap-3">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            <Link href="/search" onClick={() => setOpen(false)}>
              חיפוש
            </Link>
            <span className="text-sm text-muted">המשפחה</span>
          </div>
        </div>
      ) : null}
    </header>
  );
}
