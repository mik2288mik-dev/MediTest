"use client";
import React, { useEffect, useRef, useState } from "react";
import { RingProgress } from "./RingProgress";
import type { FeedItem } from "@/lib/types";

export function CircleCard({ item }: { item: FeedItem }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [reacted, setReacted] = useState<boolean>(item.reacted || false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTime = () => {
      if (video.duration) setProgress(video.currentTime / video.duration);
    };
    video.addEventListener("timeupdate", onTime);
    return () => video.removeEventListener("timeupdate", onTime);
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.play().catch(() => {});
          } else {
            el.pause();
          }
        });
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.play();
    } else {
      el.pause();
    }
  };

  const toggleReact = async () => {
    try {
      const res = await fetch("/api/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ circleId: item.circle.id }),
      });
      const data: { reacted: boolean } = await res.json();
      setReacted(data.reacted);
    } catch {}
  };

  return (
    <div className="relative aspect-square rounded-full overflow-hidden" style={{ maskImage: "radial-gradient(circle at center, #000 98%, transparent 100%)", WebkitMaskImage: "radial-gradient(circle at center, #000 98%, transparent 100%)" }}>
      <video
        ref={videoRef}
        src={item.circle.mediaUrl}
        poster={item.circle.posterUrl}
        playsInline
        muted
        preload="metadata"
        className="w-full h-full object-cover"
        onClick={togglePlay}
      />
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <RingProgress progress={progress} size={120} stroke={6} />
      </div>
      <button onClick={toggleReact} className="absolute right-2 bottom-2 z-10 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
        {reacted ? "⚡" : "☆"}
      </button>
    </div>
  );
}