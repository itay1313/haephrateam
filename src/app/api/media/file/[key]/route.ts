import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { Readable } from "stream";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ key: string }> },
) {
  const user = await getSessionUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { key } = await context.params;
  if (key.includes("..") || key.includes("/") || key.includes("\\")) {
    return new NextResponse("Not found", { status: 404 });
  }
  const filePath = path.join(process.cwd(), "uploads", key);
  try {
    await stat(filePath);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
  const stream = createReadStream(filePath);
  const web = Readable.toWeb(stream) as ReadableStream;
  const ext = path.extname(key).toLowerCase();
  const mime =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : ext === ".gif"
          ? "image/gif"
          : ext === ".mp4"
            ? "video/mp4"
            : "image/jpeg";
  return new NextResponse(web, {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
