import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { Readable } from "stream";

const EXT_MIME: Record<string, string> = {
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".heic": "image/heic",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".m4a": "audio/mp4",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".pdf": "application/pdf",
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ key: string }> },
) {
  const user = await getSessionUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { key } = await context.params;
  if (!/^[a-zA-Z0-9._-]+$/.test(key) || key.includes("..")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const filePath = path.join(process.cwd(), "uploads", key);
  try {
    await stat(filePath);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  // Prefer the type recorded at upload time; fall back to the extension.
  const record = await prisma.media.findFirst({
    where: { storageKey: key },
    select: { mimeType: true },
  });
  const ext = path.extname(key).toLowerCase();
  const mime = record?.mimeType || EXT_MIME[ext] || "application/octet-stream";
  const safeMime = /^(image|video|audio)\//.test(mime) || mime === "application/pdf"
    ? mime
    : "application/octet-stream";

  const stream = createReadStream(filePath);
  const web = Readable.toWeb(stream) as ReadableStream;

  return new NextResponse(web, {
    headers: {
      "Content-Type": safeMime,
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
