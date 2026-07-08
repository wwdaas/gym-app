import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export type UploadResult =
  | { url: string; error?: undefined }
  | { url?: undefined; error: string };

export async function saveUploadedImage(
  file: File | null | undefined,
  subdir: string,
): Promise<UploadResult | null> {
  if (!file || file.size === 0) {
    return null;
  }

  if (!(file.type in ALLOWED_TYPES)) {
    return { error: "只支持 JPG / PNG / WEBP / GIF 格式的图片" };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { error: "图片大小不能超过 5MB" };
  }

  const ext = ALLOWED_TYPES[file.type];
  const filename = `${crypto.randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(dir, { recursive: true });

  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), bytes);

  return { url: `/uploads/${subdir}/${filename}` };
}
