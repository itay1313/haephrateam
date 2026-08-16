import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

const FAMILY_PASSWORD = process.env.FAMILY_PASSWORD ?? "13";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const password = String(body?.password ?? "").trim();
  if (password !== FAMILY_PASSWORD) {
    return NextResponse.json({ error: "הסיסמה אינה נכונה" }, { status: 401 });
  }
  const user = await prisma.user.findFirst({
    where: { role: "OWNER" },
    orderBy: { createdAt: "asc" },
  });
  if (!user) {
    return NextResponse.json({ error: "אין משתמש בארכיון" }, { status: 500 });
  }
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
