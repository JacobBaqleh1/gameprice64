"use client";
import { useEffect, useState } from "react";
import { calculateAverage, parsePrice } from "../lib/prices";

interface PriceData { marketplace: string; price: string; condition?: string; url: string; }
interface GameData { title: string; platform: string; year?: string; imageUrl?: string; }

export default function Results({ imageData, onReset }: { imageData: string; onReset: () => void }) {
  const [loadingIdentify, setLoadingIdentify] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [game, setGame] = useState<GameData | null>(null);
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function identify() {
      setLoadingIdentify(true);
      setError(null);
      try {
        const res = await fetch("/api/identify-game", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageData })
        });
        if (!res.ok) throw new Error("Failed to identify game");
        const json = await res.json();
        setGame({ title: json.title || "Unknown", platform: json.platform || "Unknown", year: json.year });
      } catch (err: any) {
        setError(err.message || "Identify failed");
      } finally { setLoadingIdentify(false); }
    }
    identify();
  }, [imageData]);

  useEffect(() => {
    if (!game) return;
    async function fetchPrices() {
      setLoadingPrices(true);
      try {
        const res = await fetch("/api/fetch-prices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: game.title, platform: game.platform })
        });
        if (!res.ok) throw new Error("Failed to fetch prices");
        const json = await res.json();
        setPrices(json.prices || []);
      } catch (err: any) {
        setError(err.message || "Price fetch failed");
      } finally { setLoadingPrices(false); }
    }
    fetchPrices();
  }, [game]);

  const numericPrices = prices.map(p => parsePrice(p.price)).filter(Boolean) as number[];
  const avg = numericPrices.length ? calculateAverage(numericPrices) : null;

  return (
    <div>
      <div className="flex items-start gap-4 mb-6">
        <img src={imageData} alt="capture" width={200} height={200} className="rounded bg-black" />
        <div className="flex-1">
          {loadingIdentify ? <div>Analyzing...</div> : (
            <>
              <h2 style={{ fontSize: 28 }} className="font-bold">{game?.title}</h2>
              <div className="text-gray-400">{game?.platform} • {game?.year}</div>
            </>
          )}
          {error && <div className="text-red-400 mt-2">{error}</div>}
          <div className="mt-4">
            <button onClick={onReset} className="px-3 py-1 rounded bg-[#111]">Scan Another Game</button>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="p-4 bg-[#0f1720] rounded">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-300">Average Market Value</div>
              <div className="text-2xl font-bold">{avg !== null ? `$${avg.toFixed(2)}` : "—"}</div>
            </div>
            <div className="text-green-400">▲ Trending</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {loadingPrices && <div>Loading marketplace prices...</div>}
        {prices.map((p) => (
          <div key={p.marketplace} className="p-3 bg-[#0b0b0d] rounded flex justify-between items-center">
            <div>
              <div className="font-semibold">{p.marketplace}</div>
              <div className="text-sm text-gray-400">{p.condition || "Condition unknown"}</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">{p.price}</div>
              <a href={p.url} target="_blank" rel="noreferrer" className="text-sm underline mt-1 inline-block">View</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
