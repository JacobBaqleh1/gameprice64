import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { imageData } = await req.json();

    if (!imageData) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const [meta, base64Data] = imageData.split(",");
    const mimeMatch = meta.match(/data:(.*);base64/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemPrompt = `
      You are a video game expert. Analyze images of video games and identify:
      - title
      - platform
      - year
      Return ONLY valid JSON in this exact shape:
      {
        "title": "...",
        "platform": "...",
        "year": "..."
      }
    `;

    const result = await model.generateContent({
      contents: [
        {
          role: "system",
          parts: [{ text: systemPrompt }]
        },
        {
          role: "user",
          parts: [
            { text: "Identify this game." },
            {
              inlineData: {
                mimeType,
                data: base64Data
              }
            }
          ]
        }
      ]
    });

    const text = result.response.text().trim();

    let identifiedGame;
    try {
      identifiedGame = JSON.parse(text);
    } catch {
      identifiedGame = { title: "Unknown Game", platform: "Unknown", year: "" };
    }

    //
    // ⬇️ NEW PART: After identifying the game, call the price API
    //
    const priceResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/get-price`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: identifiedGame.title,
          platform: identifiedGame.platform
        })
      }
    );

    const priceData = await priceResponse.json();

    return NextResponse.json({
      game: identifiedGame,
      price: priceData.price || null
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "server error" },
      { status: 500 }
    );
  }
}
