import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: Request) {
  try {
    const { title, platform } = await req.json();

    if (!title) {
      return NextResponse.json(
        { error: "Missing game title" },
        { status: 400 }
      );
    }

    const query = `${title} ${platform || ""}`;
    const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(
      query
    )}&limit=10`;

    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${process.env.EBAY_AUTH_TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    const items = res.data?.itemSummaries;

    let lowest = null;
    if (items?.length > 0) {
      lowest = items
        .filter((i: any) => i?.price?.value)
        .sort(
          (a: any, b: any) =>
            Number(a.price.value) - Number(b.price.value)
        )[0];
    }

    return NextResponse.json({
      price: lowest
        ? {
            amount: lowest.price.value,
            currency: lowest.price.currency,
            condition: lowest.condition,
            image: lowest.thumbnailImages?.[0]?.imageUrl,
            itemId: lowest.itemId
          }
        : null
    });
  } catch (error: any) {
    console.log("PRICE API ERROR:", error.response?.data || error);
    return NextResponse.json(
      { error: "Error fetching price" },
      { status: 500 }
    );
  }
}
