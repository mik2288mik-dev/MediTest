"use client";
import { useEffect, useState } from "react";
import type { FeedItem } from "@/lib/types";

type Me = { id: string; username: string | null; fullName: string | null; avatar: string | null } | null;

export default function MePage() {
  const [me, setMe] = useState<Me>(null);
  const [items, setItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/feed?mode=global&limit=100");
      const data: { items: FeedItem[]; me: Me } = await res.json();
      const myId = data.me?.id || null;
      setMe(data.me || null);
      setItems(data.items.filter((i) => i.author.id === myId));
    })();
  }, []);

  const clearExpired = async () => {
    await fetch("/api/circle", { method: "DELETE" });
    location.reload();
  };

  const logout = async () => {
    await fetch("/api/auth/telegram", { method: "DELETE" });
    location.href = "/feed";
  };

  return (
    <div className="p-4 space-y-4">
      {me && (
        <div className="flex items-center gap-3">
          <img src={me.avatar || "/avatar.png"} alt="avatar" className="w-16 h-16 rounded-full object-cover" />
          <div>
            <div className="font-semibold">{me.fullName || me.username || me.id}</div>
            <div className="text-sm opacity-70">@{me.username || "anon"}</div>
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={clearExpired} className="px-3 py-1 rounded-md border">Очистить истёкшие</button>
        <button onClick={logout} className="px-3 py-1 rounded-md border">Выход</button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {items.map((it) => (
          <video key={it.circle.id} src={it.circle.mediaUrl} className="aspect-square rounded-full object-cover" muted playsInline preload="metadata" />
        ))}
      </div>
    </div>
  );
}