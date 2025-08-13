import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import dayjs from "dayjs";

const THRESHOLD = 3;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { circleId, reason } = await req.json();
  if (!circleId || !reason) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  await prisma.report.create({ data: { circleId, userId: user.id, reason } });
  const since = dayjs().subtract(1, "hour").toDate();
  const count = await prisma.report.count({ where: { circleId, createdAt: { gte: since } } });
  if (count >= THRESHOLD) {
    await prisma.circle.update({ where: { id: circleId }, data: { shadowed: true } });
  }
  return NextResponse.json({ ok: true });
}