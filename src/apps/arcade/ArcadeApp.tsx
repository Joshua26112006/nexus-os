"use client";

/**
 * Retro Arcade — a neon game hub with a built-in, fully playable Breakout game
 * plus quick-launch cards for the other NEXUS games. Move the paddle with the
 * mouse or arrow keys; clear all the bricks.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { launchApp } from "@/core/launcher";

const W = 420;
const H = 320;

export function ArcadeApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"ready" | "playing" | "won" | "lost">("ready");
  const [score, setScore] = useState(0);

  const game = useRef({
    paddleX: W / 2 - 35,
    ball: { x: W / 2, y: H - 40, vx: 3, vy: -3 },
    bricks: [] as { x: number; y: number; alive: boolean; hue: number }[],
    lives: 3,
  });

  const initBricks = useCallback(() => {
    const bricks = [];
    const cols = 8, rows = 4, bw = 46, bh = 16, pad = 4, offX = 10, offY = 30;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        bricks.push({ x: offX + c * (bw + pad), y: offY + r * (bh + pad), alive: true, hue: r * 40 + 200 });
    game.current.bricks = bricks;
  }, []);

  const reset = useCallback(() => {
    game.current.paddleX = W / 2 - 35;
    game.current.ball = { x: W / 2, y: H - 40, vx: 3, vy: -3 };
    game.current.lives = 3;
    initBricks();
    setScore(0);
    setState("playing");
  }, [initBricks]);

  // Render helper.
  const render = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const g = game.current;
    ctx.fillStyle = "#0a0a16";
    ctx.fillRect(0, 0, W, H);
    // bricks
    for (const b of g.bricks) {
      if (!b.alive) continue;
      ctx.fillStyle = `hsl(${b.hue}, 80%, 60%)`;
      ctx.fillRect(b.x, b.y, 46, 16);
    }
    // paddle
    ctx.fillStyle = "#a5b4fc";
    ctx.fillRect(g.paddleX, H - 16, 70, 8);
    // ball
    ctx.fillStyle = "#f43f5e";
    ctx.beginPath();
    ctx.arc(g.ball.x, g.ball.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  // Game loop.
  useEffect(() => {
    if (state !== "playing") { render(); return; }
    let raf = 0;
    const step = () => {
      const g = game.current;
      const ball = g.ball;
      ball.x += ball.vx;
      ball.y += ball.vy;
      // walls
      if (ball.x < 6 || ball.x > W - 6) ball.vx *= -1;
      if (ball.y < 6) ball.vy *= -1;
      // paddle
      if (ball.y > H - 22 && ball.y < H - 10 && ball.x > g.paddleX && ball.x < g.paddleX + 70) {
        ball.vy = -Math.abs(ball.vy);
        ball.vx += ((ball.x - (g.paddleX + 35)) / 35) * 1.5;
      }
      // floor
      if (ball.y > H) {
        g.lives -= 1;
        if (g.lives <= 0) { setState("lost"); return; }
        ball.x = W / 2; ball.y = H - 40; ball.vx = 3; ball.vy = -3;
      }
      // bricks
      for (const b of g.bricks) {
        if (b.alive && ball.x > b.x && ball.x < b.x + 46 && ball.y > b.y && ball.y < b.y + 16) {
          b.alive = false;
          ball.vy *= -1;
          setScore((s) => s + 10);
          break;
        }
      }
      if (g.bricks.every((b) => !b.alive)) { setState("won"); return; }
      render();
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [state, render]);

  // Controls.
  const onMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    game.current.paddleX = Math.max(0, Math.min(W - 70, e.clientX - rect.left - 35));
  };
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") game.current.paddleX = Math.max(0, game.current.paddleX - 24);
      if (e.key === "ArrowRight") game.current.paddleX = Math.min(W - 70, game.current.paddleX + 24);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const GAMES = [
    { id: "snake", icon: "🐍", name: "Snake" },
    { id: "chess", icon: "♟️", name: "Chess" },
    { id: "pet", icon: "🐾", name: "Virtual Pet" },
  ];

  return (
    <div className="flex h-full w-full flex-col items-center gap-3 overflow-auto bg-gradient-to-b from-[#160d2e] to-[#0a0a16] p-4 text-white nexus-scroll">
      <h2 className="text-xl font-bold tracking-[0.2em] text-fuchsia-400 drop-shadow-[0_0_10px_rgba(232,121,249,0.6)]">
        ◕ NEXUS ARCADE ◕
      </h2>

      {/* Breakout */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onMouseMove={onMouseMove}
          className="rounded-lg ring-1 ring-fuchsia-500/30"
        />
        {state !== "playing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-black/75">
            {state === "won" && <p className="text-2xl font-bold text-emerald-400">You Win! 🏆</p>}
            {state === "lost" && <p className="text-2xl font-bold text-rose-400">Game Over</p>}
            <button
              type="button"
              onClick={reset}
              className="rounded-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-6 py-2 font-semibold shadow-lg transition hover:brightness-110"
            >
              {state === "ready" ? "Insert Coin ▶" : "Play Again"}
            </button>
            <p className="text-xs text-white/50">Mouse or ← → to move</p>
          </div>
        )}
      </div>
      <p className="text-sm">Score: <b className="text-fuchsia-300">{score}</b></p>

      {/* More games */}
      <div className="mt-1 w-full">
        <p className="mb-2 text-center text-xs uppercase tracking-widest text-white/40">More Games</p>
        <div className="flex justify-center gap-3">
          {GAMES.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => launchApp(g.id)}
              className="flex w-24 flex-col items-center gap-1 rounded-xl bg-white/5 p-3 ring-1 ring-white/10 transition hover:bg-white/10 hover:ring-fuchsia-500/40"
            >
              <span className="text-3xl">{g.icon}</span>
              <span className="text-xs">{g.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
