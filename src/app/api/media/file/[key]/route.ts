import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { readUpload } from "@/lib/storage";
import path from "path";

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

  const file = await readUpload(key);
  if (!file) return new NextResponse("Not found", { status: 404 });

  // Prefer the type recorded at upload time; fall back to the extension.
  const record = await prisma.media.findFirst({
    where: { storageKey: key },
    select: { mimeType: true },
  });
  const ext = path.extname(key).toLowerCase();
  const mime =
    record?.mimeType || file.contentType || EXT_MIME[ext] || "application/octet-stream";
  const safeMime =
    /^(image|video|audio)\//.test(mime) || mime === "application/pdf"
      ? mime
      : "application/octet-stream";

  return new NextResponse(file.stream, {
    headers: {
      "Content-Type": safeMime,
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
