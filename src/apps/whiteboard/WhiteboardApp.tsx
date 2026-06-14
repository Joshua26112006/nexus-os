"use client";

/**
 * Whiteboard — an infinite-feel canvas with freehand drawing, sticky notes,
 * and basic tools. Drawing is rendered to a <canvas>; sticky notes are
 * draggable DOM elements layered on top.
 */

import { useEffect, useRef, useState } from "react";

type Tool = "pen" | "eraser" | "sticky";

interface Sticky {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

const COLORS = ["#6366f1", "#f43f5e", "#10b981", "#f59e0b", "#0ea5e9", "#111827"];
const STICKY_COLORS = ["#fde68a", "#bfdbfe", "#bbf7d0", "#fecaca", "#e9d5ff"];

export function WhiteboardApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drawing = useRef(false);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(4);
  const [stickies, setStickies] = useState<Sticky[]>([]);
  const nextId = useRef(1);

  // Size the canvas to its container.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const data = canvas.toDataURL();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const img = new Image();
      img.onload = () => canvas.getContext("2d")?.drawImage(img, 0, 0);
      img.src = data;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  const pos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onDown = (e: React.PointerEvent) => {
    if (tool === "sticky") {
      const p = pos(e);
      setStickies((s) => [
        ...s,
        {
          id: nextId.current++,
          x: p.x,
          y: p.y,
          text: "New note",
          color: STICKY_COLORS[s.length % STICKY_COLORS.length],
        },
      ]);
      setTool("pen");
      return;
    }
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = tool === "eraser" ? "#0b1020" : color;
    ctx.lineWidth = tool === "eraser" ? size * 5 : size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  const onUp = () => (drawing.current = false);

  const clear = () => {
    const c = canvasRef.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setStickies([]);
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#0b1020] text-white">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-black/30 px-3 py-2">
        <ToolBtn active={tool === "pen"} onClick={() => setTool("pen")}>✏️ Pen</ToolBtn>
        <ToolBtn active={tool === "eraser"} onClick={() => setTool("eraser")}>🧽 Eraser</ToolBtn>
        <ToolBtn active={tool === "sticky"} onClick={() => setTool("sticky")}>🗒️ Sticky</ToolBtn>
        <div className="mx-1 h-5 w-px bg-white/15" />
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Color ${c}`}
            onClick={() => setColor(c)}
            className={`h-5 w-5 rounded-full ring-2 transition ${color === c ? "ring-white" : "ring-transparent"}`}
            style={{ background: c }}
          />
        ))}
        <input
          type="range"
          min={1}
          max={16}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="ml-1 w-20 accent-indigo-400"
          aria-label="Brush size"
        />
        <button
          type="button"
          onClick={clear}
          className="ml-auto rounded-md bg-white/10 px-2.5 py-1 text-xs hover:bg-white/20"
        >
          Clear
        </button>
      </div>

      {/* Canvas + stickies */}
      <div ref={wrapRef} className="relative flex-1 overflow-hidden">
        {/* dotted grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <canvas
          ref={canvasRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
          className="absolute inset-0 touch-none"
          style={{ cursor: tool === "sticky" ? "copy" : "crosshair" }}
        />
        {stickies.map((s) => (
          <StickyNote
            key={s.id}
            sticky={s}
            onChange={(text) =>
              setStickies((list) => list.map((x) => (x.id === s.id ? { ...x, text } : x)))
            }
            onMove={(x, y) =>
              setStickies((list) => list.map((n) => (n.id === s.id ? { ...n, x, y } : n)))
            }
            onDelete={() => setStickies((list) => list.filter((n) => n.id !== s.id))}
          />
        ))}
      </div>
    </div>
  );
}

function StickyNote({
  sticky,
  onChange,
  onMove,
  onDelete,
}: {
  sticky: Sticky;
  onChange: (text: string) => void;
  onMove: (x: number, y: number) => void;
  onDelete: () => void;
}) {
  const dragging = useRef<{ ox: number; oy: number } | null>(null);
  return (
    <div
      className="group absolute w-36 rounded-lg p-2 text-black shadow-lg"
      style={{ left: sticky.x, top: sticky.y, background: sticky.color }}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).tagName === "TEXTAREA") return;
        dragging.current = { ox: e.clientX - sticky.x, oy: e.clientY - sticky.y };
        (e.target as Element).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        onMove(e.clientX - dragging.current.ox, e.clientY - dragging.current.oy);
      }}
      onPointerUp={() => (dragging.current = null)}
    >
      <button
        type="button"
        onClick={onDelete}
        className="absolute -right-2 -top-2 hidden h-5 w-5 rounded-full bg-black/70 text-xs text-white group-hover:block"
      >
        ✕
      </button>
      <textarea
        value={sticky.text}
        onChange={(e) => onChange(e.target.value)}
        className="h-20 w-full resize-none bg-transparent text-sm focus:outline-none"
      />
    </div>
  );
}

function ToolBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-2.5 py-1 text-xs transition ${
        active ? "bg-indigo-500 text-white" : "bg-white/10 text-white/80 hover:bg-white/20"
      }`}
    >
      {children}
    </button>
  );
}
