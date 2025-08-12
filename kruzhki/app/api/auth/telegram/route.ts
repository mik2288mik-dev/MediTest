import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTelegramInitData } from "@/lib/telegram";
import { signJwt } from "@/lib/auth";

type TgUser = {
  id: number | string;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
};

export async function POST(req: NextRequest) {
  const { initData } = await req.json().catch(() => ({ initData: "" }));
  const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
  const check = verifyTelegramInitData(initData || "", botToken);
  const userRaw = (check.data as Record<string, unknown> | undefined)?.user;
  const tgUser = (userRaw && typeof userRaw === "object" ? (userRaw as TgUser) : null);
  if (!check.ok || !tgUser || !tgUser.id) {
    return NextResponse.json({ error: "invalid" }, { status: 401 });
  }

  const user = await prisma.user.upsert({
    where: { id: String(tgUser.id) },
    create: {
      id: String(tgUser.id),
      username: tgUser.username || null,
      fullName: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ") || null,
      avatar: tgUser.photo_url || null,
    },
    update: {
      username: tgUser.username || null,
      fullName: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ") || null,
      avatar: tgUser.photo_url || null,
    },
  });
  const token = await signJwt({ sub: user.id });
  const res = NextResponse.json({ ok: true, user });
  res.cookies.set("auth", token, {
    httpOnly: true,
    sameSite: "strict",
    secure: true,
    maxAge: 60 * 60 * 24,
    path: "/",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("auth", "", { httpOnly: true, sameSite: "strict", secure: true, maxAge: 0, path: "/" });
  return res;
}