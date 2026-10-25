import { useEffect, useRef, useState } from "react";
import type { Candle } from "@/lib/market.functions";

export function CandleChart({ candles }: { candles: Candle[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<Candle | null>(null);
  const last = candles[candles.length - 1];

  useEffect(() => {
    if (!ref.current) return;
    let disposed = false;
    let cleanup = () => {};
    import("lightweight-charts").then(({ createChart, CandlestickSeries, HistogramSeries, ColorType }) => {
      if (disposed || !ref.current) return;
      const css = getComputedStyle(document.documentElement);
      const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
      // Convert design tokens (oklch) to rgba, which the chart library can parse.
      const v = (n: string) => {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = css.getPropertyValue(n).trim();
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        return `rgba(${r},${g},${b},${((a ?? 255) / 255).toFixed(3)})`;
      };
      const chart = createChart(ref.current, {
        autoSize: true,
        layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: v("--muted-foreground"), fontFamily: "JetBrains Mono, monospace" },
        grid: { vertLines: { color: v("--grid-line") }, horzLines: { color: v("--grid-line") } },
        rightPriceScale: { borderColor: v("--grid-line") },
        timeScale: { borderColor: v("--grid-line") },
      });
      const up = v("--gain"), down = v("--loss");
      const cs = chart.addSeries(CandlestickSeries, { upColor: up, downColor: down, wickUpColor: up, wickDownColor: down, borderVisible: false });
      cs.setData(candles.map((c) => ({ time: c.time as never, open: c.open, high: c.high, low: c.low, close: c.close })));
      const vs = chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceScaleId: "vol" });
      chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
      vs.setData(candles.map((c) => ({ time: c.time as never, value: c.volume, color: c.close >= c.open ? v("--gain-soft") : v("--loss-soft") })));
      chart.timeScale().fitContent();
      chart.subscribeCrosshairMove((p) => {
        if (!p.time) return setHover(null);
        setHover(candles.find((c) => c.time === p.time) ?? null);
      });
      cleanup = () => chart.remove();
    });
    return () => { disposed = true; cleanup(); };
  }, [candles]);

  const c = hover ?? last;
  return (
    <div>
      {c && (
        <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
          <span>{new Date(c.time * 1000).toLocaleDateString("id-ID")}</span>
          <span>O <b className="text-foreground">{c.open.toFixed(2)}</b></span>
          <span>H <b className="text-foreground">{c.high.toFixed(2)}</b></span>
          <span>L <b className="text-foreground">{c.low.toFixed(2)}</b></span>
          <span>C <b className="text-foreground">{c.close.toFixed(2)}</b></span>
          <span>Vol <b className="text-foreground">{(c.volume / 1e6).toFixed(2)}M</b></span>
        </div>
      )}
      <div ref={ref} className="h-72 w-full md:h-96" />
    </div>
  );
}
