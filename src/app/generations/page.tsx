import Link from "next/link";
import { loadGraph } from "@/lib/queries";
import { generationBuckets } from "@/lib/generations";
import { displayName } from "@/lib/genealogy";
import { PersonChip } from "@/components/person/PersonChip";

export default async function GenerationsPage() {
  const { graph, people } = await loadGraph();
  const buckets = generationBuckets(graph);

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-16 md:px-8">
      <p className="kicker">דורות</p>
      <h1 className="font-display mt-3 text-6xl">דורות</h1>
      <p className="mt-5 max-w-2xl text-lg text-ink-soft">
        המספור מחושב מחדש בכל פעם שמוסיפים אבות קדומים. הדור הראשון הוא תמיד הקדום ביותר שיש בארכיון עכשיו.
      </p>
      <div className="mt-20 space-y-24">
        {buckets.map((g) => (
          <section key={g.index}>
            <div className="border-t border-[var(--line-strong)] pt-6">
              <div className="text-xs tracking-[0.25em] text-bronze">דור {g.index + 1}</div>
              <h2 className="font-display mt-2 text-4xl">{g.label}</h2>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4">
              {g.people.map((p) => (
                <PersonChip
                  key={p.id}
                  href={`/people/${p.slug}`}
                  name={displayName(p)}
                  storageKey={people.find((x) => x.id === p.id)?.portrait?.storageKey}
                  meta={p.lastName ?? undefined}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="mt-16 text-sm text-muted">
        כדי להוסיף דור מעליו, פתחו אדם ללא הורים ולחצו על הוספת אבא או הוספת אמא.
      </p>
      <Link href="/tree" className="mt-4 inline-block border-b border-ink pb-1">
        חזרה לעץ
      </Link>
    </div>
  );
}
