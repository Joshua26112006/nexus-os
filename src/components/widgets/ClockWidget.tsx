"use client";

/** Clock widget — live analog + digital clock with date. */

import { useEffect, useState } from "react";

export function ClockWidget() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!now) return <div className="h-[150px]" />;

  const h = now.getHours() % 12;
  const m = now.getMinutes();
  const s = now.getSeconds();
  const hourAngle = h * 30 + m * 0.5;
  const minAngle = m * 6;
  const secAngle = s * 6;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Analog face */}
      <div className="relative h-24 w-24 rounded-full ring-1 ring-white/15">
        {[...Array(12)].map((_, i) => (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 h-1 w-0.5 -translate-x-1/2 origin-[center_-40px] rounded bg-white/30"
            style={{ transform: `rotate(${i * 30}deg) translateY(-40px)` }}
          />
        ))}
        <Hand angle={hourAngle} length={26} width={2.5} color="rgba(255,255,255,0.95)" />
        <Hand angle={minAngle} length={36} width={2} color="rgba(255,255,255,0.8)" />
        <Hand angle={secAngle} length={38} width={1} color="rgb(var(--color-accent))" />
        <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
      </div>

      {/* Digital */}
      <div className="text-center">
        <p className="text-xl font-semibold tabular-nums">
          {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
        <p className="text-xs text-white/60">
          {now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
        </p>
      </div>
    </div>
  );
}

function Hand({
  angle,
  length,
  width,
  color,
}: {
  angle: number;
  length: number;
  width: number;
  color: string;
}) {
  return (
    <span
      className="absolute bottom-1/2 left-1/2 origin-bottom rounded-full"
      style={{
        height: length,
        width,
        background: color,
        transform: `translateX(-50%) rotate(${angle}deg)`,
      }}
    />
  );
}
