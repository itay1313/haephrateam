import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { decadeLabel } from "@/lib/format";

export default async function StoriesPage() {
  const stories = await prisma.story.findMany({
    orderBy: { year: "asc" },
    include: { people: { include: { person: true } } },
  });

  return (
    <div className="mx-auto max-w-[820px] px-5 py-16 md:px-8">
      <p className="kicker">סיפורים</p>
      <h1 className="font-display mt-3 text-6xl md:text-7xl">סיפורים</h1>
      <p className="mt-5 max-w-xl text-lg text-ink-soft">
        ילדות, הורים, מסורות, צבא, בתים, עבודה, טיולים ורגעים שאי אפשר לשכוח. נקראים כמו ספר משפחתי.
      </p>
      <div className="mt-20 space-y-20">
        {stories.map((story) => (
          <Link key={story.id} href={`/stories/${story.slug}`} className="block">
            <div className="text-xs tracking-[0.2em] text-bronze">
              {story.year ? decadeLabel(story.year) : ""}
            </div>
            <h2 className="font-display mt-2 text-4xl md:text-5xl">{story.title}</h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-soft">{story.excerpt}</p>
            <p className="mt-3 text-sm text-muted">
              {story.people.map((p) => p.person.firstName).join(" · ")}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
