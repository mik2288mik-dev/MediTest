import React from "react";

export function RingProgress({ progress, size = 96, stroke = 4, className = "" }: { progress: number; size?: number; stroke?: number; className?: string; }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = Math.min(Math.max(progress, 0), 1) * circumference;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className}>
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.3)" strokeWidth={stroke} fill="transparent" />
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="white" strokeWidth={stroke} fill="transparent" strokeDasharray={`${dash} ${circumference - dash}`} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    </svg>
  );
}