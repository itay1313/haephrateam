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
  const album = await prisma.album.create({
    data: {
      slug: `${title}-${Math.random().toString(36).slice(2, 6)}`.replace(/\s+/g, "-"),
      title,
      description: body?.description || null,
      category: body?.category || null,
      year: body?.year ? Number(body.year) : null,
    },
  });
  return NextResponse.json({ album });
}
