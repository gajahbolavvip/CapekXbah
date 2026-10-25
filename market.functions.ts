import { createServerFn } from "@tanstack/react-start";

export type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };
export type Quote = {
  symbol: string;
  price: number;
  prevClose: number;
  changePct: number;
  marketTime: number;
  candles: Candle[];
};

async function fetchChart(symbol: string, range: string, interval: string): Promise<Quote> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`Gagal mengambil ${symbol}: ${res.status}`);
  const json = await res.json();
  const r = json.chart?.result?.[0];
  if (!r) throw new Error(`Data ${symbol} kosong`);
  const m = r.meta;
  const q = r.indicators?.quote?.[0] ?? {};
  const ts: number[] = r.timestamp ?? [];
  const candles: Candle[] = [];
  ts.forEach((t, i) => {
    const o = q.open?.[i], h = q.high?.[i], l = q.low?.[i], c = q.close?.[i];
    if (o == null || h == null || l == null || c == null) return;
    candles.push({ time: t, open: o, high: h, low: l, close: c, volume: q.volume?.[i] ?? 0 });
  });
  const price = m.regularMarketPrice;
  const prevClose = m.chartPreviousClose ?? m.previousClose ?? price;
  const changePct = typeof m.regularMarketChangePercent === "number"
    ? m.regularMarketChangePercent
    : ((price - prevClose) / prevClose) * 100;
  return { symbol, price, prevClose, changePct, marketTime: m.regularMarketTime, candles };
}

export const getMarketData = createServerFn({ method: "GET" }).handler(async () => {
  const [pltr, mu, fx] = await Promise.all([
    fetchChart("PLTR", "6mo", "1d"),
    fetchChart("MU", "6mo", "1d"),
    fetchChart("IDR=X", "5d", "1d"),
  ]);
  return { quotes: [pltr, mu], usdIdr: fx.price, fxTime: fx.marketTime, fetchedAt: Date.now() };
});
