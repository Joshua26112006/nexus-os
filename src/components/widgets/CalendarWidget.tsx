"use client";

/** Calendar widget — current month grid with today highlighted. */

import { useMemo, useState } from "react";

export function CalendarWidget() {
  const [view] = useState(() => new Date());
  const today = new Date();

  const cells = useMemo(() => {
    const year = view.getFullYear();
    const month = view.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const arr: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [view]);

  const isToday = (d: number | null) =>
    d !== null &&
    today.getDate() === d &&
    today.getMonth() === view.getMonth() &&
    today.getFullYear() === view.getFullYear();

  return (
    <div className="w-[210px]">
      <p className="mb-2 text-center text-sm font-semibold">
        {view.toLocaleDateString([], { month: "long", year: "numeric" })}
      </p>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-white/50">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((d, i) => (
          <span
            key={i}
            className={`flex h-6 items-center justify-center rounded-md text-xs ${
              isToday(d)
                ? "bg-accent font-bold text-accent-fg"
                : d
                  ? "text-white/80 hover:bg-white/10"
                  : ""
            }`}
          >
            {d ?? ""}
          </span>
        ))}
      </div>
    </div>
  );
}
