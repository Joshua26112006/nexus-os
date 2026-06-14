"use client";

/**
 * Stock widget — a simulated ticker with live-updating prices and a sparkline.
 * Prices random-walk so the widget feels alive; no external market data.
 */

import { useEffect, useRef, useState } from "react";

interface Stock {
  symbol: string;
  price: number;
  history: number[];
}

const SEED: Stock[] = [
  { symbol: "NEXU", price: 412.5, history: [] },
  { symbol: "AIDC", price: 88.2, history: [] },
  { symbol: "QBIT", price: 1240.0, history: [] },
  { symbol: "VOLT", price: 56.7, history: [] },
];

export function StockWidget() {
  const [stocks, setStocks] = useState<Stock[]>(() =>
    SEED.map((s) => ({ ...s, history: Array(16).fill(s.price) })),
  );
  const prev = useRef<Record<string, number>>({});

  useEffect(() => {
    const t = setInterval(() => {
      setStocks((list) =>
        list.map((s) => {
          prev.current[s.symbol] = s.price;
          const drift = (Math.random() - 0.48) * s.price * 0.012;
          const price = Math.max(1, s.price + drift);
          return {
            ...s,
            price,
            history: [...s.history.slice(-15), price],
          };
        }),
      );
    }, 1500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex w-[230px] flex-col gap-2">
      <p className="text-sm font-semibold">Markets</p>
      {stocks.map((s) => {
        const change = s.price - (prev.current[s.symbol] ?? s.price);
        const up = change >= 0;
        return (
          <div key={s.symbol} className="flex items-center gap-2">
            <span className="w-12 text-xs font-medium">{s.symbol}</span>
            <Sparkline data={s.history} up={up} />
            <div className="w-16 text-right">
              <p className="text-xs tabular-nums">{s.price.toFixed(2)}</p>
              <p className={`text-[10px] tabular-nums ${up ? "text-emerald-400" : "text-rose-400"}`}>
                {up ? "▲" : "▼"} {Math.abs(change).toFixed(2)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 48;
      const y = 16 - ((v - min) / range) * 16;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width="48" height="16" className="flex-1">
      <polyline
        points={points}
        fill="none"
        stroke={up ? "rgb(52 211 153)" : "rgb(251 113 133)"}
        strokeWidth="1.5"
      />
    </svg>
  );
}
