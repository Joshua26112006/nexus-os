"use client";

/**
 * Video Player — a stylized media player with a playlist, play/pause, a
 * scrubber, and a live animated "screen" (canvas visualization standing in for
 * video frames, since there are no bundled assets). Demonstrates the player UX
 * end to end.
 */

import { useEffect, useRef, useState } from "react";

interface Clip {
  title: string;
  channel: string;
  duration: number;
  hue: number;
}

const CLIPS: Clip[] = [
  { title: "NEXUS OS — Official Trailer", channel: "NEXUS", duration: 96, hue: 250 },
  { title: "Building an OS in the Browser", channel: "DevTalks", duration: 612, hue: 190 },
  { title: "Aurora — Visualizer", channel: "Ambient", duration: 240, hue: 300 },
  { title: "Neo Kyoto Cityscape 4K", channel: "Drone", duration: 480, hue: 30 },
];

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function VideoApp() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clip = CLIPS[index];

  // Animated "screen".
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let phase = 0;
    const draw = () => {
      const w = (canvas.width = canvas.clientWidth);
      const h = (canvas.height = canvas.clientHeight);
      if (playing) phase += 0.02;
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, `hsl(${clip.hue}, 70%, ${20 + Math.sin(phase) * 8}%)`);
      g.addColorStop(1, `hsl(${clip.hue + 40}, 70%, ${12 + Math.cos(phase) * 6}%)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        const y = h / 2 + Math.sin(phase * 2 + i) * 40;
        ctx.arc(w / 2 + Math.cos(phase + i) * 120, y, 30 + i * 14, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${clip.hue + i * 20}, 80%, 60%, 0.12)`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [clip.hue, playing]);

  // Progress timer.
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setT((p) => {
        if (p + 1 >= clip.duration) { setIndex((i) => (i + 1) % CLIPS.length); return 0; }
        return p + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [playing, clip.duration]);

  useEffect(() => setT(0), [index]);

  return (
    <div className="flex h-full w-full bg-[#0a0a0f] text-white">
      <div className="flex flex-1 flex-col">
        {/* Screen */}
        <div className="relative flex-1 bg-black">
          <canvas ref={canvasRef} className="h-full w-full" />
          {!playing && (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-3xl backdrop-blur-sm transition hover:bg-white/30">
                ▶
              </span>
            </button>
          )}
          <div className="absolute left-3 top-3 rounded bg-black/50 px-2 py-0.5 text-xs">● {clip.channel}</div>
        </div>

        {/* Controls */}
        <div className="shrink-0 bg-[#111118] px-4 py-3">
          <input
            type="range"
            min={0}
            max={clip.duration}
            value={t}
            onChange={(e) => setT(Number(e.target.value))}
            className="w-full accent-rose-500"
          />
          <div className="mt-1 flex items-center gap-4">
            <button type="button" onClick={() => setPlaying((p) => !p)} className="text-xl">
              {playing ? "⏸" : "▶"}
            </button>
            <span className="text-xs text-white/60">{fmt(t)} / {fmt(clip.duration)}</span>
            <span className="ml-2 truncate text-sm font-medium">{clip.title}</span>
            <span className="ml-auto text-white/50">🔊 ⛶</span>
          </div>
        </div>
      </div>

      {/* Up next */}
      <div className="flex w-64 shrink-0 flex-col border-l border-white/10">
        <div className="shrink-0 border-b border-white/10 px-4 py-3 text-sm font-semibold">Up Next</div>
        <div className="nexus-scroll flex-1 overflow-auto">
          {CLIPS.map((c, i) => (
            <button
              key={c.title}
              type="button"
              onClick={() => { setIndex(i); setPlaying(true); }}
              className={`flex w-full gap-2 p-2 text-left transition ${i === index ? "bg-white/10" : "hover:bg-white/5"}`}
            >
              <span
                className="h-12 w-20 shrink-0 rounded"
                style={{ background: `linear-gradient(135deg, hsl(${c.hue},70%,40%), hsl(${c.hue + 40},70%,25%))` }}
              />
              <span className="min-w-0">
                <span className="line-clamp-2 text-xs">{c.title}</span>
                <span className="text-[11px] text-white/50">{c.channel} · {fmt(c.duration)}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
