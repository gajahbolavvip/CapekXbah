export type Holding = { symbol: string; valueIdr: number };

export const HOLDINGS: Holding[] = [
  { symbol: "PLTR", valueIdr: 41540.507 },
  { symbol: "MU", valueIdr: 9584.553 },
];

export function totalValue(values: number[]) {
  return values.reduce((a, b) => a + b, 0);
}

/** Change in IDR for a percentage move (e.g. 2 = +2%). */
export function simulate(valueIdr: number, pct: number) {
  const delta = (valueIdr * pct) / 100;
  return { delta, newValue: valueIdr + delta };
}

/** Implied number of shares held, given IDR value, USD price and USD/IDR rate. */
export function impliedShares(valueIdr: number, priceUsd: number, usdIdr: number) {
  if (!priceUsd || !usdIdr) return 0;
  return valueIdr / (priceUsd * usdIdr);
}

export const fmtIdr = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
export const fmtUsd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
