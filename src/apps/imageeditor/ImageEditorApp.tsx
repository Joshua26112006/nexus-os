"use client";

/**
 * Image Editor — load an image (or use the sample), then adjust brightness,
 * contrast, saturation, hue, blur, grayscale and sepia with live sliders, plus
 * rotate/flip. Export the result to a PNG via canvas.
 */

import { useRef, useState } from "react";

interface Filters {
  brightness: number;
  contrast: number;
  saturate: number;
  hue: number;
  blur: number;
  grayscale: number;
  sepia: number;
}

const DEFAULTS: Filters = {
  brightness: 100, contrast: 100, saturate: 100, hue: 0, blur: 0, grayscale: 0, sepia: 0,
};

// A colourful sample image generated as an SVG data URL (no external asset).
const SAMPLE =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'>
      <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='#6366f1'/><stop offset='0.5' stop-color='#ec4899'/>
        <stop offset='1' stop-color='#f59e0b'/></linearGradient></defs>
      <rect width='600' height='400' fill='url(#g)'/>
      <circle cx='180' cy='150' r='80' fill='rgba(255,255,255,0.25)'/>
      <circle cx='430' cy='270' r='110' fill='rgba(0,0,0,0.15)'/>
      <text x='300' y='210' font-family='sans-serif' font-size='40' fill='white' text-anchor='middle' font-weight='bold'>NEXUS</text>
    </svg>`,
  );

export function ImageEditorApp() {
  const [src, setSrc] = useState(SAMPLE);
  const [f, setF] = useState<Filters>(DEFAULTS);
  const [rotate, setRotate] = useState(0);
  const [flip, setFlip] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const filterStr = `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturate}%) hue-rotate(${f.hue}deg) blur(${f.blur}px) grayscale(${f.grayscale}%) sepia(${f.sepia}%)`;

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const download = () => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width || 600;
      canvas.height = img.height || 400;
      const ctx = canvas.getContext("2d")!;
      ctx.filter = filterStr;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotate * Math.PI) / 180);
      ctx.scale(flip ? -1 : 1, 1);
      ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "nexus-edit.png";
      a.click();
    };
    img.src = src;
  };

  return (
    <div className="flex h-full w-full bg-bg text-text">
      {/* Canvas */}
      <div className="flex flex-1 items-center justify-center overflow-hidden bg-[repeating-conic-gradient(#0000_0_25%,#1f2937_0_50%)] bg-[length:24px_24px] p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="edit target"
          className="max-h-full max-w-full rounded-lg shadow-2xl transition"
          style={{ filter: filterStr, transform: `rotate(${rotate}deg) scaleX(${flip ? -1 : 1})` }}
        />
      </div>

      {/* Controls */}
      <div className="nexus-scroll w-64 shrink-0 overflow-auto border-l border-border bg-surface p-4">
        <div className="mb-3 flex gap-2">
          <button type="button" onClick={() => fileRef.current?.click()} className="flex-1 rounded-md bg-surface-elevated px-2 py-1.5 text-xs hover:brightness-110">
            Upload
          </button>
          <button type="button" onClick={download} className="flex-1 rounded-md bg-accent px-2 py-1.5 text-xs text-accent-fg hover:brightness-110">
            Export
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} className="hidden" />
        </div>

        {([
          ["brightness", 0, 200], ["contrast", 0, 200], ["saturate", 0, 200],
          ["hue", 0, 360], ["blur", 0, 12], ["grayscale", 0, 100], ["sepia", 0, 100],
        ] as const).map(([k, min, max]) => (
          <div key={k} className="mb-3">
            <div className="mb-1 flex justify-between text-xs">
              <span className="capitalize text-text-muted">{k}</span>
              <span className="tabular-nums">{f[k]}</span>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              value={f[k]}
              onChange={(e) => setF({ ...f, [k]: Number(e.target.value) })}
              className="w-full accent-accent"
            />
          </div>
        ))}

        <div className="mb-3 flex gap-2">
          <button type="button" onClick={() => setRotate((r) => r - 90)} className="flex-1 rounded-md bg-surface-elevated py-1.5 text-xs hover:brightness-110">↺ Rotate</button>
          <button type="button" onClick={() => setRotate((r) => r + 90)} className="flex-1 rounded-md bg-surface-elevated py-1.5 text-xs hover:brightness-110">↻</button>
          <button type="button" onClick={() => setFlip((x) => !x)} className="flex-1 rounded-md bg-surface-elevated py-1.5 text-xs hover:brightness-110">⇄ Flip</button>
        </div>

        <button
          type="button"
          onClick={() => { setF(DEFAULTS); setRotate(0); setFlip(false); }}
          className="w-full rounded-md border border-border py-1.5 text-xs text-text-muted hover:text-text"
        >
          Reset all
        </button>
      </div>
    </div>
  );
}
