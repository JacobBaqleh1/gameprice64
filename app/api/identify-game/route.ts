import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    console.info("[identify-game] POST received");

    const body = await req.json();
    console.debug("[identify-game] request body keys:", Object.keys(body || {}));

    const { imageData } = body;
    if (!imageData) {
      console.warn("[identify-game] no imageData in request");
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // detect mime type and base64
    const [meta, base64Data] = String(imageData).split(",");
    const mimeMatch = meta?.match(/data:(.*);base64/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const b64 = base64Data ?? String(imageData).replace(/^data:[^;]+;base64,/, "");

    console.info("[identify-game] detected mime:", mimeType);
    console.debug("[identify-game] base64 length:", b64?.length ?? 0);

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    console.debug("[identify-game] GEMINI_API_KEY present:", Boolean(apiKey));

    const genAI = new GoogleGenerativeAI(apiKey!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a video game expert. Analyze this image and return ONLY a JSON object with:\n{\n  "title": "...",\n  "platform": "...",\n  "year": "..."\n}\nIf unsure, guess based on the image.`;

    console.info("[identify-game] sending request to generative model");

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: `${prompt}\nIdentify this game.` },
            {
              inlineData: {
                mimeType,
                data: b64,
              },
            },
          ],
        },
      ],
    });

    console.debug("[identify-game] raw result keys:", Object.keys(result || {}));

    const text = typeof result?.response?.text === "function"
      ? await result.response.text()
      : String(result?.response ?? "");

    console.debug("[identify-game] model text length:", text?.length ?? 0);

    let identifiedGame: { title: string; platform: string; year: string };
    try {
      const match = text.match(/\{[\s\S]*\}/);
      const jsonText = match ? match[0] : text;
      identifiedGame = JSON.parse(jsonText);
    } catch (e) {
      console.warn("[identify-game] failed to parse JSON from model text", (e as any)?.message ?? String(e));
      identifiedGame = { title: "Unknown Game", platform: "Unknown", year: "" };
    }

    console.info("[identify-game] identified:", identifiedGame);

    // --- price lookup via eBay Browse API ---
    let priceData: null | {
      amount: string;
      currency: string;
      condition: string;
      image: string | null;
      itemId: string;
      url: string | null;
    } = null;

    try {
      if (identifiedGame.title && identifiedGame.title !== "Unknown Game") {
        console.info("[identify-game] fetching price for:", identifiedGame.title, identifiedGame.platform);

        const query = `${identifiedGame.title} ${identifiedGame.platform || ""}`.replace("Unknown", "").trim();
        const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(query)}&limit=10`;

        console.debug("[identify-game] eBay query url:", url);

        const res = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${process.env.EBAY_AUTH_TOKEN}`,
            "Content-Type": "application/json",
          },
          validateStatus: () => true,
        });

        console.info("[identify-game] eBay response status:", res.status);
        if (res.status >= 400) console.warn("[identify-game] eBay Error:", res.data);

        const items = res.data?.itemSummaries;
        if (Array.isArray(items)) console.debug("[identify-game] eBay items count:", items.length);
        if (Array.isArray(items) && items.length > 0) {
          const lowest = items
            .filter((i: any) => i?.price?.value)
            .sort((a: any, b: any) => Number(a.price.value) - Number(b.price.value))[0];

          if (lowest) {
            priceData = {
              amount: lowest.price.value,
              currency: lowest.price.currency,
              condition: lowest.condition || "Unknown",
              image: lowest.thumbnailImages?.[0]?.imageUrl || null,
              itemId: lowest.itemId,
              url: lowest.itemWebUrl || null,
            };
            console.info("[identify-game] selected lowest price:", priceData.amount, priceData.currency);
          }
        }
      }
    } catch (err) {
      console.error("[identify-game] Price fetch error:", (err as any)?.message ?? String(err));
    }

    return NextResponse.json({
      title: identifiedGame.title,
      platform: identifiedGame.platform,
      year: identifiedGame.year,
      price: priceData,
    });

  } catch (err: any) {
    console.error("[identify-game] error:", err?.message ?? err);
    return NextResponse.json({ error: err.message || "server error" }, { status: 500 });
  }
}
