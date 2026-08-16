import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export type Role = "OWNER" | "ADMIN" | "FAMILY" | "VIEWER";

export type SessionUser = {
  id: string;
  email: string;
  /** The name this visitor gave when signing in, falling back to the account name. */
  displayName: string | null;
  role: Role;
  personId: string | null;
};

const SESSION_DAYS = 30;
const COOKIE = "haephrati_session";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, 64);
  const prev = Buffer.from(hash, "hex");
  if (next.length !== prev.length) return false;
  return timingSafeEqual(next, prev);
}

function sha(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(
  userId: string,
  visitor?: { name?: string | null; personId?: string | null },
) {
  const raw = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: {
      userId,
      token: sha(raw),
      expiresAt,
      visitorName: visitor?.name?.trim() || null,
      visitorPersonId: visitor?.personId || null,
    },
  });
  const jar = await cookies();
  jar.set(COOKIE, raw, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (raw) {
    await prisma.session.deleteMany({ where: { token: sha(raw) } });
  }
  jar.delete(COOKIE);
}

export async function getSessionRecord() {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  const session = await prisma.session.findUnique({
    where: { token: sha(raw) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return null;
  }
  return session;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getSessionRecord();
  if (!session) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    displayName: session.visitorName ?? session.user.displayName,
    role: session.user.role as Role,
    personId: session.visitorPersonId ?? session.user.personId,
  };
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) return null;
  return user;
}

export function canEdit(role: Role) {
  return role === "OWNER" || role === "ADMIN" || role === "FAMILY";
}

export function canAdmin(role: Role) {
  return role === "OWNER" || role === "ADMIN";
}

export function canInvite(role: Role) {
  return role === "OWNER" || role === "ADMIN";
}
