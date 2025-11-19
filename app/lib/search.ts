import axios from "axios";

export async function searchEbay(query:any) {
  const token = process.env.EBAY_AUTH_TOKEN;

  const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(
    query
  )}`;

  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return response.data;
}
