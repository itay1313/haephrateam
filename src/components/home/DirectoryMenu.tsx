"use client";

import Link from "next/link";
import { useState } from "react";

export type DirectoryItem = {
  href: string;
  label: string;
  description: string;
  meta: string;
  image?: string | null;
};

export function DirectoryMenu({ items }: { items: DirectoryItem[] }) {
  const [active, setActive] = useState(0);

  return (
    <div className="relative">
      <ul className="border-t border-[var(--line-strong)] xl:w-[70%]">
        {items.map((item, i) => (
          <li key={item.href} className="border-b border-[var(--line)]">
            <Link
              href={item.href}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              className="group grid grid-cols-[auto_1fr] items-baseline gap-x-5 gap-y-1 py-6 transition-colors md:grid-cols-[3.5rem_minmax(0,14rem)_1fr_auto] md:items-center md:py-7"
            >
              <span className="text-xs tabular-nums text-bronze md:text-sm">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-3xl font-medium leading-none transition-transform duration-300 group-hover:-translate-x-1 md:text-4xl">
                {item.label}
              </span>
              <span className="col-span-2 text-ink-soft md:col-span-1 md:text-[0.98rem]">
                {item.description}
              </span>
              <span className="col-span-2 text-sm text-muted md:col-span-1 md:justify-self-end">
                {item.meta}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Hover preview — desktop only, follows the active row */}
      <div className="pointer-events-none absolute end-0 top-0 hidden h-full w-[24%] xl:block">
        {items.map((item, i) =>
          item.image ? (
            <div
              key={item.href}
              className="absolute end-0 top-1/2 w-full -translate-y-1/2 transition-all duration-500"
              style={{
                opacity: active === i ? 1 : 0,
                transform: `translateY(calc(-50% + ${active === i ? 0 : 14}px))`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt="" className="aspect-[4/5] w-full object-cover" />
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}
