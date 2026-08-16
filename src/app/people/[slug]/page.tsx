import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadGraph, loadPersonBySlug, mediaUrl } from "@/lib/queries";
import { children, displayName, grandparents, parents, partners, siblings } from "@/lib/genealogy";
import { kinshipPath } from "@/lib/kinship";
import { lifeLabel } from "@/lib/format";
import { Portrait } from "@/components/person/Portrait";
import { PersonChip } from "@/components/person/PersonChip";
import { AddParentButtons } from "@/components/person/AddParentButtons";
import { CommentThread } from "@/components/comments/CommentThread";
import { KinshipPicker } from "@/components/person/KinshipPicker";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const person = await loadPersonBySlug(slug);
  if (!person) return { title: "בן משפחה" };
  return { title: displayName(person) };
}

export default async function PersonPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ related?: string }>;
}) {
  const { slug } = await params;
  const { related } = await searchParams;
  const person = await loadPersonBySlug(slug);
  if (!person || person.isPlaceholder) notFound();
  const { graph, people } = await loadGraph();

  const parentList = parents(graph, person.id);
  const partnerList = partners(graph, person.id).filter((p) => !p.isPlaceholder);
  const childList = children(graph, person.id).filter((p) => !p.isPlaceholder);
  const siblingList = siblings(graph, person.id).filter((p) => !p.isPlaceholder);
  const gp = grandparents(graph, person.id);
  const photos = person.media.map((m) => m.media).filter((m) => m.type === "PHOTO");
  const stories = person.stories.map((s) => s.story);

  const relatedPerson = related ? people.find((p) => p.slug === related) : null;
  const path = relatedPerson ? kinshipPath(graph, person.id, relatedPerson.id) : null;

  const portraitKey = person.portrait?.storageKey;
  const timelineYears = [1950, 1965, 1980, 1995, 2010, 2026];

  return (
    <article>
      <header className="grid md:grid-cols-2">
        <div className="min-h-[70vh] bg-paper-deep">
          <Portrait name={displayName(person)} storageKey={portraitKey} sizes="wide" className="h-full min-h-[70vh] !aspect-auto object-cover" />
        </div>
        <div className="flex flex-col justify-end px-6 py-12 md:px-14 md:py-20">
          <p className="text-bronze">בן משפחה</p>
          <h1 className="mt-3 text-6xl font-medium leading-none md:text-7xl">{displayName(person)}</h1>
          {person.maidenName ? (
            <p className="mt-3 text-lg text-ink-soft">לבית {person.maidenName}</p>
          ) : null}
          {lifeLabel(person) ? (
            <p className="mt-2 text-xl text-ink-soft">{lifeLabel(person)}</p>
          ) : null}
          {person.occupation ? <p className="mt-2 text-ink-soft">{person.occupation}</p> : null}
          {person.birthPlace ? <p className="mt-1 text-sm text-muted">{person.birthPlace}</p> : null}
          <dl className="mt-10 space-y-3 text-lg">
            {parentList.length ? (
              <div>
                <dt className="text-sm text-muted">הורים</dt>
                <dd>
                  {parentList.map((p, i) => (
                    <span key={p.id}>
                      {i > 0 ? " ו" : ""}
                      <Link href={`/people/${p.slug}`} className="border-b border-ink/20">
                        {p.firstName}
                      </Link>
                    </span>
                  ))}
                </dd>
              </div>
            ) : (
              <div>
                <dt className="text-sm text-muted">הורים</dt>
                <dd className="text-ink-soft">עדיין לא ידועים</dd>
              </div>
            )}
            {partnerList.length ? (
              <div>
                <dt className="text-sm text-muted">בן/בת זוג</dt>
                <dd>
                  {partnerList.map((p) => (
                    <Link key={p.id} href={`/people/${p.slug}`} className="border-b border-ink/20">
                      {p.firstName}
                    </Link>
                  ))}
                </dd>
              </div>
            ) : null}
            {childList.length ? (
              <div>
                <dt className="text-sm text-muted">ילדים</dt>
                <dd>
                  {childList.map((p, i) => (
                    <span key={p.id}>
                      {i > 0 ? ", " : ""}
                      <Link href={`/people/${p.slug}`} className="border-b border-ink/20">
                        {p.firstName}
                      </Link>
                    </span>
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>
          <div id="parents" className="scroll-mt-28">
            <AddParentButtons personId={person.id} missing={parentList.length < 2} />
          </div>
        </div>
      </header>

      {person.biography ? (
        <section className="mx-auto max-w-[720px] px-5 py-24">
          <p className="text-bronze">הסיפור של {person.firstName}</p>
          <div className="prose-family mt-8 whitespace-pre-line">{person.biography}</div>
          <Sources slug={person.slug} />
        </section>
      ) : null}

      {stories.length ? (
        <section className="mx-auto max-w-[720px] px-5 pb-16">
          {stories.map((s) => (
            <Link key={s.id} href={`/stories/${s.slug}`} className="mb-10 block">
              <h2 className="font-display text-4xl">{s.title}</h2>
              <p className="mt-2 text-ink-soft">{s.excerpt}</p>
            </Link>
          ))}
        </section>
      ) : null}

      {photos.length ? (
        <section className="px-5 py-12 md:px-8">
          <div className="mx-auto max-w-[1400px]">
            <p className="kicker">התמונות של {person.firstName}</p>
            <div className="mt-8 columns-1 gap-4 md:columns-2 lg:columns-3">
              {photos.map((photo) => (
                <Link key={photo.id} href={`/archive/${photo.id}`} className="mb-4 block break-inside-avoid">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaUrl(photo.storageKey)} alt={photo.title ?? ""} className="w-full" />
                  <div className="mt-2 text-sm text-muted">
                    {photo.year} {photo.caption ? `· ${photo.caption}` : ""}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-[900px] px-5 py-20">
        <p className="kicker">{person.firstName} לאורך השנים</p>
        <div className="mt-12 space-y-12">
          {timelineYears.map((y) => {
            const inYear = photos.filter((p) => p.year && Math.abs((p.year ?? 0) - y) <= 8);
            return (
              <div key={y} className="grid gap-6 border-t border-[var(--line)] pt-6 md:grid-cols-[120px_1fr]">
                <div className="font-display text-4xl">{y}</div>
                <div>
                  {inYear.length ? (
                    <div className="grid grid-cols-2 gap-3">
                      {inYear.slice(0, 4).map((p) => (
                        <Link key={p.id} href={`/archive/${p.id}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={mediaUrl(p.storageKey)} alt="" className="h-40 w-full object-cover" />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-ink-soft">עדיין אין פריטים לתקופה הזאת.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-paper-deep px-5 py-20 md:px-8">
        <div className="mx-auto max-w-[1400px]">
          <p className="kicker">המשפחה של {person.firstName}</p>
          <div className="mt-10 grid gap-12 md:grid-cols-3">
            <FamilyCol title="הורים" people={parentList} portraits={people} />
            <FamilyCol title="בן/בת זוג" people={partnerList} portraits={people} />
            <FamilyCol title="ילדים" people={childList} portraits={people} />
          </div>
          {gp.length ? (
            <div className="mt-12">
              <FamilyCol title="סבים וסבתות" people={gp} portraits={people} />
            </div>
          ) : null}
          {siblingList.length ? (
            <div className="mt-12">
              <FamilyCol title="אחים ואחיות" people={siblingList} portraits={people} />
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-[720px] px-5 py-20">
        <p className="kicker">הקשר המשפחתי</p>
        <h2 className="font-display mt-3 text-4xl">איך {person.firstName} קשור למשפחה</h2>
        <KinshipPicker
          currentSlug={person.slug}
          people={people
            .filter((p) => !p.isPlaceholder && p.id !== person.id)
            .map((p) => ({ slug: p.slug, name: displayName(p) }))}
        />
        {path ? (
          <ol className="mt-10 space-y-4">
            {path.map((step, i) => (
              <li key={step.person.id} className="flex items-center gap-4">
                <span className="text-muted">{i === 0 ? "" : "↓"}</span>
                <Link href={`/people/${step.person.slug}`} className="font-display text-2xl">
                  {displayName(step.person)}
                </Link>
              </li>
            ))}
          </ol>
        ) : null}
      </section>

      <section className="mx-auto max-w-[720px] px-5 pb-24">
        <CommentThread
          personId={person.id}
          comments={person.comments.map((c) => ({
            id: c.id,
            body: c.body,
            author: c.authorName ?? c.author.displayName ?? c.author.email,
            createdAt: c.createdAt.toISOString(),
          }))}
        />
      </section>
    </article>
  );
}

function FamilyCol({
  title,
  people,
  portraits,
}: {
  title: string;
  people: { id: string; slug: string; firstName: string; lastName: string | null }[];
  portraits: { id: string; portrait?: { storageKey: string } | null }[];
}) {
  if (!people.length) return null;
  return (
    <div>
      <h3 className="text-sm text-bronze">{title}</h3>
      <div className="mt-5 grid grid-cols-2 gap-5">
        {people.map((p) => (
          <PersonChip
            key={p.id}
            href={`/people/${p.slug}`}
            name={displayName(p)}
            storageKey={portraits.find((x) => x.id === p.id)?.portrait?.storageKey}
          />
        ))}
      </div>
    </div>
  );
}

const SOURCE_MAP: Record<string, { label: string; href: string }[]> = {
  "yosef-haephrati": [
    { label: "ויקיפדיה", href: "https://he.wikipedia.org/wiki/יוסף_האפרתי" },
    { label: "גלעד לזכרם, גולני", href: "https://golani.gal-ed.co.il/Web/He/SearchResults/Page/Default.aspx?ID=7649" },
  ],
  "ruti-haephrati": [{ label: "האתר לזכרה של רותי האפרתי", href: "https://haephrati.co.il/" }],
  "leo-shaudinishky": [
    { label: "פרופ' ליאו שאודינישקי", href: "https://shaudinishky.wordpress.com/2011/06/25/shaudinishky/" },
  ],
  "eva-shaudinishky": [
    { label: "פרופ' ליאו שאודינישקי", href: "https://shaudinishky.wordpress.com/2011/06/25/shaudinishky/" },
  ],
  "yaakov-berg": [
    { label: "לזכרו של יעקב ברג, ראשונים תל מונד", href: "https://www.rishonim.org.il/telmond/Info/hi_show.aspx?id=49377" },
  ],
  "ashira-berg": [
    { label: "שם רחוק בהרים, זמרשת", href: "https://www.zemereshet.co.il/song.asp?id=1282&perf_id=8987" },
    { label: "עשירה ברג, זמרשת", href: "https://www.zemereshet.co.il/artist.asp?id=3026" },
  ],
};

function Sources({ slug }: { slug: string }) {
  const sources = SOURCE_MAP[slug];
  if (!sources?.length) return null;
  return (
    <div className="mt-12 border-t border-[var(--line)] pt-6">
      <p className="text-sm text-muted">מקורות</p>
      <ul className="mt-3 space-y-2">
        {sources.map((s) => (
          <li key={s.href}>
            <a href={s.href} target="_blank" rel="noreferrer" className="border-b border-ink/20 text-sm">
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
