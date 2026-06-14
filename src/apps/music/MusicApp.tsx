"use client";

/**
 * Music Studio — a playlist manager with a now-playing view, animated
 * equalizer, and a working scrubber. Playback is simulated (no audio assets),
 * advancing a progress timer while "playing".
 */

import { useEffect, useRef, useState } from "react";

interface Track {
  title: string;
  artist: string;
  duration: number; // seconds
  art: string; // gradient
}

const PLAYLIST: Track[] = [
  { title: "Neon Skyline", artist: "Aurora", duration: 214, art: "linear-gradient(135deg,#6366f1,#c084fc)" },
  { title: "Midnight Protocol", artist: "Cipher", duration: 187, art: "linear-gradient(135deg,#0ea5e9,#10b981)" },
  { title: "Solar Drift", artist: "Helios", duration: 243, art: "linear-gradient(135deg,#f59e0b,#f43f5e)" },
  { title: "Quantum Bloom", artist: "Qubit", duration: 201, art: "linear-gradient(135deg,#8b5cf6,#ec4899)" },
  { title: "Deep Current", artist: "Abyss", duration: 229, art: "linear-gradient(135deg,#155e75,#0f172a)" },
];

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function MusicApp() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const raf = useRef<number | null>(null);

  const track = PLAYLIST[index];

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setProgress((p) => {
        const next = p + dt;
        if (next >= track.duration) {
          setIndex((i) => (i + 1) % PLAYLIST.length);
          return 0;
        }
        return next;
      });
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [playing, track.duration]);

  useEffect(() => setProgress(0), [index]);

  return (
    <div className="flex h-full w-full bg-[#0c1020] text-white">
      {/* Now playing */}
      <div className="flex w-1/2 flex-col items-center justify-center gap-5 p-6">
        <div
          className="relative h-44 w-44 rounded-2xl shadow-2xl"
          style={{ background: track.art }}
        >
          {playing && <Equalizer />}
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold">{track.title}</p>
          <p className="text-sm text-white/60">{track.artist}</p>
        </div>

        {/* Scrubber */}
        <div className="w-full">
          <input
            type="range"
            min={0}
            max={track.duration}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="w-full accent-indigo-400"
          />
          <div className="flex justify-between text-xs text-white/50">
            <span>{fmt(progress)}</span>
            <span>{fmt(track.duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-5">
          <Ctrl onClick={() => setIndex((i) => (i - 1 + PLAYLIST.length) % PLAYLIST.length)}>⏮</Ctrl>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-2xl shadow-lg transition hover:brightness-110"
          >
            {playing ? "⏸" : "▶"}
          </button>
          <Ctrl onClick={() => setIndex((i) => (i + 1) % PLAYLIST.length)}>⏭</Ctrl>
        </div>
      </div>

      {/* Playlist */}
      <div className="flex w-1/2 flex-col border-l border-white/10">
        <div className="shrink-0 border-b border-white/10 px-4 py-3 text-sm font-semibold">
          🎵 Playlist
        </div>
        <div className="nexus-scroll flex-1 overflow-auto">
          {PLAYLIST.map((t, i) => (
            <button
              key={t.title}
              type="button"
              onClick={() => { setIndex(i); setPlaying(true); }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${
                i === index ? "bg-white/10" : "hover:bg-white/5"
              }`}
            >
              <span className="h-9 w-9 shrink-0 rounded-md" style={{ background: t.art }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{t.title}</span>
                <span className="block truncate text-xs text-white/50">{t.artist}</span>
              </span>
              <span className="text-xs text-white/40">{fmt(t.duration)}</span>
              {i === index && playing && <span className="text-indigo-400">▶</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Equalizer() {
  return (
    <div className="absolute inset-x-0 bottom-3 flex items-end justify-center gap-1">
      {[...Array(7)].map((_, i) => (
        <span
          key={i}
          className="w-1.5 rounded-full bg-white/80"
          style={{
            height: 8,
            animation: `eq 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
          }}
        />
      ))}
      <style>{`@keyframes eq { from { height: 6px } to { height: 28px } }`}</style>
    </div>
  );
}

function Ctrl({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="text-2xl text-white/70 transition hover:text-white">
      {children}
    </button>
  );
}
