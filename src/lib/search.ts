import { prisma } from "./prisma";

export type SearchHit = {
  kind: "person" | "story" | "media" | "event" | "album" | "memory";
  id: string;
  href: string;
  title: string;
  subtitle?: string;
  year?: number | null;
  image?: string | null;
};

function tokenize(q: string) {
  return q
    .trim()
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);
}

const DECADES: Record<string, number> = {
  "שנות הארבעים": 1940,
  "שנות ה-40": 1940,
  "שנות החמישים": 1950,
  "שנות ה-50": 1950,
  "שנות השישים": 1960,
  "שנות ה-60": 1960,
  "שנות השבעים": 1970,
  "שנות ה-70": 1970,
  "שנות השמונים": 1980,
  "שנות ה-80": 1980,
  "שנות התשעים": 1990,
  "שנות ה-90": 1990,
  "שנות האלפיים": 2000,
  "שנות ה-2000": 2000,
};

export async function searchFamily(query: string): Promise<SearchHit[]> {
  const q = query.trim();
  if (!q) return [];
  const tokens = tokenize(q);
  const hits: SearchHit[] = [];

  let decade: number | undefined;
  for (const [phrase, year] of Object.entries(DECADES)) {
    if (q.includes(phrase.replace("שנות הארבעים", phrase))) {
      if (q.includes(phrase)) decade = year;
    }
  }
  for (const [phrase, year] of Object.entries(DECADES)) {
    if (q.includes(phrase)) decade = year;
  }

  const people = await prisma.person.findMany({
    where: { isPlaceholder: false },
    include: { portrait: true, families: { include: { family: true } } },
  });

  for (const person of people) {
    const hay = [
      person.firstName,
      person.lastName,
      person.maidenName,
      person.biography,
      ...person.families.map((f) => f.family.name),
      ...person.families.map((f) => f.family.surname),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (tokens.every((t) => hay.includes(t)) || hay.includes(q.toLowerCase())) {
      hits.push({
        kind: "person",
        id: person.id,
        href: `/people/${person.slug}`,
        title: [person.firstName, person.lastName].filter(Boolean).join(" "),
        subtitle: person.families.map((f) => f.family.name).join(" · "),
        year: person.birthDate?.getFullYear() ?? null,
        image: person.portrait?.storageKey ?? null,
      });
    }
  }

  const stories = await prisma.story.findMany({ include: { people: { include: { person: true } } } });
  for (const story of stories) {
    const hay = [story.title, story.excerpt, story.body, ...story.people.map((p) => p.person.firstName)]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const yearOk = decade ? story.decade === decade || story.year === decade : true;
    if (yearOk && (tokens.every((t) => hay.includes(t)) || hay.includes(q.toLowerCase()))) {
      hits.push({
        kind: "story",
        id: story.id,
        href: `/stories/${story.slug}`,
        title: story.title,
        subtitle: story.excerpt ?? undefined,
        year: story.year,
      });
    }
  }

  const media = await prisma.media.findMany({
    include: { people: { include: { person: true } }, album: true, tags: { include: { tag: true } } },
  });
  const wantsPhotos = /תמונ/.test(q);
  const together = /יחד/.test(q);

  for (const item of media) {
    const names = item.people.map((p) => [p.person.firstName, p.person.lastName].join(" "));
    const hay = [item.title, item.caption, item.narrative, item.album?.title, ...names, ...item.tags.map((t) => t.tag.name)]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const yearOk = decade ? item.year !== null && item.year >= decade && item.year < decade + 10 : true;
    const photoOk = wantsPhotos ? item.type === "PHOTO" : true;

    let match = yearOk && photoOk && (tokens.every((t) => hay.includes(t)) || hay.includes(q.toLowerCase()));
    if (together) {
      const mentioned = people.filter((p) => q.includes(p.firstName));
      if (mentioned.length >= 2) {
        const ids = new Set(item.people.map((p) => p.personId));
        match = mentioned.every((p) => ids.has(p.id));
      }
    }
    if (match) {
      hits.push({
        kind: "media",
        id: item.id,
        href: `/archive/${item.id}`,
        title: item.title || item.caption || "תמונה",
        subtitle: names.join(" · ") || undefined,
        year: item.year,
        image: item.storageKey,
      });
    }
  }

  const albums = await prisma.album.findMany();
  for (const album of albums) {
    const hay = [album.title, album.description, album.category].filter(Boolean).join(" ").toLowerCase();
    if (tokens.every((t) => hay.includes(t)) || hay.includes(q.toLowerCase())) {
      hits.push({
        kind: "album",
        id: album.id,
        href: `/archive?album=${album.slug}`,
        title: album.title,
        subtitle: album.category ?? undefined,
        year: album.year,
        image: album.coverKey,
      });
    }
  }

  const events = await prisma.event.findMany();
  for (const event of events) {
    const hay = [event.title, event.description, event.type].filter(Boolean).join(" ").toLowerCase();
    if (tokens.every((t) => hay.includes(t)) || hay.includes(q.toLowerCase())) {
      hits.push({
        kind: "event",
        id: event.id,
        href: `/timeline?year=${event.year ?? ""}`,
        title: event.title,
        subtitle: event.type ?? undefined,
        year: event.year,
      });
    }
  }

  return hits.slice(0, 60);
}
