"use client";
import { useState } from "react";
import CameraScanner from "./components/CameraScanner";
import Results from "./components/Results";
import Liz from "./components/Liz";

export default function Home() {
  const [imageData, setImageData] = useState<string | null>(null);
  const [game, setGame] = useState(null);

  return (
    <div>
      <header className="mt-8 mb-6">
        <Liz  />
        <h1 style={{ fontSize: 48 }} className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-pink-400">
          GamePrice64
        </h1>
        <p className="text-gray-300 mt-2">Snap a photo of any video game and instantly discover its value across multiple marketplaces</p>
      </header>

      {!imageData && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-[#0d0d12] rounded-lg">AI Powered Recognition</div>
            <div className="p-4 bg-[#0d0d12] rounded-lg">5+ Marketplaces</div>
            <div className="p-4 bg-[#0d0d12] rounded-lg">Instant Price Check</div>
          </div>

          <CameraScanner
            onCapture={(dataUrl) => {
              setImageData(dataUrl);
            }}
          />
        </div>
      )}

      {imageData && (
        <Results
          imageData={imageData}
          onReset={() => {
            setImageData(null);
            setGame(null);
          }}
        />
      )}
    </div>
  );
}
