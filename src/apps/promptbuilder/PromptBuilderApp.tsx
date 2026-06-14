"use client";

/**
 * AI Image Prompt Builder — compose high-quality image-generation prompts from
 * curated building blocks (subject, style, lighting, mood, camera, quality).
 * Live-assembles the prompt, supports a custom subject, randomize, and copy.
 */

import { useMemo, useState } from "react";

const BLOCKS = {
  Style: ["photorealistic", "oil painting", "cyberpunk", "watercolor", "3D render", "anime", "low poly", "vaporwave"],
  Lighting: ["golden hour", "studio lighting", "neon glow", "dramatic shadows", "soft diffused", "volumetric"],
  Mood: ["serene", "epic", "mysterious", "dreamy", "energetic", "melancholic"],
  Camera: ["wide angle", "macro", "aerial drone", "35mm", "fisheye", "bokeh"],
  Quality: ["4K", "ultra detailed", "trending on ArtStation", "award-winning", "hyperrealistic"],
};
type BlockKey = keyof typeof BLOCKS;

const SUBJECTS = ["a futuristic city", "a lone astronaut", "a mystical forest", "a robot cat", "an ancient temple", "a floating island"];

export function PromptBuilderApp() {
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [selected, setSelected] = useState<Record<BlockKey, string[]>>({
    Style: ["photorealistic"], Lighting: ["golden hour"], Mood: ["epic"], Camera: ["wide angle"], Quality: ["4K"],
  });
  const [copied, setCopied] = useState(false);

  const toggle = (cat: BlockKey, val: string) =>
    setSelected((s) => ({
      ...s,
      [cat]: s[cat].includes(val) ? s[cat].filter((x) => x !== val) : [...s[cat], val],
    }));

  const prompt = useMemo(() => {
    const parts = [subject];
    for (const cat of Object.keys(BLOCKS) as BlockKey[]) {
      if (selected[cat].length) parts.push(selected[cat].join(", "));
    }
    return parts.join(", ");
  }, [subject, selected]);

  const randomize = () => {
    setSubject(SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)]);
    const next = {} as Record<BlockKey, string[]>;
    for (const cat of Object.keys(BLOCKS) as BlockKey[]) {
      const opts = BLOCKS[cat];
      next[cat] = [opts[Math.floor(Math.random() * opts.length)]];
    }
    setSelected(next);
  };

  const copy = () => {
    navigator.clipboard?.writeText(prompt).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex h-full w-full flex-col bg-bg text-text">
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-surface px-4 py-3">
        <span className="text-base font-semibold">🪄 Image Prompt Builder</span>
        <button type="button" onClick={randomize} className="ml-auto rounded-md bg-surface-elevated px-3 py-1.5 text-xs hover:brightness-110">
          🎲 Randomize
        </button>
      </div>

      <div className="nexus-scroll flex-1 overflow-auto p-4">
        {/* Subject */}
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-text-muted">Subject</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="mb-4 w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        />

        {(Object.keys(BLOCKS) as BlockKey[]).map((cat) => (
          <div key={cat} className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">{cat}</p>
            <div className="flex flex-wrap gap-2">
              {BLOCKS[cat].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => toggle(cat, val)}
                  className={`rounded-full px-3 py-1 text-sm transition ${
                    selected[cat].includes(val)
                      ? "bg-accent text-accent-fg"
                      : "bg-surface-elevated text-text-muted hover:text-text"
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Assembled prompt */}
      <div className="shrink-0 border-t border-border bg-surface p-4">
        <div className="rounded-lg bg-surface-elevated p-3">
          <p className="text-sm leading-relaxed text-text">{prompt}</p>
        </div>
        <button
          type="button"
          onClick={copy}
          className="mt-3 w-full rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 py-2 text-sm font-semibold text-white transition hover:brightness-110"
        >
          {copied ? "✓ Copied!" : "Copy prompt"}
        </button>
      </div>
    </div>
  );
}
