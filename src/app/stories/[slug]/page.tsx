import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { mediaUrl } from "@/lib/queries";
import { displayName } from "@/lib/genealogy";
import { CommentThread } from "@/components/comments/CommentThread";

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await prisma.story.findUnique({
    where: { slug },
    include: {
      people: { include: { person: true } },
      media: { include: { media: true }, orderBy: { sortOrder: "asc" } },
      comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
      location: true,
    },
  });
  if (!story) notFound();

  return (
    <article className="pb-24">
      <header className="mx-auto max-w-[720px] px-5 pt-20">
        {story.year ? <p className="kicker">{story.year}</p> : null}
        <h1 className="font-display mt-3 text-5xl leading-tight md:text-7xl">{story.title}</h1>
        {story.excerpt ? <p className="mt-6 text-xl text-ink-soft">{story.excerpt}</p> : null}
        <p className="mt-4 text-sm text-muted">
          {story.people.map((p, i) => (
            <span key={p.personId}>
              {i > 0 ? " · " : ""}
              <Link href={`/people/${p.person.slug}`}>{displayName(p.person)}</Link>
            </span>
          ))}
          {story.location ? ` · ${story.location.name}` : ""}
        </p>
        {story.contributorName ? (
          <p className="mt-2 text-sm text-muted">נכתב על ידי {story.contributorName}</p>
        ) : null}
      </header>
      {story.media[0] ? (
        <div className="mx-auto mt-14 max-w-[1000px] px-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaUrl(story.media[0].media.storageKey)} alt="" className="w-full" />
        </div>
      ) : null}
      <div className="prose-family mx-auto mt-14 whitespace-pre-line px-5">{story.body}</div>
      <div className="mx-auto mt-16 max-w-[720px] px-5">
        <CommentThread
          storyId={story.id}
          comments={story.comments.map((c) => ({
            id: c.id,
            body: c.body,
            author: c.authorName ?? c.author.displayName ?? c.author.email,
            createdAt: c.createdAt.toISOString(),
          }))}
        />
      </div>
    </article>
  );
}
