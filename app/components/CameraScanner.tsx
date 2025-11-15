"use client";
import { useEffect, useRef, useState } from "react";

export default function CameraScanner({ onCapture }: { onCapture: (dataUrl: string) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function start() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (err) {
        setError("Camera access denied or not available.");
      }
    }
    start();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    // keep aspect ratio, width 1024
    canvas.width = 1024;
    canvas.height = Math.round((1024 / video.videoWidth) * video.videoHeight || 768);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    // stop stream early
    stream?.getTracks().forEach((t) => t.stop());
    onCapture(dataUrl);
  };

  const handleUpload: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please upload an image.");
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onCapture(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      {error && <div className="text-red-400">{error}</div>}
      <div className="bg-[#0d0d12] rounded-lg p-3">
        <video ref={videoRef} autoPlay muted playsInline className="w-full rounded" style={{ background: "#000" }} />
      </div>
      <div className="flex gap-3">
        <button onClick={handleCapture} className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-pink-400 text-black font-bold">Capture Photo</button>
        <label className="px-4 py-2 rounded-lg bg-[#111] border cursor-pointer">
          Upload
          <input onChange={handleUpload} type="file" accept="image/*" className="hidden" />
        </label>
      </div>
    </div>
  );
}
