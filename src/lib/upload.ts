import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
]);

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

// New uploads (made after launch) are written here, separate from the
// build-time seed content in private-uploads/. In production this should
// point at a mounted persistent volume (e.g. /data/uploads on Railway) so
// files survive redeploys; it defaults to a local folder for dev.
export const RUNTIME_UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "runtime-uploads");

// The seeded library. Deliberately OUTSIDE public/ so Next never serves it
// as a static asset — everything goes through /api/files, which is the one
// place access control and no-store headers can be enforced.
export const SEED_UPLOAD_DIR = path.join(process.cwd(), "private-uploads");

export class UploadValidationError extends Error {}

export async function saveUploadedFile(file: File, category: string) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new UploadValidationError("Unsupported file type. Upload a PDF, DOCX, PPTX, PNG, or JPG.");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new UploadValidationError("File is too large. Maximum size is 50MB.");
  }

  const ext = path.extname(file.name) || "";
  const safeName = `${randomUUID()}${ext}`;
  const uploadDir = path.join(RUNTIME_UPLOAD_DIR, category);
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, safeName), buffer);

  return {
    fileUrl: `/api/files/${category}/${safeName}`,
    fileType: ext.replace(".", "").toUpperCase() || "FILE",
    fileSize: file.size,
  };
}
