import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { circleId } = await req.json();
  if (!circleId) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const existing = await prisma.reaction.findUnique({ where: { circleId_userId: { circleId, userId: user.id } } }).catch(() => null);
  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    return NextResponse.json({ reacted: false });
  } else {
    await prisma.reaction.create({ data: { circleId, userId: user.id } });
    return NextResponse.json({ reacted: true });
  }
}