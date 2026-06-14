"use client";

/**
 * Virtual Pet — a Tamagotchi-style companion. Hunger, happiness, and energy
 * decay over time; feed, play, and rest to keep your pet thriving. The pet's
 * emoji and mood react to its state. Stats persist to localStorage.
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface PetState {
  name: string;
  hunger: number; // 100 = full
  happiness: number;
  energy: number;
  age: number; // ticks (minutes)
  born: number;
}

const STORE_KEY = "nexus.pet";
const clamp = (n: number) => Math.max(0, Math.min(100, n));

function load(): PetState {
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) try { return JSON.parse(raw); } catch { /* ignore */ }
  }
  return { name: "Pixel", hunger: 80, happiness: 80, energy: 80, age: 0, born: Date.now() };
}

export function PetApp() {
  const [pet, setPet] = useState<PetState>(load);
  const [action, setAction] = useState<string | null>(null);
  const sleeping = useRef(false);

  // Decay loop.
  useEffect(() => {
    const id = setInterval(() => {
      setPet((p) => ({
        ...p,
        hunger: clamp(p.hunger - 1.5),
        happiness: clamp(p.happiness - 1),
        energy: clamp(p.energy + (sleeping.current ? 4 : -0.8)),
        age: p.age + 1,
      }));
    }, 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(pet));
  }, [pet]);

  const flash = (label: string) => {
    setAction(label);
    setTimeout(() => setAction(null), 1200);
  };

  const feed = () => { setPet((p) => ({ ...p, hunger: clamp(p.hunger + 25) })); flash("Yum! 🍎"); };
  const play = () => { setPet((p) => ({ ...p, happiness: clamp(p.happiness + 25), energy: clamp(p.energy - 10) })); flash("Wheee! 🎉"); };
  const rest = () => {
    sleeping.current = !sleeping.current;
    flash(sleeping.current ? "Zzz… 😴" : "Awake! ☀️");
  };

  const avg = (pet.hunger + pet.happiness + pet.energy) / 3;
  const mood =
    sleeping.current ? "😴"
    : avg > 70 ? "😄"
    : avg > 45 ? "🙂"
    : avg > 25 ? "😟"
    : "😢";

  const face = sleeping.current ? "🐱💤" : avg > 45 ? "🐱" : "🐱";

  return (
    <div className="flex h-full w-full flex-col items-center bg-gradient-to-b from-[#1e1b4b] to-[#0f172a] p-5 text-white">
      <p className="text-lg font-bold">{pet.name}</p>
      <p className="text-xs text-white/50">Age: {pet.age} min · {mood}</p>

      {/* Pet */}
      <div className="my-6 flex h-40 w-40 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
        <motion.div
          animate={sleeping.current ? { y: [0, -2, 0] } : { y: [0, -12, 0], rotate: [0, -4, 4, 0] }}
          transition={{ repeat: Infinity, duration: sleeping.current ? 2.5 : 2 }}
          className="text-7xl"
        >
          {face}
        </motion.div>
      </div>

      {action && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 text-sm font-medium text-amber-300"
        >
          {action}
        </motion.p>
      )}

      {/* Stats */}
      <div className="w-full max-w-[300px] space-y-2">
        <Stat label="🍖 Hunger" value={pet.hunger} color="from-rose-400 to-red-500" />
        <Stat label="❤️ Happiness" value={pet.happiness} color="from-pink-400 to-fuchsia-500" />
        <Stat label="⚡ Energy" value={pet.energy} color="from-amber-400 to-yellow-500" />
      </div>

      {/* Actions */}
      <div className="mt-5 flex gap-3">
        <ActionBtn onClick={feed}>🍎 Feed</ActionBtn>
        <ActionBtn onClick={play} disabled={pet.energy < 10}>🎮 Play</ActionBtn>
        <ActionBtn onClick={rest}>{sleeping.current ? "☀️ Wake" : "😴 Sleep"}</ActionBtn>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-xs">
        <span>{label}</span>
        <span className="tabular-nums">{Math.round(value)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ActionBtn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium ring-1 ring-white/15 transition hover:bg-white/20 disabled:opacity-40"
    >
      {children}
    </button>
  );
}
