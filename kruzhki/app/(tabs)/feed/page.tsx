"use client";
import { useEffect, useState } from "react";
import { CircleCard } from "@/components/CircleCard";
import type { FeedItem } from "@/lib/types";

export default function FeedPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [mode, setMode] = useState<"global" | "friends" | "nearby">("global");
  const [loading, setLoading] = useState(false);

  const load = async (reset = false) => {
    if (loading) return;
    setLoading(true);
    const params = new URLSearchParams({ mode, limit: "12" });
    if (!reset && cursor) params.set("cursor", cursor);
    const res = await fetch(`/api/feed?${params.toString()}`, { cache: "no-store" });
    const data: { items: FeedItem[]; nextCursor?: string | null } = await res.json();
    setItems(reset ? data.items : [...items, ...data.items]);
    setCursor(data.nextCursor || null);
    setLoading(false);
  };

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return (
    <div className="p-4 space-y-6">
      <div className="flex gap-2">
        {(["global", "friends", "nearby"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={`px-3 py-1 rounded-full border ${mode === m ? "bg-black text-white dark:bg-white dark:text-black" : ""}`}>{m}</button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {items.map((item) => (
          <CircleCard key={item.circle.id} item={item} />
        ))}
      </div>
      <div className="flex justify-center">
        <button disabled={loading || !cursor} onClick={() => load()} className="px-4 py-2 rounded-md border disabled:opacity-50">{loading ? "Loading..." : cursor ? "Load more" : "No more"}</button>
      </div>
    </div>
  );
}