"use client";

/**
 * Login / session screen (DE-7, partial). Phase 1 is single-user with no real
 * auth (PRD §10 assumption) — selecting the profile and pressing enter signs
 * in. The screen is reused for the `locked` phase too.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSystemStore } from "@/store/system-store";
import { Wallpaper } from "@/components/desktop/Wallpaper";
import type { UserProfile } from "@/types";

const DEFAULT_USER: UserProfile = {
  username: "nexus",
  displayName: "NEXUS User",
  avatar: "🛰️",
};

export function LoginScreen() {
  const login = useSystemStore((s) => s.login);
  const phase = useSystemStore((s) => s.phase);
  const [submitting, setSubmitting] = useState(false);

  const handleSignIn = () => {
    setSubmitting(true);
    // Tiny delay for a deliberate sign-in feel; no real auth in Phase 1.
    setTimeout(() => login(DEFAULT_USER), 350);
  };

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
      <Wallpaper />
      <div className="absolute inset-0 z-[1] bg-black/30" />

      <div className="relative z-10">
        <Clock />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        className="glass glass-sheen relative z-10 mt-8 flex w-[88%] max-w-sm flex-col items-center gap-5 rounded-3xl px-8 py-9 text-white shadow-window"
      >
        {/* Avatar with accent glow ring. */}
        <div className="relative">
          <div
            aria-hidden
            className="absolute -inset-1 rounded-full opacity-70 blur-md"
            style={{ background: "rgba(129,140,248,0.5)" }}
          />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-4xl ring-1 ring-white/30">
            {DEFAULT_USER.avatar}
          </div>
        </div>

        <div className="text-center">
          <p className="text-lg font-semibold">{DEFAULT_USER.displayName}</p>
          <p className="text-sm text-white/55">@{DEFAULT_USER.username}</p>
        </div>

        <motion.button
          type="button"
          onClick={handleSignIn}
          disabled={submitting}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="mt-1 w-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-70"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Signing in…
            </span>
          ) : phase === "locked" ? (
            "Unlock"
          ) : (
            "Sign in"
          )}
        </motion.button>
      </motion.div>

      <p className="absolute bottom-7 text-[11px] tracking-[0.25em] text-white/40">
        NEXUS OS · THE AI-NATIVE DESKTOP
      </p>
    </div>
  );
}

function Clock() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="text-center text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]"
    >
      <LiveTime />
    </motion.div>
  );
}

function LiveTime() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Render nothing until mounted to avoid SSR/client time mismatch.
  if (!now) {
    return <div className="h-[88px]" aria-hidden />;
  }

  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = now.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <p className="text-5xl font-light tabular-nums">{time}</p>
      <p className="mt-1 text-sm text-white/70">{date}</p>
    </>
  );
}
