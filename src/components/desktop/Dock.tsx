"use client";

/**
 * Dock (Phase 4 polish). Pinned apps + running indicators, now with macOS-style
 * proximity magnification: icons scale based on their distance from the cursor,
 * driven by a shared motion value for buttery 60fps motion. Glassmorphic tray,
 * icon reflection, and glowing running dots round out the premium feel.
 *
 * Behaviour is unchanged from Phase 3 — clicking still launches/focuses apps
 * (and opens the AI palette for the AI Center).
 */

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { dockApps } from "@/core/app-registry";
import { launchApp } from "@/core/launcher";
import { useWindowStore } from "@/store/window-store";
import { useSettingsStore } from "@/store/settings-store";
import { useAiStore } from "@/store/ai-store";
import { DOCK_HEIGHT } from "@/core/constants";

/** Base icon size and how large the hovered icon grows to. */
const BASE_SIZE = 46;
const MAX_SIZE = 72;
/** Cursor influence radius (px) over which magnification falls off. */
const INFLUENCE = 130;

export function Dock() {
  const windows = useWindowStore((s) => s.windows);
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const openPalette = useAiStore((s) => s.openPalette);

  const runningAppIds = new Set(windows.map((w) => w.appId));

  // Cursor X within the dock; Infinity means "cursor away" (no magnification).
  const mouseX = useMotionValue<number>(Infinity);

  const handleClick = (appId: string) => {
    if (appId === "ai") {
      openPalette();
      return;
    }
    const existing = windows.find((w) => w.appId === appId);
    if (existing) {
      focusWindow(existing.id);
    } else {
      launchApp(appId);
    }
  };

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-[1000] flex items-end justify-center"
      style={{ height: DOCK_HEIGHT }}
    >
      <motion.nav
        aria-label="Dock"
        initial={reducedMotion ? false : { y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: reducedMotion ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
        onMouseMove={(e) => mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="glass glass-sheen pointer-events-auto mb-3 flex items-end gap-2.5 rounded-[22px] px-3.5 py-2.5 shadow-dock"
      >
        {dockApps().map((app) => (
          <DockIcon
            key={app.id}
            icon={app.icon}
            name={app.name}
            running={runningAppIds.has(app.id)}
            reducedMotion={reducedMotion}
            mouseX={mouseX}
            onClick={() => handleClick(app.id)}
          />
        ))}
      </motion.nav>
    </div>
  );
}

function DockIcon({
  icon,
  name,
  running,
  reducedMotion,
  mouseX,
  onClick,
}: {
  icon: string;
  name: string;
  running: boolean;
  reducedMotion: boolean;
  mouseX: MotionValue<number>;
  onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  // Distance from cursor to this icon's center → target size.
  const distance = useTransform(mouseX, (x) => {
    if (!ref.current || x === Infinity) return INFLUENCE * 2;
    const rect = ref.current.getBoundingClientRect();
    return x - (rect.left + rect.width / 2);
  });

  const sizeTarget = useTransform(
    distance,
    [-INFLUENCE, 0, INFLUENCE],
    [BASE_SIZE, MAX_SIZE, BASE_SIZE],
  );

  // Spring for smooth, weighty magnification.
  const size = useSpring(sizeTarget, { stiffness: 350, damping: 24, mass: 0.6 });
  // Glyph scales with the icon. Derived from the spring MotionValue so the type
  // stays a MotionValue even when motion is reduced (we freeze via style below).
  const fontSize = useTransform(size, (s) => s * 0.52);

  return (
    <div className="group relative flex flex-col items-center">
      {/* Tooltip */}
      <span className="pointer-events-none absolute -top-10 whitespace-nowrap rounded-lg bg-black/75 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg backdrop-blur-sm transition-opacity duration-150 group-hover:opacity-100">
        {name}
      </span>

      <motion.button
        ref={ref}
        type="button"
        aria-label={name}
        onClick={onClick}
        whileTap={reducedMotion ? undefined : { scale: 0.88 }}
        style={
          reducedMotion
            ? { width: BASE_SIZE, height: BASE_SIZE }
            : { width: size, height: size }
        }
        className="relative flex items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur-md transition-colors hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <motion.span
          style={reducedMotion ? { fontSize: BASE_SIZE * 0.52 } : { fontSize }}
        >
          {icon}
        </motion.span>
        {/* Soft reflection beneath the glyph. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-2 bottom-0 h-1/3 rounded-b-2xl bg-gradient-to-t from-white/10 to-transparent"
        />
      </motion.button>

      {/* Running indicator — glowing dot. */}
      <span
        className={`mt-1.5 h-1 w-1 rounded-full bg-white transition-all duration-200 ${
          running ? "opacity-95 shadow-[0_0_8px_2px_rgba(255,255,255,0.6)]" : "opacity-0"
        }`}
        aria-hidden
      />
    </div>
  );
}
