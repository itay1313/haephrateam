import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { mediaUrl } from "@/lib/queries";
import { decadeLabel } from "@/lib/format";

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ decade?: string; person?: string }>;
}) {
  const { decade, person } = await searchParams;
  const selected = decade ? Number(decade) : null;

  const [stories, media, events, people] = await Promise.all([
    prisma.story.findMany({ include: { people: { include: { person: true } } } }),
    prisma.media.findMany({ include: { people: { include: { person: true } } } }),
    prisma.event.findMany({ include: { people: { include: { person: true } } } }),
    prisma.person.findMany({ where: { isPlaceholder: false } }),
  ]);

  const items: {
    year: number;
    title: string;
    href: string;
    kind: string;
    image?: string | null;
    people: string[];
  }[] = [];

  for (const s of stories) {
    if (!s.year) continue;
    items.push({
      year: s.year,
      title: s.title,
      href: `/stories/${s.slug}`,
      kind: "סיפור",
      people: s.people.map((p) => p.person.firstName),
    });
  }
  for (const m of media) {
    if (!m.year) continue;
    items.push({
      year: m.year,
      title: m.title ?? m.caption ?? "תמונה",
      href: `/archive/${m.id}`,
      kind: "תמונה",
      image: m.storageKey,
      people: m.people.map((p) => p.person.firstName),
    });
  }
  for (const e of events) {
    if (!e.year) continue;
    items.push({
      year: e.year,
      title: e.title,
      href: `/timeline?decade=${Math.floor(e.year / 10) * 10}`,
      kind: "אירוע",
      people: e.people.map((p) => p.person.firstName),
    });
  }

  items.sort((a, b) => a.year - b.year);
  const decades = [...new Set(items.map((i) => Math.floor(i.year / 10) * 10))];
  const filtered = items.filter((i) => {
    if (selected !== null && Math.floor(i.year / 10) * 10 !== selected) return false;
    if (person && !i.people.includes(person)) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-[900px] px-5 py-16 md:px-8">
      <p className="kicker">ציר הזמן</p>
      <h1 className="font-display mt-3 text-6xl">המשפחה לאורך השנים</h1>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/timeline" className={`px-3 py-1.5 text-sm ${selected === null ? "bg-ink text-cream" : "border border-[var(--line-strong)]"}`}>
          כל השנים
        </Link>
        {decades.map((d) => (
          <Link
            key={d}
            href={`/timeline?decade=${d}`}
            className={`px-3 py-1.5 text-sm ${selected === d ? "bg-ink text-cream" : "border border-[var(--line-strong)]"}`}
          >
            {decadeLabel(d)}
          </Link>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {people.map((p) => (
          <Link
            key={p.id}
            href={`/timeline?person=${p.firstName}`}
            className={`text-sm ${person === p.firstName ? "text-ink" : "text-muted"}`}
          >
            {p.firstName}
          </Link>
        ))}
      </div>
      <ol className="mt-16 space-y-12">
        {filtered.map((item, i) => (
          <li key={`${item.href}-${i}`} className="grid gap-4 border-t border-[var(--line)] pt-6 md:grid-cols-[100px_1fr]">
            <div className="font-display text-3xl">{item.year}</div>
            <Link href={item.href} className="block">
              <div className="text-xs text-bronze">{item.kind}</div>
              <h2 className="font-display mt-1 text-3xl">{item.title}</h2>
              <p className="mt-1 text-sm text-muted">{item.people.join(" · ")}</p>
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaUrl(item.image)} alt="" className="mt-4 max-h-80 w-full object-cover" />
              ) : null}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
