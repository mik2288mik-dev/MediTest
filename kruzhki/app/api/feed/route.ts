import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(req.url);
  const mode = (searchParams.get("mode") || "global") as "global" | "friends" | "nearby";
  const limit = Math.min(parseInt(searchParams.get("limit") || "12"), 50);
  const cursor = searchParams.get("cursor");

  const now = new Date();
  const whereBase: Prisma.CircleWhereInput = { expiresAt: { gt: now } };

  if (mode === "friends" && user) {
    const following = await prisma.follow.findMany({ where: { followerId: user.id } });
    const ids = following.map((f) => f.followingId);
    whereBase.authorId = { in: ids };
    whereBase.visibility = { in: ["FRIENDS", "PUBLIC"] } as unknown as Prisma.EnumVisibilityFilter;
  } else {
    whereBase.visibility = "PUBLIC" as unknown as Prisma.EnumVisibilityFilter;
    whereBase.shadowed = false;
  }

  const items = await prisma.circle.findMany({
    where: whereBase,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    include: { author: true, replyOrbits: { include: { root: true } } },
  });

  const hasMore = items.length > limit;
  const sliced = hasMore ? items.slice(0, limit) : items;

  const result = await Promise.all(
    sliced.map(async (c) => {
      const [reactions, replies, reacted] = await Promise.all([
        prisma.reaction.count({ where: { circleId: c.id } }),
        prisma.orbit.count({ where: { rootId: c.id } }),
        user ? prisma.reaction.findUnique({ where: { circleId_userId: { circleId: c.id, userId: user.id } } }).then(Boolean) : Promise.resolve(false),
      ]);
      const root = c.replyOrbits[0]?.root || null;
      return {
        circle: { id: c.id, mediaUrl: c.mediaUrl, posterUrl: c.posterUrl, duration: c.duration, visibility: c.visibility, authorId: c.authorId },
        author: { id: c.author.id, username: c.author.username, fullName: c.author.fullName, avatar: c.author.avatar },
        counts: { reactions, replies },
        root: root ? { id: root.id } : null,
        reacted,
      };
    })
  );

  return NextResponse.json({ items: result, nextCursor: hasMore ? items[items.length - 1].id : null, me: user });
}