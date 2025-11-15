import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { imageData } = await req.json();
    if (!imageData) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    // Extract mimeType + base64
    const [meta, base64Data] = imageData.split(",");
    const mimeMatch = meta.match(/data:(.*);base64/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/png";

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // System + user instructions combined
    const prompt = `
You are a video game expert. Analyze the provided image of a video game cartridge, box art, or disc. Identify:
- title
- platform
- year (if visible or known)

Return ONLY valid JSON (no comments, no explanation):

{
  "title": "",
  "platform": "",
  "year": ""
}
`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
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

    const text = result.response.text();
console.log("GEMINI RAW RESPONSE:", text);
// Remove markdown fences like ```json
const cleaned = text
  .replace(/```json/g, "")
  .replace(/```/g, "")
  .trim();

    let parsed;
    try {

      parsed = JSON.parse(cleaned);
    } catch (err) {
        console.error("JSON parse failed:", cleaned);
      parsed = { title: "Unknown Game", platform: "Unknown", year: "" };
    }

    return NextResponse.json(parsed);

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
