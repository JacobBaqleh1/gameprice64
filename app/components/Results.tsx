"use client";
import { useEffect, useState } from "react";
import { calculateAverage, parsePrice } from "../lib/prices";

interface PriceData {
  marketplace: string;
  price: string;
  condition?: string;
  url: string;
}

interface GameData {
  title: string;
  platform: string;
  year?: string;
  imageUrl?: string;
}

export default function Results({
  imageData,
  onReset
}: {
  imageData: string;
  onReset: () => void;
}) {
  const [loadingIdentify, setLoadingIdentify] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [game, setGame] = useState<GameData | null>(null);
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // STEP 1 → Identify the game
  useEffect(() => {
    async function identify() {
      setLoadingIdentify(true);
      setError(null);

      try {
        const res = await fetch("/api/identify-game", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageData }),
        });

        if (!res.ok) throw new Error("Failed to identify game");

        const json = await res.json();
        const identified = {
          title: json.title || "Unknown",
          platform: json.platform || "Unknown",
          year: json.year || "",
        };

        setGame(identified);
      } catch (err: any) {
        setError(err.message || "Identify failed");
      } finally {
        setLoadingIdentify(false);
      }
    }

    identify();
  }, [imageData]);

  // STEP 2 → Fetch price after game is identified
  useEffect(() => {
    if (!game) return;
    if (game.title === "Unknown" || game.platform === "Unknown") return;

    async function fetchPrices() {
      setLoadingPrices(true);

      try {
        const res = await fetch("/api/get-price", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: game?.title,
            platform: game?.platform,
          }),
        });

        if (!res.ok) throw new Error("Failed to fetch price data");

        const json = await res.json();

        // debug: inspect API response shape
        console.debug("[Results] /api/get-price response:", json);

        let fetchedPrices: PriceData[] = [];
        if (Array.isArray(json.prices)) {
          fetchedPrices = json.prices;
        } else if (json.price && typeof json.price === "object") {
          const p = json.price;
          fetchedPrices = [
            {
              marketplace: "eBay",
              price: p.amount ? `${p.amount} ${p.currency ?? ""}`.trim() : "0",
              condition: p.condition ?? undefined,
              url: p.url ?? p.itemWebUrl ?? "",
            },
          ];
        } else {
          fetchedPrices = [];
        }

        setPrices(fetchedPrices);
      } catch (err: any) {
        setError(err.message || "Price fetch failed");
      } finally {
        setLoadingPrices(false);
      }
    }

    fetchPrices();
  }, [game]);

  const numericPrices = prices
    .map((p) => parsePrice(p.price))
    .filter(Boolean) as number[];

  const avg =
    numericPrices.length > 0 ? calculateAverage(numericPrices) : null;

  return (
    <div>
      <div className="flex items-start gap-4 mb-6">
        <img
          src={imageData}
          alt="capture"
          width={200}
          height={200}
          className="rounded bg-black"
        />

        <div className="flex-1">
          {loadingIdentify ? (
            <div>Analyzing...</div>
          ) : (
            <>
              <h2 style={{ fontSize: 28 }} className="font-bold">
                {game?.title}
              </h2>
              <div className="text-gray-400">
                {game?.platform} • {game?.year}
              </div>
            </>
          )}

          {error && <div className="text-red-400 mt-2">{error}</div>}

          <button
            onClick={onReset}
            className="px-3 py-1 rounded bg-[#111] mt-4"
          >
            Scan Another Game
          </button>
        </div>
      </div>

      {/* Average price card */}
      <div className="mb-6">
        <div className="p-4 bg-[#0f1720] rounded">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-300">
                Average Market Value
              </div>
              <div className="text-2xl font-bold">
                {avg !== null ? `$${avg.toFixed(2)}` : "—"}
              </div>
            </div>
            <div className="text-green-400">▲ Trending</div>
          </div>
        </div>
      </div>

      {/* Price list */}
      <div className="grid gap-4">
        {loadingPrices && <div>Loading marketplace prices...</div>}

        {prices.map((p) => (
          <div
            key={p.marketplace}
            className="p-3 bg-[#0b0b0d] rounded flex justify-between items-center"
          >
            <div>
              <div className="font-semibold">{p.marketplace}</div>
              <div className="text-sm text-gray-400">
                {p.condition || "Condition unknown"}
              </div>
            </div>

            <div className="text-right">
              <div className="text-xl font-bold">{p.price}</div>
              <a
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm underline mt-1 inline-block"
              >
                View
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
