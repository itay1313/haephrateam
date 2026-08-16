import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, canEdit } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { existingPeople } from "@/lib/validate";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || !canEdit(user.role)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const title = String(body?.title ?? "").trim();
  const storyBody = String(body?.body ?? "").trim();
  if (!title || !storyBody) {
    return NextResponse.json({ error: "חסרים כותרת או תוכן" }, { status: 400 });
  }
  const year = body?.year ? Number(body.year) : null;
  const slug = slugify(title);
  const story = await prisma.story.create({
    data: {
      slug,
      title,
      excerpt: String(body?.excerpt || storyBody.slice(0, 140)),
      body: storyBody,
      year: Number.isFinite(year) ? year : null,
      decade: Number.isFinite(year) ? Math.floor(year! / 10) * 10 : null,
      authorId: user.id,
      contributorName: user.displayName,
      featured: Boolean(body?.featured),
    },
  });
  const personIds = await existingPeople(
    Array.isArray(body?.personIds) ? body.personIds.map(String) : [],
  );
  if (personIds.length) {
    await prisma.personStory.createMany({
      data: personIds.map((personId) => ({ storyId: story.id, personId })),
    });
  }
  return NextResponse.json({ story });
}
