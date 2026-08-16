import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

const FAMILY_PASSWORD = (process.env.FAMILY_PASSWORD ?? "13").trim();

// A family-sized brake on password guessing: 10 tries per address per 10 minutes.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;
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

async function matchPersonByName(name: string) {
  const wanted = name.replace(/\s+/g, " ").trim().toLowerCase();
  if (!wanted) return null;
  const people = await prisma.person.findMany({
    where: { isPlaceholder: false },
    select: { id: true, firstName: true, lastName: true },
  });
  return (
    people.find(
      (p) => [p.firstName, p.lastName].filter(Boolean).join(" ").toLowerCase() === wanted,
    ) ?? null
  );
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
  const personId = String(body?.personId ?? "").trim() || null;

  if (password !== FAMILY_PASSWORD) {
    return NextResponse.json({ error: "הסיסמה אינה נכונה" }, { status: 401 });
  }
  if (name.length < 2) {
    return NextResponse.json({ error: "כתבו את השם שלכם" }, { status: 400 });
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

  // Link the visitor to their person in the tree when the name matches one.
  // Matching happens here so the family list never leaves the server before login.
  const person = personId
    ? await prisma.person.findUnique({ where: { id: personId }, select: { id: true } })
    : await matchPersonByName(name);

  attempts.delete(ip);
  await createSession(user.id, { name, personId: person?.id ?? null });
  return NextResponse.json({ ok: true });
}
