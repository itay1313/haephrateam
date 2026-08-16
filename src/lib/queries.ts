import { prisma } from "./prisma";
import { buildGraph } from "./genealogy";

export async function loadGraph() {
  const [people, parentChild, partnerships] = await Promise.all([
    prisma.person.findMany({
      include: {
        portrait: true,
        families: { include: { family: true } },
      },
      orderBy: { firstName: "asc" },
    }),
    prisma.parentChild.findMany(),
    prisma.partnership.findMany(),
  ]);
  return {
    people,
    parentChild,
    partnerships,
    graph: buildGraph(people, parentChild, partnerships),
  };
}

export async function loadPersonBySlug(slug: string) {
  return prisma.person.findUnique({
    where: { slug },
    include: {
      portrait: true,
      families: { include: { family: true } },
      parentLinks: { include: { child: { include: { portrait: true } } } },
      childLinks: { include: { parent: { include: { portrait: true } } } },
      partnershipsA: { include: { personB: { include: { portrait: true } } } },
      partnershipsB: { include: { personA: { include: { portrait: true } } } },
      media: { include: { media: true } },
      stories: { include: { story: true } },
      events: { include: { event: true } },
      comments: { include: { author: true }, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function loadHome() {
  const [people, stories, media, memories, albums, events, families] = await Promise.all([
    prisma.person.findMany({
      where: { isPlaceholder: false },
      include: { portrait: true, families: { include: { family: true } } },
    }),
    prisma.story.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { people: true } }),
    prisma.media.findMany({ orderBy: { createdAt: "desc" }, take: 18, include: { people: { include: { person: true } } } }),
    prisma.memory.findMany({ orderBy: { createdAt: "desc" }, take: 4, include: { media: { include: { media: true } } } }),
    prisma.album.findMany({ orderBy: { title: "asc" } }),
    prisma.event.findMany({ orderBy: { year: "asc" } }),
    prisma.family.findMany(),
  ]);
  return { people, stories, media, memories, albums, events, families };
}

export function mediaUrl(storageKey: string) {
  if (storageKey.startsWith("family/")) return `/${storageKey}`;
  return `/api/media/file/${storageKey}`;
}

export function initials(firstName: string) {
  return firstName.slice(0, 1);
}
