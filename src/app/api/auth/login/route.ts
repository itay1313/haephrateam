import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

/** Tolerates a value written as 13, "13" or ' 13 ' in .env. */
function familyPassword() {
  return (process.env.FAMILY_PASSWORD ?? "13").trim().replace(/^["']|["']$/g, "");
}

// A family-sized brake on password guessing: 20 tries per address per 10 minutes.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 20;
const attempts = new Map<string, { count: number; resetAt: number }>();

function tooManyAttempts(ip: string) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";
  if (tooManyAttempts(ip)) {
    return NextResponse.json(
      { error: "יותר מדי ניסיונות. נסו שוב בעוד כמה דקות." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const password = String(body?.password ?? "").trim();
  const name = String(body?.name ?? "").trim().slice(0, 60);

  if (password !== familyPassword()) {
    return NextResponse.json({ error: "הסיסמה אינה נכונה" }, { status: 401 });
  }

  const user =
    (await prisma.user.findFirst({ where: { role: "OWNER" }, orderBy: { createdAt: "asc" } })) ??
    (await prisma.user.findFirst({ orderBy: { createdAt: "asc" } }));
  if (!user) {
    return NextResponse.json(
      { error: "הארכיון עוד לא הוקם. הריצו npm run db:setup" },
      { status: 500 },
    );
  }

  attempts.delete(ip);
  await createSession(user.id, name ? { name } : undefined);
  return NextResponse.json({ ok: true });
}
