import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getMarketData } from "@/lib/market.functions";
import { CandleChart } from "@/components/CandleChart";
import { HOLDINGS, fmtIdr, fmtUsd, impliedShares, simulate, totalValue } from "@/lib/portfolio";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Portofolio Saham US — PLTR & MU" },
      { name: "description", content: "Pantau portofolio PLTR dan MU: harga USD, nilai IDR, grafik candlestick, dan simulasi perubahan." },
      { property: "og:title", content: "Portofolio Saham US — PLTR & MU" },
      { property: "og:description", content: "Harga saham, grafik lilin, dan simulasi nilai portofolio dalam rupiah." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const NAMES: Record<string, string> = { PLTR: "Palantir Technologies", MU: "Micron Technology" };

function Pct({ v }: { v: number }) {
  return <span className={v >= 0 ? "text-gain" : "text-loss"}>{v >= 0 ? "+" : ""}{v.toFixed(2)}%</span>;
}

function Index() {
  const [pct, setPct] = useState(2);
  const { data, error, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ["market"],
    queryFn: () => getMarketData(),
    refetchInterval: 60_000,
  });

  const total = totalValue(HOLDINGS.map((h) => h.valueIdr));
  const dayDelta = data
    ? HOLDINGS.reduce((s, h) => s + simulate(h.valueIdr, data.quotes.find((q) => q.symbol === h.symbol)!.changePct).delta, 0)
    : 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary">Portofolio Pribadi</p>
          <h1 className="font-display text-3xl font-bold md:text-4xl">Saham US</h1>
        </div>
        <div className="text-right font-mono text-xs text-muted-foreground">
          <div className="flex items-center justify-end gap-2">
            <span className={`h-2 w-2 rounded-full ${isFetching ? "bg-primary animate-pulse" : error ? "bg-loss" : "bg-gain"}`} />
            {dataUpdatedAt ? `Diperbarui ${new Date(dataUpdatedAt).toLocaleTimeString("id-ID")}` : "Memuat…"}
          </div>
          <div>Pembaruan otomatis tiap 60 detik</div>
        </div>
      </header>

      <div className="mb-6 rounded-lg border border-border bg-card/60 p-3 text-xs text-muted-foreground">
        Sumber data: Yahoo Finance (gratis, tanpa API key). Harga bisa <b className="text-foreground">tertunda hingga ±15 menit</b> dan
        di luar jam bursa menampilkan harga penutupan terakhir. Nilai di bagian "Simulasi" adalah hipotetis, bukan harga pasar.
      </div>

      {error && <div className="mb-6 rounded-lg border border-loss/40 bg-loss/10 p-3 text-sm text-loss">Gagal memuat data pasar: {(error as Error).message}</div>}

      <section className="card-glow mb-6 rounded-2xl border border-border bg-card p-5 md:p-7">
        <p className="text-sm text-muted-foreground">Total Nilai Portofolio</p>
        <p className="mt-1 font-mono text-3xl font-bold md:text-5xl">{fmtIdr(total)}</p>
        {data && (
          <p className="mt-2 font-mono text-sm">
            <span className={dayDelta >= 0 ? "text-gain" : "text-loss"}>{dayDelta >= 0 ? "+" : ""}{fmtIdr(dayDelta)}</span>
            <span className="text-muted-foreground"> estimasi perubahan hari ini · USD/IDR {data.usdIdr.toLocaleString("id-ID", { maximumFractionDigits: 2 })}</span>
          </p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {HOLDINGS.map((h) => {
          const q = data?.quotes.find((x) => x.symbol === h.symbol);
          const share = (h.valueIdr / total) * 100;
          return (
            <section key={h.symbol} className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-bold">{h.symbol}</h2>
                  <p className="text-xs text-muted-foreground">{NAMES[h.symbol]}</p>
                </div>
                <div className="text-right font-mono">
                  <p className="text-xl font-semibold">{q ? fmtUsd(q.price) : "—"}</p>
                  <p className="text-sm">{q ? <Pct v={q.changePct} /> : "…"}</p>
                </div>
              </div>
              <dl className="mb-4 grid grid-cols-3 gap-2 font-mono text-xs">
                <div className="rounded-md bg-muted p-2"><dt className="text-muted-foreground">Nilai</dt><dd className="mt-1 text-foreground">{fmtIdr(h.valueIdr)}</dd></div>
                <div className="rounded-md bg-muted p-2"><dt className="text-muted-foreground">Porsi</dt><dd className="mt-1 text-foreground">{share.toFixed(2)}%</dd></div>
                <div className="rounded-md bg-muted p-2"><dt className="text-muted-foreground">Est. lembar</dt><dd className="mt-1 text-foreground">{q && data ? impliedShares(h.valueIdr, q.price, data.usdIdr).toFixed(6) : "—"}</dd></div>
              </dl>
              {q && <p className="mb-2 font-mono text-[11px] text-muted-foreground">Waktu harga bursa: {new Date(q.marketTime * 1000).toLocaleString("id-ID")} · Grafik harian 6 bulan</p>}
              {q ? <CandleChart candles={q.candles} /> : <div className="h-72 animate-pulse rounded-md bg-muted md:h-96" />}
            </section>
          );
        })}
      </div>

      <section className="mt-6 rounded-2xl border border-dashed border-primary/50 bg-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-primary">Simulasi — bukan data pasar</p>
            <h2 className="font-display text-xl font-bold">Skenario ±{pct}%</h2>
          </div>
          <div className="flex gap-2">
            {[1, 2, 5, 10].map((p) => (
              <button key={p} onClick={() => setPct(p)} className={`rounded-md px-3 py-1.5 font-mono text-sm transition ${pct === p ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>±{p}%</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] font-mono text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr><th className="py-2">Aset</th><th>Nilai kini</th><th className="text-gain">+{pct}%</th><th className="text-loss">−{pct}%</th></tr>
            </thead>
            <tbody>
              {[...HOLDINGS, { symbol: "TOTAL", valueIdr: total }].map((h) => {
                const u = simulate(h.valueIdr, pct), d = simulate(h.valueIdr, -pct);
                return (
                  <tr key={h.symbol} className={`border-t border-border ${h.symbol === "TOTAL" ? "font-bold" : ""}`}>
                    <td className="py-3">{h.symbol}</td>
                    <td>{fmtIdr(h.valueIdr)}</td>
                    <td><div>{fmtIdr(u.newValue)}</div><div className="text-xs text-gain">+{fmtIdr(u.delta)}</div></td>
                    <td><div>{fmtIdr(d.newValue)}</div><div className="text-xs text-loss">{fmtIdr(d.delta)}</div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="mt-8 text-center text-xs text-muted-foreground">
        Grafik oleh TradingView Lightweight Charts™ · Bukan saran investasi
      </footer>
    </main>
  );
}
