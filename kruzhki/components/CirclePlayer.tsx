"use client";
import React from "react";
import { OrbitThread } from "./OrbitThread";

type RootCircle = { id: string; mediaUrl: string; posterUrl: string };

export function CirclePlayer({ root }: { root: RootCircle }) {
  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <div className="relative aspect-square w-64 rounded-full overflow-hidden" style={{ maskImage: "radial-gradient(circle at center, #000 98%, transparent 100%)", WebkitMaskImage: "radial-gradient(circle at center, #000 98%, transparent 100%)" }}>
        <video src={root.mediaUrl} poster={root.posterUrl} playsInline muted controls={false} preload="metadata" className="w-full h-full object-cover" />
      </div>
      <OrbitThread rootId={root.id} />
    </div>
  );
}