import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPresignedPutUrl } from "@/lib/s3";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { filename, contentType } = await req.json();
  if (typeof filename !== "string" || typeof contentType !== "string") {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const allowed = ["video/mp4", "video/webm", "image/png", "image/jpeg", "image/webp"];
  if (!allowed.includes(contentType)) {
    return NextResponse.json({ error: "unsupported_mime" }, { status: 400 });
  }
  const key = `${user.id}/${Date.now()}_${filename}`;
  const { uploadUrl, publicUrl } = await getPresignedPutUrl(key, contentType);
  return NextResponse.json({ uploadUrl, key, publicUrl });
}