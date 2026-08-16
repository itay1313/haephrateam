import { NextResponse } from "next/server";
import { getSessionRecord } from "@/lib/auth";
import { ensureGoogleAccess, googleFetch, pollDelayMs } from "@/lib/google";

export async function GET() {
  const session = await getSessionRecord();
  if (!session?.googlePickerId) {
    return NextResponse.json({ done: false, pickerUri: null });
  }
  const access = await ensureGoogleAccess(session);
  if (!access) return NextResponse.json({ done: false, pickerUri: session.googlePickerUri });

  const res = await googleFetch(
    access,
    `https://photospicker.googleapis.com/v1/sessions/${session.googlePickerId}`,
  );
  const json = await res.json();
  return NextResponse.json({
    done: Boolean(json.mediaItemsSet),
    pickerUri: session.googlePickerUri,
    pollMs: pollDelayMs(json.pollingConfig?.pollInterval),
  });
}
