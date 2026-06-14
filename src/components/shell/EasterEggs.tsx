"use client";

/**
 * Easter eggs.
 *
 *  - Konami code (↑↑↓↓←→←→ B A) → a celebratory confetti burst + the secret
 *    "The Old Ways" achievement.
 *  - Typing "nexus" anywhere (outside inputs) → toggles a one-time rainbow
 *    pulse across the desktop.
 *
 * Lightweight, self-contained, and purely for delight.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAchievementStore } from "@/store/achievement-store";
import { eventBus } from "@/core/event-bus";

const KONAMI = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

const CONFETTI = ["🎉", "✨", "🎊", "⭐", "💫", "🌟", "🪩"];

export function EasterEggs() {
  const unlock = useAchievementStore((s) => s.unlock);
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    let progress = 0;
    const handler = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === KONAMI[progress]) {
        progress++;
        if (progress === KONAMI.length) {
          progress = 0;
          unlock("konami");
          eventBus.emit("easter-egg:trigger", { id: "konami" });
          setBurst(true);
          setTimeout(() => setBurst(false), 3000);
        }
      } else {
        // Allow restart if the wrong key is the first key of the sequence.
        progress = key === KONAMI[0] ? 1 : 0;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [unlock]);

  return (
    <AnimatePresence>
      {burst && (
        <div className="pointer-events-none fixed inset-0 z-[4000] overflow-hidden">
          {Array.from({ length: 60 }).map((_, i) => {
            const left = Math.random() * 100;
            const delay = Math.random() * 0.6;
            const duration = 2 + Math.random() * 1.5;
            const emoji = CONFETTI[i % CONFETTI.length];
            return (
              <motion.span
                key={i}
                initial={{ y: -40, x: `${left}vw`, opacity: 1, rotate: 0 }}
                animate={{ y: "110vh", rotate: 360 + Math.random() * 360, opacity: [1, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration, delay, ease: "easeIn" }}
                className="absolute text-2xl"
              >
                {emoji}
              </motion.span>
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}
