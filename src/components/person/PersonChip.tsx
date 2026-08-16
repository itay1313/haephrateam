import Link from "next/link";
import { Portrait } from "./Portrait";

export function PersonChip({
  href,
  name,
  storageKey,
  meta,
}: {
  href: string;
  name: string;
  storageKey?: string | null;
  meta?: string | null;
}) {
  return (
    <Link href={href} className="group block cursor-pointer">
      <div className="overflow-hidden">
        <Portrait name={name} storageKey={storageKey} className="transition-opacity duration-300 group-hover:opacity-90" />
      </div>
      <div className="mt-3 font-display text-xl leading-tight">{name}</div>
      {meta ? <div className="mt-1 text-sm text-muted">{meta}</div> : null}
    </Link>
  );
}
