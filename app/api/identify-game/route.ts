import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { imageData } = body;
    if (!imageData) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    // Template: send imageData to your AI vision provider here.
    // Replace this block with a real provider call (OpenAI Vision, Google Vision, etc.)
    // Must set process.env.AI_API_KEY and implement your provider call securely on server side.

    // MOCK fallback (if no provider configured): attempt to "guess" by filename or return Unknown
    if (!process.env.AI_API_KEY) {
      // Quick heuristic: if data URL contains a filename-like token, parse it (very naive)
      return NextResponse.json({ title: "Unknown Game", platform: "Unknown", year: "" });
    }

    // Example pseudo-call (fill with real provider API):
    /*
    const resp = await fetch("https://api.example.ai/vision", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.AI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: "You are a video game expert. Identify title/platform/year from image. Return JSON { title, platform, year }",
        image: imageData
      })
    });
    const json = await resp.json();
    return NextResponse.json({ title: json.title, platform: json.platform, year: json.year });
    */

    // default:
    return NextResponse.json({ title: "Unknown Game", platform: "Unknown", year: "" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "server error" }, { status: 500 });
  }
}
