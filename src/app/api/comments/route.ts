import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, canEdit } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || !canEdit(user.role)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const text = String(body?.body ?? "").trim();
  if (!text) return NextResponse.json({ error: "חסר תוכן" }, { status: 400 });

  const mediaId = String(body?.mediaId ?? "") || null;
  const storyId = String(body?.storyId ?? "") || null;
  const personId = String(body?.personId ?? "") || null;
  if (!mediaId && !storyId && !personId) {
    return NextResponse.json({ error: "אין למה לצרף את הזיכרון" }, { status: 400 });
  }

  const [media, story, person] = await Promise.all([
    mediaId ? prisma.media.findUnique({ where: { id: mediaId }, select: { id: true } }) : null,
    storyId ? prisma.story.findUnique({ where: { id: storyId }, select: { id: true } }) : null,
    personId ? prisma.person.findUnique({ where: { id: personId }, select: { id: true } }) : null,
  ]);
  if ((mediaId && !media) || (storyId && !story) || (personId && !person)) {
    return NextResponse.json({ error: "הפריט לא נמצא" }, { status: 404 });
  }

  const comment = await prisma.comment.create({
    data: {
      body: text,
      authorId: user.id,
      authorName: user.displayName,
      mediaId: media?.id ?? null,
      storyId: story?.id ?? null,
      personId: person?.id ?? null,
    },
    include: { author: true },
  });
  return NextResponse.json({ comment });
}
