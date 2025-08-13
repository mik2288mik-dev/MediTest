"use client";
import React, { useEffect, useRef, useState } from "react";
import { RingProgress } from "./RingProgress";

const MAX_SECONDS = 20;
const MIN_SECONDS = 8;

type Visibility = "CLOSE" | "FRIENDS" | "PUBLIC";

export function CircleRecorder() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [chunks, setChunks] = useState<BlobPart[]>([]);
  const [recording, setRecording] = useState(false);
  const [muted, setMuted] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>("PUBLIC");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    (async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: true,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    })();
    return () => {
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const start = () => {
    if (!mediaStreamRef.current) return;
    const recorder = new MediaRecorder(mediaStreamRef.current, {
      mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm",
      videoBitsPerSecond: 2500000,
      audioBitsPerSecond: 96000,
    });
    mediaRecorderRef.current = recorder;
    setChunks([]);
    setRecording(true);
    const startedAt = Date.now();
    const tick = () => {
      const elapsed = (Date.now() - startedAt) / 1000;
      setProgress(Math.min(elapsed / MAX_SECONDS, 1));
      if (elapsed >= MAX_SECONDS && recorder.state === "recording") {
        stop();
      } else if (recorder.state === "recording") {
        requestAnimationFrame(tick);
      }
    };

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) setChunks((prev) => [...prev, e.data]);
    };
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: recorder.mimeType });
      const durationSec = Math.round(await getVideoDuration(blob));
      if (durationSec < MIN_SECONDS || durationSec > MAX_SECONDS) {
        alert(`Длительность ${durationSec}s вне диапазона 8–20с`);
        return;
      }
      const poster = await generatePoster(blob);
      await uploadAndCreate(blob, poster, durationSec);
    };
    recorder.start(250);
    requestAnimationFrame(tick);
  };

  const stop = () => {
    if (!mediaRecorderRef.current) return;
    if (mediaRecorderRef.current.state !== "inactive") mediaRecorderRef.current.stop();
    setRecording(false);
  };

  const uploadAndCreate = async (videoBlob: Blob, posterDataUrl: string, duration: number) => {
    const ext = videoBlob.type.includes("mp4") ? "mp4" : "webm";
    const filename = `circle_${Date.now()}.${ext}`;
    const initRes = await fetch("/api/upload/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, contentType: videoBlob.type }),
    });
    if (!initRes.ok) {
      alert("Upload init failed");
      return;
    }
    const { uploadUrl, publicUrl } = await initRes.json();
    await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": videoBlob.type }, body: videoBlob });

    // upload poster
    const posterBlob = await (await fetch(posterDataUrl)).blob();
    const posterInit = await fetch("/api/upload/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: `poster_${Date.now()}.png`, contentType: "image/png" }),
    });
    const posterData = await posterInit.json();
    await fetch(posterData.uploadUrl, { method: "PUT", headers: { "Content-Type": "image/png" }, body: posterBlob });

    const create = await fetch("/api/circle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaUrl: publicUrl, posterUrl: posterData.publicUrl, duration, visibility }),
    });
    if (create.ok) {
      alert("Опубликовано");
      location.href = "/feed";
    } else {
      alert("Ошибка публикации");
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative aspect-square rounded-full overflow-hidden bg-black" style={{ maskImage: "radial-gradient(circle at center, #000 98%, transparent 100%)", WebkitMaskImage: "radial-gradient(circle at center, #000 98%, transparent 100%)" }}>
        <video ref={videoRef} muted={muted} playsInline className="w-full h-full object-cover" />
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <RingProgress progress={progress} size={240} stroke={8} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        {!recording ? (
          <button onClick={start} className="px-4 py-2 rounded-full bg-blue-600 text-white">Start</button>
        ) : (
          <button onClick={stop} className="px-4 py-2 rounded-full bg-red-600 text-white">Stop</button>
        )}
        <button onClick={() => setMuted((m) => !m)} className="px-3 py-2 rounded-md border">{muted ? "Unmute" : "Mute"}</button>
        <select value={visibility} onChange={(e) => setVisibility(e.target.value as Visibility)} className="border rounded-md px-2 py-2">
          <option value="CLOSE">CLOSE</option>
          <option value="FRIENDS">FRIENDS</option>
          <option value="PUBLIC">PUBLIC</option>
        </select>
      </div>
    </div>
  );
}

async function getVideoDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const el = document.createElement("video");
    el.preload = "metadata";
    el.src = URL.createObjectURL(blob);
    el.onloadedmetadata = () => {
      resolve(el.duration);
      URL.revokeObjectURL(el.src);
    };
  });
}

async function generatePoster(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(blob);
    video.muted = true;
    video.playsInline = true;
    video.addEventListener("loadeddata", () => {
      const canvas = document.createElement("canvas");
      const size = 512;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const s = Math.min(vw, vh);
      const sx = (vw - s) / 2;
      const sy = (vh - s) / 2;
      ctx.drawImage(video, sx, sy, s, s, 0, 0, size, size);
      resolve(canvas.toDataURL("image/png"));
      URL.revokeObjectURL(video.src);
    });
  });
}