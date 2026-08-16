import { createReadStream } from "fs";
import { mkdir, stat, writeFile } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { get, put } from "@vercel/blob";

/**
 * Uploads live in a private Vercel Blob store in production, and in ./uploads
 * during local development. Either way they are only ever served through
 * /api/media/file/[key], which checks the session first.
 */
const blobConfigured = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

const localDir = () => path.join(process.cwd(), "uploads");

export async function saveUpload(key: string, data: Buffer, contentType: string) {
  if (blobConfigured()) {
    await put(key, data, {
      access: "private",
      addRandomSuffix: false,
      contentType,
    });
    return;
  }
  await mkdir(localDir(), { recursive: true });
  await writeFile(path.join(localDir(), key), data);
}

export type StoredFile = { stream: ReadableStream; contentType: string | null };

export async function readUpload(key: string): Promise<StoredFile | null> {
  if (blobConfigured()) {
    const found = await get(key, { access: "private" }).catch(() => null);
    if (!found || !found.stream) return null;
    return { stream: found.stream, contentType: found.blob.contentType };
  }

  const filePath = path.join(localDir(), key);
  try {
    await stat(filePath);
  } catch {
    return null;
  }
  return {
    stream: Readable.toWeb(createReadStream(filePath)) as ReadableStream,
    contentType: null,
  };
}
