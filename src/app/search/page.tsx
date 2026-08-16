import Link from "next/link";
import { searchFamily } from "@/lib/search";
import { SearchBox } from "@/components/search/SearchBox";
import { mediaUrl } from "@/lib/queries";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const hits = q ? await searchFamily(q) : [];

  return (
    <div className="mx-auto max-w-[900px] px-5 py-16 md:px-8">
      <p className="kicker">חיפוש</p>
      <h1 className="font-display mt-3 text-6xl">חיפוש במשפחה</h1>
      <p className="mt-4 text-ink-soft">שמות, ענפים, שנים, מקומות, סיפורים ותמונות.</p>
      <div className="mt-8">
        <SearchBox initial={q} />
      </div>
      <div className="mt-6 flex flex-wrap gap-3 text-sm text-muted">
        {["עפר", "משפחת ברג", "שנות השישים", "תמונות של רותי", "חתונה"].map((s) => (
          <Link key={s} href={`/search?q=${encodeURIComponent(s)}`} className="border-b border-ink/15">
            {s}
          </Link>
        ))}
      </div>
      <ul className="mt-14 space-y-8">
        {hits.map((hit) => (
          <li key={`${hit.kind}-${hit.id}`}>
            <Link href={hit.href} className="flex gap-5">
              {hit.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaUrl(hit.image)} alt="" className="h-24 w-20 object-cover" />
              ) : (
                <div className="h-24 w-20 bg-paper-deep" />
              )}
              <div>
                <div className="text-xs text-bronze">{label(hit.kind)}</div>
                <div className="font-display text-3xl">{hit.title}</div>
                {hit.subtitle ? <p className="text-ink-soft">{hit.subtitle}</p> : null}
                {hit.year ? <p className="text-sm text-muted">{hit.year}</p> : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {q && !hits.length ? <p className="mt-12 text-ink-soft">לא נמצא דבר עבור ״{q}״.</p> : null}
    </div>
  );
}

function label(kind: string) {
  const map: Record<string, string> = {
    person: "אדם",
    story: "סיפור",
    media: "תמונה",
    album: "אלבום",
    event: "אירוע",
    memory: "זיכרון",
  };
  return map[kind] ?? kind;
}
