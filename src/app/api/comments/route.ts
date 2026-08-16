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
  const comment = await prisma.comment.create({
    data: {
      body: text,
      authorId: user.id,
      mediaId: body?.mediaId || null,
      storyId: body?.storyId || null,
      personId: body?.personId || null,
    },
    include: { author: true },
  });
  return NextResponse.json({ comment });
}
