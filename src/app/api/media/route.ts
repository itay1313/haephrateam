import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, canEdit } from "@/lib/auth";
import path from "path";
import { randomBytes } from "crypto";
import { existingAlbum, existingPeople } from "@/lib/validate";
import { saveUpload } from "@/lib/storage";

const MAX_BYTES = 40 * 1024 * 1024;
const ALLOWED = ["image/", "video/", "audio/", "application/pdf"];

function rejectReason(file: File) {
  if (file.size > MAX_BYTES) return `${file.name}: הקובץ גדול מ־40MB`;
  const type = file.type || "";
  if (!ALLOWED.some((prefix) => type.startsWith(prefix))) {
    return `${file.name}: אפשר להעלות תמונות, סרטונים, הקלטות או PDF`;
  }
  return null;
}

function mediaType(mime: string) {
  if (mime.startsWith("video/")) return "VIDEO";
  if (mime.startsWith("audio/")) return "AUDIO";
  if (mime === "application/pdf") return "DOCUMENT";
  return "PHOTO";
}

async function saveFile(file: File) {
  const ext = path.extname(file.name).slice(0, 10).replace(/[^a-zA-Z0-9.]/g, "") || ".bin";
  const key = `${randomBytes(12).toString("hex")}${ext}`;
  const mimeType = file.type || "application/octet-stream";
  await saveUpload(key, Buffer.from(await file.arrayBuffer()), mimeType);
  return { key, filename: file.name, mimeType };
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || !canEdit(user.role)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const form = await request.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  const single = form.get("file");
  if (single instanceof File && single.size) files.push(single);
  if (!files.length) {
    return NextResponse.json({ error: "חסר קובץ" }, { status: 400 });
  }

  const rejected = files.map(rejectReason).find(Boolean);
  if (rejected) {
    return NextResponse.json({ error: rejected }, { status: 400 });
  }

  const requestedPeople = [
    ...form.getAll("personIds").map((v) => String(v)),
    ...String(form.get("personIds") ?? "").split(","),
  ]
    .map((s) => s.trim())
    .filter(Boolean);
  const personIds = await existingPeople(requestedPeople);
  const yearRaw = form.get("year");
  const year = yearRaw ? Number(yearRaw) : null;
  const title = String(form.get("title") || "") || null;
  const narrative = String(form.get("narrative") || "") || null;
  const caption = String(form.get("caption") || "") || null;

  const albumId = await existingAlbum(String(form.get("albumId") || "") || null);

  const created = [];
  for (const file of files) {
    const saved = await saveFile(file);
    const media = await prisma.media.create({
      data: {
        type: mediaType(file.type),
        title: title || file.name,
        filename: saved.filename,
        mimeType: saved.mimeType,
        storageKey: saved.key,
        year: Number.isFinite(year) ? year : null,
        caption,
        narrative,
        isHistorical: form.get("isHistorical") === "true",
        albumId,
        uploadedById: user.id,
        providedById: user.id,
        contributorName: user.displayName,
      },
    });
    if (personIds.length) {
      await prisma.personMedia.createMany({
        data: personIds.map((personId) => ({ mediaId: media.id, personId, role: "SUBJECT" })),
      });
    }
    created.push(media);
  }

  if (form.get("asPortrait") === "true" && personIds[0] && created[0]) {
    await prisma.person.update({
      where: { id: personIds[0] },
      data: { portraitId: created[0].id },
    });
  }

  return NextResponse.json({ media: created[0], count: created.length });
}
