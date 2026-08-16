import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, canInvite } from "@/lib/auth";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || !canInvite(user.role)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const role = ["ADMIN", "FAMILY", "VIEWER"].includes(body?.role) ? body.role : "FAMILY";
  if (!email) return NextResponse.json({ error: "חסר אימייל" }, { status: 400 });

  const token = randomBytes(24).toString("hex");
  const invitation = await prisma.invitation.create({
    data: {
      email,
      token,
      role,
      invitedById: user.id,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });
  return NextResponse.json({
    id: invitation.id,
    inviteUrl: `/login?invite=${token}`,
  });
}
