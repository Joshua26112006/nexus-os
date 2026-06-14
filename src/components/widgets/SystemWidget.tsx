"use client";

/**
 * System Monitor widget — live CPU / memory / network readouts.
 *
 * Values are simulated with smooth random-walk motion (no real metrics are
 * available to a browser tab), plus a real count of open windows from the
 * window store so at least one figure reflects actual OS state.
 */

import { useEffect, useState } from "react";
import { useWindowStore } from "@/store/window-store";

interface Metrics {
  cpu: number;
  mem: number;
  net: number;
}

/** Random-walk a value within [min,max]. */
function walk(value: number, min: number, max: number, step: number): number {
  const next = value + (Math.random() - 0.5) * step;
  return Math.min(max, Math.max(min, next));
}

export function SystemWidget() {
  const windowCount = useWindowStore((s) => s.windows.length);
  const [m, setM] = useState<Metrics>({ cpu: 22, mem: 47, net: 12 });

  useEffect(() => {
    const t = setInterval(() => {
      setM((prev) => ({
        cpu: walk(prev.cpu, 6, 92, 14),
        mem: walk(prev.mem, 30, 88, 6),
        net: walk(prev.net, 1, 96, 30),
      }));
    }, 1200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex w-[210px] flex-col gap-3">
      <p className="text-sm font-semibold">System Monitor</p>
      <Bar label="CPU" value={m.cpu} color="from-sky-400 to-indigo-500" />
      <Bar label="Memory" value={m.mem} color="from-violet-400 to-fuchsia-500" />
      <Bar label="Network" value={m.net} color="from-emerald-400 to-teal-500" />
      <div className="flex justify-between pt-1 text-xs text-white/55">
        <span>Processes</span>
        <span className="tabular-nums">{12 + windowCount}</span>
      </div>
    </div>
  );
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-white/70">{label}</span>
        <span className="tabular-nums text-white/55">{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-[width] duration-700 ease-out`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
