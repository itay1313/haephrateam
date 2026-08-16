import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { mediaUrl } from "@/lib/queries";

export default async function HomePage() {
  const photos = await prisma.media.findMany({
    where: { type: "PHOTO" },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const hero = photos[0];
  const rest = photos.slice(1, 7);

  return (
    <div>
      <section className="relative min-h-[88vh] bg-night">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={hero ? mediaUrl(hero.storageKey) : "/family/hero-table.jpg"}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(18,16,14,0.7)_0%,rgba(18,16,14,0.12)_50%,rgba(18,16,14,0.35)_100%)]" />
        <div className="relative z-10 flex min-h-[88vh] flex-col justify-end px-6 pb-12 pt-10 md:px-16 md:pb-16">
          <h1 className="text-[2.75rem] font-medium leading-[0.92] text-cream md:text-8xl">
            משפחת האפרתי
          </h1>
          <nav className="mt-8 flex flex-col items-start gap-4 md:mt-10 md:flex-row md:items-baseline md:gap-10">
            <Link
              href="/tree"
              className="border-b border-cream pb-1 text-2xl font-medium text-cream md:text-3xl"
            >
              עץ המשפחה
            </Link>
            <Link
              href="/contribute"
              className="border-b border-cream/70 pb-1 text-lg text-cream hover:border-cream"
            >
              הוסיפו תמונה או סיפור
            </Link>
          </nav>
        </div>
      </section>

      <section className="border-b border-[var(--line)] px-6 py-16 md:px-16 md:py-20">
        <Link href="/tree" className="inline-block border-b border-ink pb-1 text-4xl font-medium leading-none md:text-6xl">
          עץ המשפחה
        </Link>
      </section>

      {rest.length ? (
        <section className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {rest.map((photo) => (
            <div key={photo.id} className="bg-night">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(photo.storageKey)}
                alt=""
                className="aspect-[4/5] w-full object-cover md:aspect-[5/6]"
              />
            </div>
          ))}
        </section>
      ) : null}

      <section className="px-6 py-16 md:px-16">
        <Link href="/contribute" className="border-b border-ink/40 pb-0.5 text-ink-soft hover:border-ink hover:text-ink">
          הוסיפו תמונה או סיפור
        </Link>
      </section>
    </div>
  );
}
