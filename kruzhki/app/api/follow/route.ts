import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { userId } = await req.json();
  if (!userId || userId === user.id) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const existing = await prisma.follow.findUnique({ where: { followerId_followingId: { followerId: user.id, followingId: userId } } }).catch(() => null);
  if (existing) {
    await prisma.follow.delete({ where: { followerId_followingId: { followerId: user.id, followingId: userId } } });
    return NextResponse.json({ following: false });
  } else {
    await prisma.follow.create({ data: { followerId: user.id, followingId: userId } });
    return NextResponse.json({ following: true });
  }
}