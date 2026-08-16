import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, canEdit } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || !canEdit(user.role)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const title = String(body?.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "חסרה כותרת" }, { status: 400 });
  const year = body?.year ? Number(body.year) : null;
  const event = await prisma.event.create({
    data: {
      title,
      type: body?.type || null,
      year: Number.isFinite(year) ? year : null,
      date: body?.date ? new Date(body.date) : null,
      description: body?.description || null,
    },
  });
  const personIds: string[] = Array.isArray(body?.personIds) ? body.personIds : [];
  if (personIds.length) {
    await prisma.personEvent.createMany({
      data: personIds.map((personId) => ({ eventId: event.id, personId })),
    });
  }
  return NextResponse.json({ event });
}
