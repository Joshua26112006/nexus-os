"use client";

/**
 * NexusOS — the top-level phase router (boot → login → desktop → locked).
 *
 * Reads the system store's `phase` and renders the corresponding surface,
 * wrapped in AnimatePresence for smooth transitions. This is the single root
 * the page mounts.
 */

import { AnimatePresence, motion } from "framer-motion";
import { useSystemStore } from "@/store/system-store";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { BootScreen } from "@/components/boot/BootScreen";
import { LoginScreen } from "@/components/login/LoginScreen";
import { Desktop } from "@/components/desktop/Desktop";

export function NexusOS() {
  const phase = useSystemStore((s) => s.phase);

  return (
    <ThemeProvider>
      <main className="h-full w-full bg-bg text-text">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            className="h-full w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {phase === "booting" && <BootScreen />}
            {(phase === "login" || phase === "locked") && <LoginScreen />}
            {phase === "desktop" && <Desktop />}
          </motion.div>
        </AnimatePresence>
      </main>
    </ThemeProvider>
  );
}
