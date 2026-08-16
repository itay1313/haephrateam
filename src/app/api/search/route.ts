import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { searchFamily } from "@/lib/search";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const hits = await searchFamily(q);
  return NextResponse.json({ hits });
}
