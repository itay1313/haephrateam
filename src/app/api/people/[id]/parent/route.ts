import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, canEdit } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user || !canEdit(user.role)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }
  const { id: childId } = await context.params;
  const body = await request.json().catch(() => null);
  const firstName = String(body?.firstName ?? "").trim();
  if (!firstName) {
    return NextResponse.json({ error: "חסר שם" }, { status: 400 });
  }

  const parent = await prisma.person.create({
    data: {
      slug: `${firstName}-${Math.random().toString(36).slice(2, 7)}`,
      firstName,
      lastName: body?.lastName || null,
      maidenName: body?.maidenName || null,
      gender: body?.gender === "FEMALE" ? "FEMALE" : body?.gender === "MALE" ? "MALE" : "UNKNOWN",
      birthDate: body?.birthDate ? new Date(body.birthDate) : null,
      deathDate: body?.deathDate ? new Date(body.deathDate) : null,
      biography: body?.biography || null,
    },
  });

  await prisma.parentChild.create({
    data: {
      parentId: parent.id,
      childId,
      type: body?.parentType ?? "BIOLOGICAL",
    },
  });

  const child = await prisma.person.findUnique({
    where: { id: childId },
    include: { families: true },
  });
  if (child?.families.length) {
    await prisma.personFamily.createMany({
      data: child.families.map((f) => ({ personId: parent.id, familyId: f.familyId })),
    });
  }

  return NextResponse.json({ person: parent });
}
