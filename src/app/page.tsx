import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { mediaUrl } from "@/lib/queries";
import { DirectoryMenu, type DirectoryItem } from "@/components/home/DirectoryMenu";

const FALLBACKS = [
  "/family/generations-chairs.jpg",
  "/family/archive-album.jpg",
  "/family/portrait-linen.jpg",
  "/family/holiday-table.jpg",
  "/family/photo-wall.jpg",
  "/family/childhood-light.jpg",
];

export default async function HomePage() {
  const [photos, stories, families, counts] = await Promise.all([
    prisma.media.findMany({
      where: { type: "PHOTO" },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { people: { include: { person: true } } },
    }),
    prisma.story.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { people: { include: { person: true } } },
    }),
    prisma.family.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { people: true } } } }),
    Promise.all([
      prisma.person.count({ where: { isPlaceholder: false } }),
      prisma.media.count(),
      prisma.story.count(),
      prisma.event.count(),
      prisma.album.count(),
    ]),
  ]);

  const [peopleCount, mediaCount, storyCount, eventCount, albumCount] = counts;
  const hero = photos[0];
  const preview = (i: number) => {
    const photo = photos[i + 1];
    return photo ? mediaUrl(photo.storageKey) : FALLBACKS[i % FALLBACKS.length];
  };

  const sections: DirectoryItem[] = [
    {
      href: "/tree",
      label: "עץ המשפחה",
      description: "כל הקשרים במקום אחד — הורים, ילדים, בני זוג. אפשר לגרור, להתקרב ולפתוח כל אחד.",
      meta: `${peopleCount} בני משפחה`,
      image: preview(0),
    },
    {
      href: "/archive",
      label: "הארכיון",
      description: "תמונות, מכתבים, מסמכים והקלטות. מסודר לפי אלבומים ולפי שנים.",
      meta: `${mediaCount} פריטים · ${albumCount} אלבומים`,
      image: preview(1),
    },
    {
      href: "/stories",
      label: "סיפורים",
      description: "מה שזוכרים ומספרים — ילדות, בתים, מסורות, רגעים שלא רוצים לאבד.",
      meta: `${storyCount} סיפורים`,
      image: preview(2),
    },
    {
      href: "/timeline",
      label: "ציר הזמן",
      description: "כל מה שיש בארכיון מסודר לפי עשורים, מהמוקדם ועד היום.",
      meta: `${eventCount} אירועים`,
      image: preview(3),
    },
    {
      href: "/generations",
      label: "דורות",
      description: "מי שייך לאיזה דור, ומי הכי קדום שידוע לנו כרגע.",
      meta: "לפי דורות",
      image: preview(4),
    },
    {
      href: "/search",
      label: "חיפוש",
      description: "שם, שנה, מקום או מילה מתוך סיפור — הכל נמצא מכאן.",
      meta: "בכל הארכיון",
      image: preview(5),
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[78vh] overflow-hidden bg-night md:min-h-[86vh]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={hero ? mediaUrl(hero.storageKey) : "/family/hero-table.jpg"}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(18,16,14,0.82)_0%,rgba(18,16,14,0.18)_55%,rgba(18,16,14,0.45)_100%)]" />
        <div className="relative z-10 flex min-h-[78vh] flex-col justify-end px-5 pb-14 pt-24 md:min-h-[86vh] md:px-8 md:pb-20">
          <div className="mx-auto w-full max-w-[1400px]">
            <p className="text-xs tracking-[0.3em] text-cream/70">הארכיון המשפחתי</p>
            <h1 className="mt-5 text-[3rem] font-medium leading-[0.9] text-cream md:text-[7rem]">
              משפחת האפרתי
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream/85">
              {peopleCount} בני משפחה, {mediaCount} תמונות ומסמכים, {storyCount} סיפורים.
              מה שנשמר כאן נשאר לדורות הבאים.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/tree"
                className="bg-cream px-6 py-3 text-night transition-colors hover:bg-white"
              >
                לעץ המשפחה
              </Link>
              <Link
                href="/contribute"
                className="border border-cream/45 px-6 py-3 text-cream transition-colors hover:border-cream"
              >
                להוסיף תמונה או סיפור
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Directory */}
      <section className="mx-auto max-w-[1400px] px-5 py-20 md:px-8 md:py-28">
        <div className="flex items-baseline justify-between gap-6">
          <h2 className="text-sm tracking-[0.25em] text-bronze">תוכן העניינים</h2>
          <span className="text-sm text-muted">כל האזורים באתר</span>
        </div>
        <div className="mt-10">
          <DirectoryMenu items={sections} />
        </div>
      </section>

      {/* Branches */}
      {families.length ? (
        <section className="border-y border-[var(--line)] bg-paper-deep/40">
          <div className="mx-auto max-w-[1400px] px-5 py-16 md:px-8 md:py-20">
            <h2 className="text-sm tracking-[0.25em] text-bronze">ענפי המשפחה</h2>
            <div className="mt-8 flex flex-wrap gap-x-10 gap-y-6">
              {families.map((family) => (
                <Link
                  key={family.id}
                  href={`/branches/${family.slug}`}
                  className="group"
                >
                  <div className="text-3xl font-medium leading-none transition-colors group-hover:text-bronze md:text-4xl">
                    {family.name}
                  </div>
                  <div className="mt-2 text-sm text-muted">{family._count.people} אנשים</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Latest */}
      {photos.length > 1 ? (
        <section className="mx-auto max-w-[1400px] px-5 py-20 md:px-8 md:py-28">
          <div className="flex items-baseline justify-between gap-6">
            <h2 className="text-sm tracking-[0.25em] text-bronze">נוסף לאחרונה</h2>
            <Link href="/archive" className="border-b border-ink/30 pb-0.5 text-sm hover:border-ink">
              לכל הארכיון
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {photos.slice(0, 8).map((photo) => (
              <Link key={photo.id} href={`/archive/${photo.id}`} className="group block">
                <div className="overflow-hidden bg-paper-deep">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaUrl(photo.storageKey)}
                    alt={photo.title ?? ""}
                    className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="mt-3 text-sm leading-snug">
                  {photo.title ?? photo.caption ?? "ללא כותרת"}
                </div>
                <div className="mt-1 text-xs text-muted">
                  {[photo.year, photo.people.map((p) => p.person.firstName).join(" · ")]
                    .filter(Boolean)
                    .join(" — ")}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Stories teaser */}
      {stories.length ? (
        <section className="border-t border-[var(--line)]">
          <div className="mx-auto max-w-[1400px] px-5 py-20 md:px-8 md:py-24">
            <h2 className="text-sm tracking-[0.25em] text-bronze">מהסיפורים</h2>
            <div className="mt-10 grid gap-12 md:grid-cols-3">
              {stories.map((story) => (
                <Link key={story.id} href={`/stories/${story.slug}`} className="group block">
                  <div className="text-xs text-bronze">{story.year ?? ""}</div>
                  <h3 className="mt-2 text-2xl font-medium leading-tight group-hover:text-bronze md:text-3xl">
                    {story.title}
                  </h3>
                  <p className="mt-3 text-ink-soft">{story.excerpt}</p>
                  <p className="mt-3 text-sm text-muted">
                    {story.people.map((p) => p.person.firstName).join(" · ")}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Contribute */}
      <section className="bg-night text-cream">
        <div className="mx-auto max-w-[1400px] px-5 py-20 md:px-8 md:py-28">
          <div className="grid gap-12 md:grid-cols-[1.2fr_1fr] md:gap-20">
            <div>
              <h2 className="text-4xl font-medium leading-tight md:text-6xl">
                יש לכם תמונה שאף אחד עוד לא ראה?
              </h2>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-cream/80">
                כל בן משפחה יכול להעלות תמונות, מכתבים והקלטות, לכתוב זיכרון, ולסמן מי נמצא בתמונה.
                לא צריך לדעת הכל — גם שם אחד או שנה משוערת עוזרים.
              </p>
              <div className="mt-9 flex flex-wrap gap-4">
                <Link
                  href="/contribute"
                  className="bg-cream px-6 py-3 text-night transition-colors hover:bg-white"
                >
                  להוסיף לארכיון
                </Link>
                <Link
                  href="/search"
                  className="border border-cream/40 px-6 py-3 transition-colors hover:border-cream"
                >
                  לחפש מישהו
                </Link>
              </div>
            </div>
            <ol className="space-y-6 text-cream/80">
              {[
                "מעלים תמונה, סריקה של מכתב או פשוט כותבים סיפור.",
                "מסמנים מי בתמונה ובאיזו שנה — כמה שזוכרים.",
                "כותבים מי אתם, כדי שנדע למי להגיד תודה.",
              ].map((step, i) => (
                <li key={step} className="flex gap-5 border-t border-cream/15 pt-5">
                  <span className="text-sm tabular-nums text-cream/45">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}
