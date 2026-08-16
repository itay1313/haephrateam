import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { mediaUrl } from "@/lib/queries";
import { displayName } from "@/lib/genealogy";
import { CommentThread } from "@/components/comments/CommentThread";

export default async function ArchiveItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await prisma.media.findUnique({
    where: { id },
    include: {
      people: { include: { person: true } },
      album: true,
      location: true,
      uploadedBy: true,
      providedBy: true,
      comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!item) notFound();

  return (
    <article className="pb-24">
      <div className="bg-ink">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mediaUrl(item.storageKey)}
          alt={item.title ?? ""}
          className="mx-auto max-h-[88vh] w-auto max-w-full object-contain"
        />
      </div>
      <div className="mx-auto max-w-[720px] px-5 py-16">
        {item.year ? <p className="kicker">{item.year}</p> : null}
        <h1 className="font-display mt-3 text-5xl">{item.title}</h1>
        {item.caption ? <p className="mt-4 text-xl text-ink-soft">{item.caption}</p> : null}
        {item.narrative ? (
          <p className="prose-family mt-8 whitespace-pre-line">{item.narrative}</p>
        ) : null}

        <dl className="mt-12 space-y-3 text-sm">
          {item.location ? (
            <Row label="מקום" value={item.location.name} />
          ) : null}
          {item.people.length ? (
            <div>
              <dt className="text-muted">מופיעים בתמונה</dt>
              <dd className="mt-1 text-lg">
                {item.people.map((p, i) => (
                  <span key={p.personId}>
                    {i > 0 ? " · " : ""}
                    <Link href={`/people/${p.person.slug}`} className="border-b border-ink/20">
                      {displayName(p.person)}
                    </Link>
                  </span>
                ))}
              </dd>
            </div>
          ) : null}
          {item.contributorName ? (
            <Row label="הוסיף/ה לארכיון" value={item.contributorName} />
          ) : item.uploadedBy ? (
            <Row label="הועלה על ידי" value={item.uploadedBy.displayName ?? item.uploadedBy.email} />
          ) : null}
          {item.album ? (
            <div>
              <dt className="text-muted">אלבום</dt>
              <dd>
                <Link href={`/archive?album=${item.album.slug}`}>{item.album.title}</Link>
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-16">
          <CommentThread
            mediaId={item.id}
            comments={item.comments.map((c) => ({
              id: c.id,
              body: c.body,
              author: c.authorName ?? c.author.displayName ?? c.author.email,
              createdAt: c.createdAt.toISOString(),
            }))}
          />
        </div>
      </div>
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
