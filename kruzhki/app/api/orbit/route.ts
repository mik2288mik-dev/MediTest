import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rootId = searchParams.get("rootId");
  if (!rootId) return NextResponse.json({ items: [] });
  const orbits = await prisma.orbit.findMany({
    where: { rootId },
    orderBy: { ring: "asc" },
    include: { reply: true },
  });
  const items = await Promise.all(
    orbits.map(async (o) => ({ ring: o.ring, circle: o.reply }))
  );
  return NextResponse.json({ items });
}