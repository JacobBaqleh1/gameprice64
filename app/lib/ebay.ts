import axios from "axios";

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export async function getEbayAccessToken(): Promise<string> {
  const clientId = process.env.EBAY_CLIENT_ID || process.env.EBAY_APP_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET || process.env.EBAY_CERT_ID;

  if (!clientId || !clientSecret) {
    throw new Error("Missing EBAY_CLIENT_ID or EBAY_CLIENT_SECRET in env");
  }

  const now = Date.now();
  // reuse cached token if not near expiry
  if (cachedToken && now < tokenExpiresAt - 5000) return cachedToken as string;

  const tokenUrl = "https://api.ebay.com/identity/v1/oauth2/token";
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  // request the basic API scope for buying/browse
  params.append("scope", "https://api.ebay.com/oauth/api_scope");

  const resp = await axios.post(tokenUrl, params.toString(), {
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const data = resp.data;
  if (!data?.access_token || !data?.expires_in) {
    throw new Error("Failed to obtain eBay access token");
  }

  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;

  return cachedToken as string;
}
