import { NextResponse } from "next/server";

const VERIFICATION_TOKEN = process.env.EBAY_VERIFICATION_TOKEN;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // eBay sends: { challenge: "<token>" }
    if (body.challenge === VERIFICATION_TOKEN) {
      return NextResponse.json({ challengeResponse: VERIFICATION_TOKEN });
    }

    // For actual deletion notices - just return 200 so eBay approves your app
    return NextResponse.json({ status: "received" });
  } catch (error) {
    return NextResponse.json({ status: "ok" }); // still return 200 OK
  }
}

export async function GET() {
  // eBay may test GET too
  return NextResponse.json({ status: "ok" });
}
