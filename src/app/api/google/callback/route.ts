import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSessionRecord } from "@/lib/auth";
import { createPickerSession, exchangeGoogleCode } from "@/lib/google";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const session = await getSessionRecord();
  if (!session) return NextResponse.redirect(new URL("/login", origin));

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const jar = await cookies();
  const expected = jar.get("google_oauth_state")?.value;
  jar.delete("google_oauth_state");
  if (!code || !state || state !== expected) {
    return NextResponse.redirect(new URL("/contribute?error=google", origin));
  }

  const tokens = await exchangeGoogleCode(code);
  await prisma.session.update({
    where: { id: session.id },
    data: {
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token ?? session.googleRefreshToken,
      googleTokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
    },
  });

  const picking = await createPickerSession(tokens.access_token);
  if (!picking) {
    return NextResponse.redirect(new URL("/contribute?error=picker", origin));
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { googlePickerId: picking.id, googlePickerUri: picking.pickerUri },
  });

  return NextResponse.redirect(new URL("/contribute?google=picking", origin));
}
