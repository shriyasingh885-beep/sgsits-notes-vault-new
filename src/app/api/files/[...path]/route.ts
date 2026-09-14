import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;

  if (segments.some((s) => s.includes("..") || s.includes("/") || s.includes("\\"))) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const ghPath = segments.join("/");
  const ghUrl = `https://raw.githubusercontent.com/shriyasingh885-beep/sgsits-notes-vault-new/main/private-uploads/${ghPath}`;

  // 302 redirect to GitHub CDN: 0 bytes transferred through Vercel Fast Origin Transfer!
  return NextResponse.redirect(ghUrl, 302);
}
