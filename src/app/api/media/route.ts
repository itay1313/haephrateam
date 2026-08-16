import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, canEdit } from "@/lib/auth";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

async function saveFile(file: File) {
  const ext = path.extname(file.name) || ".bin";
  const key = `${randomBytes(12).toString("hex")}${ext}`;
  const dir = path.join(process.cwd(), "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, key), Buffer.from(await file.arrayBuffer()));
  return { key, filename: file.name, mimeType: file.type || "application/octet-stream" };
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

  const personIds = [
    ...form.getAll("personIds").map((v) => String(v)),
    ...String(form.get("personIds") ?? "").split(","),
  ]
    .map((s) => s.trim())
    .filter(Boolean);
  const yearRaw = form.get("year");
  const year = yearRaw ? Number(yearRaw) : null;
  const title = String(form.get("title") || "") || null;
  const narrative = String(form.get("narrative") || "") || null;
  const caption = String(form.get("caption") || "") || null;

  const created = [];
  for (const file of files) {
    const saved = await saveFile(file);
    const media = await prisma.media.create({
      data: {
        type: file.type.startsWith("video") ? "VIDEO" : "PHOTO",
        title: title || file.name,
        filename: saved.filename,
        mimeType: saved.mimeType,
        storageKey: saved.key,
        year: Number.isFinite(year) ? year : null,
        caption,
        narrative,
        isHistorical: form.get("isHistorical") === "true",
        albumId: String(form.get("albumId") || "") || null,
        uploadedById: user.id,
        providedById: user.id,
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
