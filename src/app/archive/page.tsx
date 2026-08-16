import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { mediaUrl } from "@/lib/queries";

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ album?: string; year?: string }>;
}) {
  const { album: albumSlug, year } = await searchParams;
  const albums = await prisma.album.findMany({ orderBy: { title: "asc" } });
  const album = albumSlug ? albums.find((a) => a.slug === albumSlug) : null;
  const media = await prisma.media.findMany({
    where: {
      ...(album ? { albumId: album.id } : {}),
      ...(year ? { year: Number(year) } : {}),
    },
    include: { people: { include: { person: true } }, album: true },
    orderBy: { year: "asc" },
  });

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-16 md:px-8">
      <p className="kicker">הארכיון המשפחתי</p>
      <h1 className="font-display mt-3 text-6xl md:text-7xl">{album?.title ?? "הארכיון המשפחתי"}</h1>
      <p className="mt-5 max-w-2xl text-lg text-ink-soft">
        תמונות, מכתבים, מסמכים, הקלטות וחפצים. כל פריט יכול להיות קשור לאנשים, לשנה ולמקום.
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/archive"
          className={`px-3 py-1.5 text-sm ${!album ? "bg-ink text-cream" : "border border-[var(--line-strong)]"}`}
        >
          הכל
        </Link>
        {albums.map((a) => (
          <Link
            key={a.id}
            href={`/archive?album=${a.slug}`}
            className={`px-3 py-1.5 text-sm ${
              album?.id === a.id ? "bg-ink text-cream" : "border border-[var(--line-strong)]"
            }`}
          >
            {a.title}
          </Link>
        ))}
      </div>

      <div className="mt-14 columns-1 gap-5 md:columns-2 lg:columns-3">
        {media.map((item) => (
          <Link key={item.id} href={`/archive/${item.id}`} className="mb-5 block break-inside-avoid">
            {item.type === "PHOTO" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl(item.storageKey)} alt={item.title ?? ""} className="w-full" />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center bg-paper-deep font-display text-2xl">
                {item.title}
              </div>
            )}
            <div className="mt-2 font-display text-xl">{item.title}</div>
            <div className="text-sm text-muted">
              {item.year ?? ""}{" "}
              {item.people.length ? `· ${item.people.map((p) => p.person.firstName).join(" · ")}` : ""}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
