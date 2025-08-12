import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { type, circleId } = await req.json();
  if (!type) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  await prisma.event.create({ data: { userId: user.id, type, circleId } });
  return NextResponse.json({ ok: true });
}