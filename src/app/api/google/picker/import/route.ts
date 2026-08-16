import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getSessionRecord, canEdit } from "@/lib/auth";
import { ensureGoogleAccess, googleFetch } from "@/lib/google";

export async function POST() {
  const session = await getSessionRecord();
  if (!session || !canEdit(session.user.role as "OWNER" | "ADMIN" | "FAMILY" | "VIEWER")) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }
  if (!session.googlePickerId) {
    return NextResponse.json({ error: "אין בחירה פעילה" }, { status: 400 });
  }

  const access = await ensureGoogleAccess(session);
  if (!access) {
    return NextResponse.json({ error: "יש להתחבר מחדש לגוגל תמונות" }, { status: 401 });
  }

  const items: Array<{
    mediaFile?: { filename?: string; mimeType?: string; baseUrl?: string };
  }> = [];
  let pageToken: string | undefined;

  do {
    const url = new URL("https://photospicker.googleapis.com/v1/mediaItems");
    url.searchParams.set("sessionId", session.googlePickerId);
    url.searchParams.set("pageSize", "100");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const listed = await googleFetch(access, url.toString());
    const payload = await listed.json();
    if (!listed.ok) {
      return NextResponse.json({ error: "לא הצלחנו לקרוא את הבחירה מגוגל" }, { status: 502 });
    }
    items.push(...(payload.mediaItems ?? []));
    pageToken = payload.nextPageToken;
  } while (pageToken);

  const dir = path.join(process.cwd(), "uploads");
  await mkdir(dir, { recursive: true });
  let count = 0;

  for (const item of items) {
    const file = item.mediaFile;
    if (!file?.baseUrl) continue;
    const bytes = await googleFetch(access, `${file.baseUrl}=d`);
    if (!bytes.ok) continue;
    const buf = Buffer.from(await bytes.arrayBuffer());
    const ext = path.extname(file.filename || "") || ".jpg";
    const key = `${randomBytes(12).toString("hex")}${ext}`;
    await writeFile(path.join(dir, key), buf);
    await prisma.media.create({
      data: {
        type: (file.mimeType || "").startsWith("video") ? "VIDEO" : "PHOTO",
        title: null,
        filename: file.filename || key,
        mimeType: file.mimeType || "image/jpeg",
        storageKey: key,
        uploadedById: session.userId,
        providedById: session.userId,
        contributorName: session.visitorName,
      },
    });
    count += 1;
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { googlePickerId: null, googlePickerUri: null },
  });

  return NextResponse.json({ count });
}
