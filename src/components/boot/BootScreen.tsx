"use client";

/**
 * Boot screen (DE-1, M0.2). A branded splash with a progress sequence that,
 * on completion, advances the system phase to `login` via the system store.
 *
 * The boot sequence is purely cosmetic in Phase 1 — there's no kernel to load
 * yet — but it's orchestrated through the store so the seam matches the
 * architecture (the kernel will own a real boot sequence later).
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSystemStore } from "@/store/system-store";
import { useSettingsStore } from "@/store/settings-store";

const BOOT_STEPS = [
  "Initializing kernel",
  "Mounting file system",
  "Starting window manager",
  "Loading desktop shell",
  "Ready",
];

export function BootScreen() {
  const completeBoot = useSystemStore((s) => s.completeBoot);
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const stepDuration = reducedMotion ? 120 : 520;
    const timer = setInterval(() => {
      setStep((prev) => {
        if (prev >= BOOT_STEPS.length - 1) {
          clearInterval(timer);
          // Brief pause on "Ready" before handing off to login.
          setTimeout(completeBoot, reducedMotion ? 100 : 600);
          return prev;
        }
        return prev + 1;
      });
    }, stepDuration);

    return () => clearInterval(timer);
  }, [completeBoot, reducedMotion]);

  const progress = ((step + 1) / BOOT_STEPS.length) * 100;

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-[#04070f] text-slate-100">
      {/* Ambient backdrop: drifting glows behind the logo. */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 h-[60vmax] w-[60vmax] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(99,102,241,0.5), rgba(99,102,241,0) 60%)",
          animation: reducedMotion ? undefined : "bloom-drift 16s ease-in-out infinite",
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex flex-col items-center gap-7"
      >
        <NexusLogo reducedMotion={reducedMotion} />
        <h1 className="text-4xl font-semibold tracking-[0.35em]">
          <span className="text-gradient">NEXUS</span>
          <span className="ml-1 font-light tracking-[0.4em] text-slate-400">OS</span>
        </h1>
      </motion.div>

      <div className="relative mt-20 flex w-72 flex-col items-center gap-3">
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-400"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: [0.22, 1, 0.36, 1], duration: reducedMotion ? 0 : 0.5 }}
            style={{ boxShadow: "0 0 12px rgba(129,140,248,0.7)" }}
          />
        </div>
        <div className="flex w-full items-center justify-between text-[11px] tracking-wide text-slate-400">
          <motion.span
            key={step}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 0.8, x: 0 }}
          >
            {BOOT_STEPS[step]}
          </motion.span>
          <span className="tabular-nums text-slate-500">{Math.round(progress)}%</span>
        </div>
      </div>

      <p className="absolute bottom-8 text-[11px] tracking-[0.2em] text-slate-600">
        AI-NATIVE · BROWSER-BASED
      </p>
    </div>
  );
}

function NexusLogo({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="relative h-24 w-24">
      {/* Pulsing glow halo behind the mark. */}
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-full blur-xl"
        style={{ background: "rgba(129,140,248,0.6)" }}
        animate={reducedMotion ? undefined : { opacity: [0.35, 0.7, 0.35], scale: [0.9, 1.1, 0.9] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      />
      <motion.svg
        width="96"
        height="96"
        viewBox="0 0 72 72"
        fill="none"
        className="relative"
        animate={reducedMotion ? undefined : { rotate: 360 }}
        transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
      >
        <defs>
          <linearGradient id="nexus-grad" x1="0" y1="0" x2="72" y2="72">
            <stop stopColor="#a5b4fc" />
            <stop offset="0.5" stopColor="#818cf8" />
            <stop offset="1" stopColor="#c084fc" />
          </linearGradient>
        </defs>
        {/* Outer hex ring */}
        <polygon
          points="36,5 62,20 62,52 36,67 10,52 10,20"
          stroke="url(#nexus-grad)"
          strokeWidth="2.5"
          fill="none"
          opacity="0.9"
        />
        {/* Inner hex ring */}
        <polygon
          points="36,16 53,26 53,46 36,56 19,46 19,26"
          stroke="url(#nexus-grad)"
          strokeWidth="1.5"
          fill="none"
          opacity="0.5"
        />
        <circle cx="36" cy="36" r="6.5" fill="url(#nexus-grad)" />
      </motion.svg>
    </div>
  );
}
