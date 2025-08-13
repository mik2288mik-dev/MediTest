import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import dayjs from "dayjs";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { headObject } from "@/lib/s3";

const limiter = new RateLimiterMemory({ points: 1, duration: 120 }); // 1 per 2 minutes

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { mediaUrl, posterUrl, duration, visibility, parentId } = await req.json();
  if (!mediaUrl || !posterUrl || typeof duration !== "number") {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (duration < 8 || duration > 20) {
    return NextResponse.json({ error: "duration_out_of_range" }, { status: 400 });
  }
  if (!["CLOSE", "FRIENDS", "PUBLIC"].includes(visibility)) {
    return NextResponse.json({ error: "invalid_visibility" }, { status: 400 });
  }

  try {
    await limiter.consume(user.id);
  } catch {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  // basic size/mime validation by HEAD object
  try {
    const key = mediaUrl.replace(String(process.env.STORAGE_PUBLIC_BASE_URL || ""), "");
    const head = await headObject(key);
    const maxBytes = 30 * 1024 * 1024;
    if ((head.ContentLength || 0) > maxBytes) {
      return NextResponse.json({ error: "too_large" }, { status: 400 });
    }
    const ct = head.ContentType || "";
    if (!(ct.startsWith("video/mp4") || ct.startsWith("video/webm"))) {
      return NextResponse.json({ error: "unsupported_mime" }, { status: 400 });
    }
  } catch {
    // ignore if cannot head
  }

  const expiresAt = dayjs().add(24, "hour").toDate();

  const circle = await prisma.circle.create({
    data: { authorId: user.id, mediaUrl, posterUrl, duration, visibility, expiresAt, parentId: parentId || null },
  });

  if (parentId) {
    const parent = await prisma.circle.findUnique({ where: { id: parentId }, include: { replyOrbits: { include: { root: true } } } });
    const rootId = parent?.parentId ? parent.parentId : parentId;
    const maxRing = await prisma.orbit.aggregate({ where: { rootId: rootId! }, _max: { ring: true } });
    const ring = (maxRing._max.ring || 0) + 1;
    await prisma.orbit.create({ data: { rootId: rootId!, replyId: circle.id, ring } });
  }

  return NextResponse.json({ circle });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const now = new Date();
  const expired = await prisma.circle.deleteMany({ where: { authorId: user.id, expiresAt: { lte: now } } });
  return NextResponse.json({ deleted: expired.count });
}