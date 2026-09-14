import { NextRequest, NextResponse } from "next/server";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { auth } from "@/lib/auth";
import { RUNTIME_UPLOAD_DIR, SEED_UPLOAD_DIR } from "@/lib/upload";

/**
 * The ONLY way library files reach a browser. Nothing lives under public/
 * any more, so this route is the single choke point for access control and
 * for the headers that discourage casual saving.
 *
 * Notes Hub is a public site — no accounts, no login wall — so documents are
 * readable by anyone. The anti-saving posture is unchanged and does not
 * depend on this flag: files are still served only through this route (never
 * from public/), always `inline` and never as an attachment, with no-store
 * caching, nosniff, and noindex so they don't get archived or crawled.
 *
 * Set REQUIRE_SIGN_IN back to true to restrict reading to signed-in users.
 * Note that a public site means a determined visitor can fetch the raw bytes
 * from the URL — the headers below discourage casual saving, they cannot
 * prevent it.
 */
const REQUIRE_SIGN_IN = false;

const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".ppt": "application/vnd.ms-powerpoint",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/** Resolve a request path inside one of the upload roots, refusing traversal. */
async function resolveInRoots(segments: string[]): Promise<string | null> {
  for (const root of [RUNTIME_UPLOAD_DIR, SEED_UPLOAD_DIR]) {
    const resolved = path.resolve(path.join(root, ...segments));
    if (!resolved.startsWith(path.resolve(root) + path.sep)) continue;
    try {
      const s = await stat(resolved);
      if (s.isFile()) return resolved;
    } catch {
      /* try the next root */
    }
  }
  return null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;

  if (segments.some((s) => s.includes("..") || s.includes("/") || s.includes("\\"))) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  if (REQUIRE_SIGN_IN) {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Sign in to view this document" }, { status: 401 });
    }
  }

  const resolved = await resolveInRoots(segments);
  if (!resolved) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { size } = await stat(resolved);
  const ext = path.extname(resolved).toLowerCase();
  const range = req.headers.get("range");

  // Shared headers: inline only (never an attachment), never cached to disk
  // by a shared cache, and not indexable.
  const baseHeaders: Record<string, string> = {
    "Content-Type": CONTENT_TYPES[ext] || "application/octet-stream",
    "Content-Disposition": `inline; filename="${path.basename(resolved)}"`,
    "Cache-Control": "private, no-store, max-age=0, must-revalidate",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
    "Accept-Ranges": "bytes",
  };

  // pdf.js asks for byte ranges; honouring them keeps large PDFs streaming
  // rather than buffering the whole file into memory.
  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    if (match) {
      const start = match[1] ? parseInt(match[1], 10) : 0;
      const end = match[2] ? parseInt(match[2], 10) : size - 1;
      if (start >= size || end >= size || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: { ...baseHeaders, "Content-Range": `bytes */${size}` },
        });
      }
      const stream = Readable.toWeb(
        createReadStream(resolved, { start, end }),
      ) as unknown as ReadableStream;
      return new NextResponse(stream, {
        status: 206,
        headers: {
          ...baseHeaders,
          "Content-Range": `bytes ${start}-${end}/${size}`,
          "Content-Length": String(end - start + 1),
        },
      });
    }
  }

  const stream = Readable.toWeb(createReadStream(resolved)) as unknown as ReadableStream;
  return new NextResponse(stream, {
    status: 200,
    headers: { ...baseHeaders, "Content-Length": String(size) },
  });
}
