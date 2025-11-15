import { NextResponse } from "next/server";
import crypto from "crypto";

// MUST match what you entered on eBay.
// Must be 32–80 characters, only letters, numbers, _ or -
const VERIFICATION_TOKEN = process.env.EBAY_VERIFICATION_TOKEN!;

// IMPORTANT: must match EXACTLY what you submitted to eBay
const ENDPOINT_URL = "https://gameprice64.vercel.app/api/ebay-deletion";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const challengeCode = searchParams.get("challenge_code");

  if (!challengeCode) {
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }

  // Compute the SHA-256 hash: challenge + token + endpoint
  const hash = crypto.createHash("sha256");
  hash.update(challengeCode);
  hash.update(VERIFICATION_TOKEN);
  hash.update(ENDPOINT_URL);

  const responseHash = hash.digest("hex");

  return NextResponse.json({
    challengeResponse: responseHash
  });
}

export async function POST() {
  // eBay sends deletion notices with POST
  return NextResponse.json({ status: "received" }, { status: 200 });
}
