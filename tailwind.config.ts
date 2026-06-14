import type { Config } from "tailwindcss";

/**
 * Tailwind is driven by CSS variables (design tokens) defined in globals.css.
 * This is the "token-driven CSS" approach from Architecture.md §8.6 — one
 * source of truth for theming, consumed by the shell and (later) all apps.
 */
const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        // Semantic tokens — map to CSS variables so themes can swap at runtime.
        bg: "rgb(var(--color-bg) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        "surface-elevated": "rgb(var(--color-surface-elevated) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        text: "rgb(var(--color-text) / <alpha-value>)",
        "text-muted": "rgb(var(--color-text-muted) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        "accent-fg": "rgb(var(--color-accent-fg) / <alpha-value>)",
      },
      borderRadius: {
        window: "var(--radius-window)",
      },
      boxShadow: {
        window: "var(--shadow-window)",
        dock: "var(--shadow-dock)",
      },
      backdropBlur: {
        glass: "var(--blur-glass)",
      },
      transitionTimingFunction: {
        os: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
