"use client";

/**
 * News widget — a rotating headline feed (simulated, in-universe NEXUS news).
 * Cycles through stories on a timer with a smooth crossfade.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const HEADLINES: { tag: string; title: string }[] = [
  { tag: "TECH", title: "NEXUS OS hits 10M browser installs in record time" },
  { tag: "AI", title: "Command Center now understands 40+ new intents" },
  { tag: "SCIENCE", title: "Quantum compute layer enters private beta" },
  { tag: "DESIGN", title: "Live wallpapers and weather land in latest build" },
  { tag: "MARKETS", title: "NEXU stock climbs as AI-native demand surges" },
  { tag: "WORLD", title: "Neo Kyoto unveils fully browser-run city dashboard" },
];

export function NewsWidget() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % HEADLINES.length), 4000);
    return () => clearInterval(t);
  }, []);

  const story = HEADLINES[i];

  return (
    <div className="flex w-[230px] flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">NEXUS News</p>
        <span className="flex h-2 w-2 items-center justify-center">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
        </span>
      </div>
      <div className="relative h-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <span className="rounded bg-accent/30 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-accent">
              {story.tag}
            </span>
            <p className="mt-1.5 text-xs leading-snug text-white/85">{story.title}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex gap-1">
        {HEADLINES.map((_, idx) => (
          <span
            key={idx}
            className={`h-0.5 flex-1 rounded-full transition-colors ${
              idx === i ? "bg-accent" : "bg-white/15"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
