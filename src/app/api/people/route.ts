import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, canEdit } from "@/lib/auth";
import { z } from "zod";

const personSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional().nullable(),
  maidenName: z.string().optional().nullable(),
  gender: z.enum(["MALE", "FEMALE", "UNKNOWN"]).optional(),
  birthDate: z.string().optional().nullable(),
  deathDate: z.string().optional().nullable(),
  birthPlace: z.string().optional().nullable(),
  biography: z.string().optional().nullable(),
  relation: z
    .object({
      type: z.enum(["PARENT", "CHILD", "PARTNER"]),
      personId: z.string(),
      parentType: z.enum(["BIOLOGICAL", "ADOPTIVE", "STEP", "GUARDIAN", "UNKNOWN"]).optional(),
      partnerType: z.enum(["MARRIED", "PARTNER", "FORMER", "ENGAGED"]).optional(),
    })
    .optional(),
  familyIds: z.array(z.string()).optional(),
});

function slugify(first: string, last?: string | null) {
  const base = [first, last].filter(Boolean).join("-").replace(/\s+/g, "-");
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  const people = await prisma.person.findMany({
    where: { isPlaceholder: false },
    include: { portrait: true, families: { include: { family: true } } },
    orderBy: { firstName: "asc" },
  });
  return NextResponse.json({ people });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || !canEdit(user.role)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }
  const parsed = personSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "פרטים חסרים או לא תקינים" }, { status: 400 });
  }
  const data = parsed.data;
  const person = await prisma.person.create({
    data: {
      slug: slugify(data.firstName, data.lastName),
      firstName: data.firstName,
      lastName: data.lastName || null,
      maidenName: data.maidenName || null,
      gender: data.gender ?? "UNKNOWN",
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      deathDate: data.deathDate ? new Date(data.deathDate) : null,
      birthPlace: data.birthPlace || null,
      biography: data.biography || null,
    },
  });

  if (data.familyIds?.length) {
    await prisma.personFamily.createMany({
      data: data.familyIds.map((familyId) => ({ personId: person.id, familyId })),
    });
  }

  if (data.relation) {
    const { type, personId } = data.relation;
    if (type === "PARENT") {
      await prisma.parentChild.create({
        data: {
          parentId: person.id,
          childId: personId,
          type: data.relation.parentType ?? "BIOLOGICAL",
        },
      });
    }
    if (type === "CHILD") {
      await prisma.parentChild.create({
        data: {
          parentId: personId,
          childId: person.id,
          type: data.relation.parentType ?? "BIOLOGICAL",
        },
      });
    }
    if (type === "PARTNER") {
      await prisma.partnership.create({
        data: {
          personAId: personId,
          personBId: person.id,
          type: data.relation.partnerType ?? "MARRIED",
        },
      });
      const host = await prisma.person.findUnique({
        where: { id: personId },
        include: { partnershipsA: true, partnershipsB: true },
      });
      const placeholderPartner = await prisma.person.findFirst({
        where: {
          attachedToId: personId,
          isPlaceholder: true,
          placeholderKind: "PARTNER",
        },
      });
      if (placeholderPartner) {
        await prisma.partnership.deleteMany({
          where: {
            OR: [
              { personAId: placeholderPartner.id },
              { personBId: placeholderPartner.id },
            ],
          },
        });
        await prisma.person.delete({ where: { id: placeholderPartner.id } });
      }
      void host;
    }
  }

  return NextResponse.json({ person });
}
