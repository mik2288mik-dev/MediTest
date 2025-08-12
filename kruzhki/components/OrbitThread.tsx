"use client";
import React, { useEffect, useState } from "react";

type OrbitItem = { ring: number; circle: { id: string; mediaUrl: string; posterUrl: string } };

export function OrbitThread({ rootId }: { rootId: string }) {
  const [items, setItems] = useState<OrbitItem[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/orbit?rootId=${encodeURIComponent(rootId)}`);
      const data: { items: OrbitItem[] } = await res.json();
      setItems(data.items || []);
    })();
  }, [rootId]);

  return (
    <div className="relative w-[420px] h-[420px]">
      {items.map((it) => (
        <div key={it.circle.id} className="absolute inset-0 flex items-center justify-center" style={{ transform: `scale(${1 + it.ring * 0.3})` }}>
          <video src={it.circle.mediaUrl} poster={it.circle.posterUrl} muted playsInline preload="metadata" className="w-40 h-40 rounded-full object-cover" />
        </div>
      ))}
    </div>
  );
}