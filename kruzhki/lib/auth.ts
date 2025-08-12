import { cookies } from "next/headers";
import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { prisma } from "./prisma";
import type { User } from "@prisma/client";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret");

export async function signJwt(payload: Record<string, unknown>, expiresIn = "24h") {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setExpirationTime(expiresIn).sign(JWT_SECRET);
}

export async function verifyJwt(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload;
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth")?.value;
  if (!token) return null;
  try {
    const payload = await verifyJwt(token);
    const sub = String(payload.sub || "");
    if (!sub) return null;
    const user = await prisma.user.findUnique({ where: { id: sub } });
    return user;
    } catch {
    return null;
  }
}