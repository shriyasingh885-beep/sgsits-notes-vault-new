import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile, UploadValidationError } from "@/lib/upload";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in to upload" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const title = form.get("title") as string | null;
  const description = (form.get("description") as string | null) ?? "";
  const subjectId = form.get("subjectId") as string | null;
  const unitNumber = form.get("unitNumber") as string | null;
  const type = form.get("type") as string | null;
  const tags = (form.get("tags") as string | null) ?? "";

  if (!file || !title || !subjectId || !type) {
    return NextResponse.json({ error: "File, title, subject and resource type are required." }, { status: 400 });
  }

  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject) return NextResponse.json({ error: "Subject not found." }, { status: 404 });

  let saved;
  try {
    saved = await saveUploadedFile(file, subject.code.toLowerCase());
  } catch (err) {
    if (err instanceof UploadValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  let unitId: string | null = null;
  if (unitNumber) {
    const num = parseInt(unitNumber, 10);
    if (num > 0) {
      const unit = await prisma.unit.upsert({
        where: { subjectId_number: { subjectId, number: num } },
        update: {},
        create: { subjectId, number: num, title: `Unit ${num}` },
      });
      unitId = unit.id;
    }
  }

  const resource = await prisma.resource.create({
    data: {
      title,
      description,
      fileUrl: saved.fileUrl,
      fileType: saved.fileType,
      fileSize: saved.fileSize,
      tags,
      type,
      status: "PENDING",
      subjectId,
      unitId,
      uploadedById: session.user.id,
    },
  });

  return NextResponse.json({ id: resource.id, status: resource.status });
}
