"use client";

/**
 * Floating AI Companion — "Nova".
 *
 * A draggable, always-present orb that breathes, blinks, and reacts to OS
 * events with little speech bubbles. Clicking it opens the AI Command Center.
 * It's the friendly face of the AI layer (the orchestrator already does the
 * real work). Periodic, context-aware tips make the desktop feel alive.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAiStore } from "@/store/ai-store";
import { useSettingsStore } from "@/store/settings-store";
import { useEnvironmentStore, timeOfDayFromSun } from "@/store/environment-store";
import { eventBus } from "@/core/event-bus";
import { usePointerDrag } from "@/hooks/usePointerDrag";

const GREETINGS: Record<string, string> = {
  dawn: "Good morning ☀️",
  day: "Hey there! Ready to build?",
  dusk: "Winding down? I'm here.",
  night: "Burning the midnight oil? 🌙",
};

const TIPS = [
  "Press Ctrl+Space to ask me anything.",
  "Try: \"calculate 1024 * 768\".",
  "Press Ctrl+K for global search.",
  "Say \"set wallpaper to synthwave\".",
  "Press ? to see all shortcuts.",
  "Try \"create a shopping list\".",
];

export function AICompanion() {
  const openPalette = useAiStore((s) => s.openPalette);
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const sunPosition = useEnvironmentStore((s) => s.sunPosition);

  const [pos, setPos] = useState({ x: 0, y: 0 }); // offset from default corner
  const [bubble, setBubble] = useState<string | null>(null);
  const start = useRef({ x: 0, y: 0 });
  const dragged = useRef(false);

  // Greet on mount.
  useEffect(() => {
    const tod = timeOfDayFromSun(sunPosition);
    showBubble(GREETINGS[tod] ?? "Hello!");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to OS events with a quick comment.
  useEffect(() => {
    const offs = [
      eventBus.on("window:open", () => maybe("Nice, a new window!")),
      eventBus.on("achievement:unlock", () => showBubble("Achievement unlocked! 🏆")),
      eventBus.on("easter-egg:trigger", () => showBubble("Ooh, you found a secret! ✨")),
    ];
    return () => offs.forEach((off) => off());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Occasional ambient tips.
  useEffect(() => {
    const t = setInterval(() => {
      if (Math.random() < 0.5) showBubble(TIPS[Math.floor(Math.random() * TIPS.length)]);
    }, 22000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showBubble(text: string) {
    setBubble(text);
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble(null), 4500);
  }
  function maybe(text: string) {
    if (Math.random() < 0.6) showBubble(text);
  }

  const onPointerDown = usePointerDrag({
    onStart: () => {
      dragged.current = false;
      start.current = pos;
    },
    onMove: ({ dx, dy }) => {
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragged.current = true;
      setPos({ x: start.current.x + dx, y: start.current.y + dy });
    },
  });

  return (
    <div
      className="absolute bottom-28 right-6 z-[2500] flex flex-col items-end gap-2"
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
    >
      {/* Speech bubble */}
      <AnimatePresence>
        {bubble && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            className="glass max-w-[200px] rounded-2xl rounded-br-sm px-3 py-2 text-xs text-white shadow-dock"
          >
            {bubble}
          </motion.div>
        )}
      </AnimatePresence>

      {/* The orb */}
      <motion.button
        type="button"
        aria-label="Nova — AI companion"
        title="Nova (Ctrl+Space)"
        onPointerDown={onPointerDown}
        onClick={() => {
          if (!dragged.current) openPalette();
        }}
        animate={
          reducedMotion ? undefined : { y: [0, -8, 0], scale: [1, 1.04, 1] }
        }
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        className="relative flex h-14 w-14 cursor-grab items-center justify-center rounded-full active:cursor-grabbing"
      >
        {/* Glow */}
        <span
          aria-hidden
          className="absolute inset-0 rounded-full blur-lg"
          style={{ background: "radial-gradient(circle, rgba(129,140,248,0.9), rgba(192,132,252,0.3) 70%)" }}
        />
        {/* Orbiting ring */}
        {!reducedMotion && (
          <motion.span
            aria-hidden
            className="absolute inset-[-4px] rounded-full border border-white/30"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
            style={{ borderTopColor: "transparent", borderRightColor: "transparent" }}
          />
        )}
        {/* Core */}
        <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-fuchsia-500 text-xl shadow-inner ring-1 ring-white/40">
          ✦
        </span>
      </motion.button>
    </div>
  );
}
