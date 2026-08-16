import { prisma } from "./prisma";

/** Keeps only ids that really exist, so a stale form can't turn into a 500. */
export async function existingPeople(ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return [];
  const found = await prisma.person.findMany({
    where: { id: { in: unique } },
    select: { id: true },
  });
  return found.map((p) => p.id);
}

export async function existingAlbum(id: string | null) {
  if (!id) return null;
  const album = await prisma.album.findUnique({ where: { id }, select: { id: true } });
  return album?.id ?? null;
}
