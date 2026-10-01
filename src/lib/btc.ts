// Hardcoded BTC/USD rate. Change here to adjust.
export const BTC_USD_RATE = 65000;

export function btcToUsd(btc: number) {
  return btc * BTC_USD_RATE;
}
export function usdToBtc(usd: number) {
  return usd / BTC_USD_RATE;
}

export function formatUsd(n: number | string) {
  const v = typeof n === "string" ? parseFloat(n) : n;
  return v.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function formatBtc(n: number | string) {
  const v = typeof n === "string" ? parseFloat(n) : n;
  return `${v.toFixed(8)} BTC`;
}
