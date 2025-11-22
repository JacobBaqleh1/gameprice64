import { NextResponse } from "next/server";
import axios from "axios";
import { getEbayAccessToken } from "../../lib/ebay";

export async function POST(req: Request) {
  try {
    const { title, platform } = await req.json();

    console.log("[get-price] request for:", title, platform);

    if (!title) {
      return NextResponse.json({ error: "Missing game title" }, { status: 400 });
    }

    const query = `${title} ${platform || ""}`.replace("Unknown", "").trim();
    const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(
      query
    )}&limit=10`;

    console.log("[get-price] query url:", url);

    // get a fresh access token
    let token: string;
    try {
      token = await getEbayAccessToken();
      console.log("[get-price] obtained eBay token length:", token.length);
    } catch (err) {
      console.error("[get-price] failed to get eBay token:", (err as any)?.message ?? String(err));
      return NextResponse.json({ error: "Failed to obtain eBay token" }, { status: 500 });
    }

    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      validateStatus: () => true, // prevents axios from throwing >400
    });

    if (res.status >= 400) {
      console.warn("[get-price] eBay API error:", res.status, res.data);
      return NextResponse.json({ error: "eBay API returned an error", details: res.data }, { status: 500 });
    }

    const items = res.data?.itemSummaries;
    console.debug("[get-price] raw items count:", Array.isArray(items) ? items.length : 0);

    const mapped = (Array.isArray(items) ? items : []).map((it: any) => ({
      title: it.title,
      price: it.price?.value ?? null,
      currency: it.price?.currency ?? null,
      condition: it.condition ?? null,
      image: it.thumbnailImages?.[0]?.imageUrl ?? null,
      itemId: it.itemId,
      url: it.itemWebUrl ?? null,
      seller: it.seller?.username ?? null,
    }));

    // send an array of results instead of single lowest price
    return NextResponse.json({ prices: mapped });
  } catch (error: any) {
    console.error("[get-price] ERROR:", (error as any)?.response?.data ?? error);
    return NextResponse.json({ error: "Error fetching price" }, { status: 500 });
  }
}
