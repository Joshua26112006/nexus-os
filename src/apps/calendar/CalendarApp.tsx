"use client";

/**
 * Calendar — month view with events and reminders. Click a day to add an event;
 * events persist to localStorage. An agenda panel lists upcoming items.
 */

import { useEffect, useMemo, useState } from "react";

interface CalEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  color: string;
}

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#0ea5e9"];
const STORE_KEY = "nexus.calendar";
const uid = () => Math.random().toString(36).slice(2, 9);
const key = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function CalendarApp() {
  const [view, setView] = useState(() => new Date());
  const [events, setEvents] = useState<CalEvent[]>(() => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) try { return JSON.parse(raw); } catch { /* ignore */ }
    }
    const today = new Date();
    return [
      { id: uid(), date: key(today), title: "Launch NEXUS OS", color: COLORS[0] },
      { id: uid(), date: key(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2)), title: "Team sync", color: COLORS[1] },
    ];
  });

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(events));
  }, [events]);

  const today = new Date();
  const cells = useMemo(() => {
    const y = view.getFullYear();
    const m = view.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    const arr: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) arr.push(null);
    for (let d = 1; d <= days; d++) arr.push(new Date(y, m, d));
    return arr;
  }, [view]);

  const addEvent = (d: Date) => {
    const title = prompt(`Event on ${d.toLocaleDateString()}:`);
    if (!title) return;
    setEvents((e) => [
      ...e,
      { id: uid(), date: key(d), title, color: COLORS[e.length % COLORS.length] },
    ]);
  };

  const upcoming = useMemo(
    () =>
      [...events]
        .filter((e) => e.date >= key(today))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 8),
    [events], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div className="flex h-full w-full bg-bg text-text">
      {/* Calendar */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {view.toLocaleDateString([], { month: "long", year: "numeric" })}
          </h2>
          <div className="flex gap-1">
            <NavBtn onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}>‹</NavBtn>
            <NavBtn onClick={() => setView(new Date())}>Today</NavBtn>
            <NavBtn onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}>›</NavBtn>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-text-muted">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="mt-1 grid flex-1 grid-cols-7 gap-1">
          {cells.map((d, i) => {
            const dayEvents = d ? events.filter((e) => e.date === key(d)) : [];
            const isToday = d && key(d) === key(today);
            return (
              <button
                key={i}
                type="button"
                onClick={() => d && addEvent(d)}
                className={`flex flex-col rounded-lg border p-1 text-left transition ${
                  d ? "border-border hover:border-accent" : "border-transparent"
                } ${isToday ? "bg-accent/10 ring-1 ring-accent" : ""}`}
              >
                {d && (
                  <>
                    <span className={`text-xs ${isToday ? "font-bold text-accent" : "text-text-muted"}`}>
                      {d.getDate()}
                    </span>
                    <div className="mt-0.5 space-y-0.5 overflow-hidden">
                      {dayEvents.slice(0, 2).map((e) => (
                        <span
                          key={e.id}
                          className="block truncate rounded px-1 text-[10px] text-white"
                          style={{ background: e.color }}
                        >
                          {e.title}
                        </span>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[10px] text-text-muted">+{dayEvents.length - 2}</span>
                      )}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Agenda */}
      <div className="w-60 shrink-0 border-l border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold">⏰ Upcoming</h3>
        <div className="space-y-2">
          {upcoming.length === 0 && <p className="text-xs text-text-muted">No upcoming events.</p>}
          {upcoming.map((e) => (
            <div key={e.id} className="flex items-start gap-2 rounded-lg bg-surface-elevated p-2">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: e.color }} />
              <div className="min-w-0">
                <p className="truncate text-sm">{e.title}</p>
                <p className="text-xs text-text-muted">
                  {new Date(e.date).toLocaleDateString([], { month: "short", day: "numeric" })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEvents((list) => list.filter((x) => x.id !== e.id))}
                className="ml-auto text-xs text-text-muted hover:text-rose-400"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-text-muted">Click any day to add an event.</p>
      </div>
    </div>
  );
}

function NavBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md bg-surface-elevated px-2.5 py-1 text-sm text-text-muted transition hover:text-text"
    >
      {children}
    </button>
  );
}
