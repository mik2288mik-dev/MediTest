import crypto from "crypto";

function getHmacHash(data: string, key: Buffer) {
  return crypto.createHmac("sha256", key).update(data).digest();
}

export function verifyTelegramInitData(initData: string, botToken: string): { ok: boolean; data?: Record<string, unknown> } {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get("hash");
    if (!hash) return { ok: false };
    urlParams.delete("hash");
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");

    const secretKey = crypto.createHash("sha256").update(botToken).digest();
    const hmac = getHmacHash(dataCheckString, secretKey).toString("hex");
    if (hmac !== hash) return { ok: false };

    const data: Record<string, unknown> = {};
    for (const [k, v] of urlParams.entries()) data[k] = v;
    if (typeof data.user === "string") {
      try {
        data.user = JSON.parse(data.user);
      } catch {}
    }
    return { ok: true, data };
  } catch {
    return { ok: false };
  }
}