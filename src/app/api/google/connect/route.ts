import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { getSessionRecord } from "@/lib/auth";
import {
  createPickerSession,
  ensureGoogleAccess,
  googleAuthUrl,
  googleConfigured,
} from "@/lib/google";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const session = await getSessionRecord();
  if (!session) return NextResponse.redirect(new URL("/login", origin));
  if (!googleConfigured()) {
    return NextResponse.redirect(new URL("/contribute?error=config", origin));
  }

  const access = await ensureGoogleAccess(session);
  if (access) {
    const picking = await createPickerSession(access);
    if (picking) {
      await prisma.session.update({
        where: { id: session.id },
        data: { googlePickerId: picking.id, googlePickerUri: picking.pickerUri },
      });
      return NextResponse.redirect(new URL("/contribute?google=picking", origin));
    }
  }

  const state = randomBytes(16).toString("hex");
  const jar = await cookies();
  jar.set("google_oauth_state", state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  return NextResponse.redirect(googleAuthUrl(state));
}
