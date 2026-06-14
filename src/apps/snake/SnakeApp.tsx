"use client";

/**
 * Snake — the classic, fully playable on a canvas grid. Arrow keys or WASD to
 * steer, eat food to grow, don't hit the walls or yourself. Tracks score and a
 * persisted high score.
 */

import { useCallback, useEffect, useRef, useState } from "react";

const GRID = 20;
const CELL = 20;
const SPEED = 110; // ms per step
const HS_KEY = "nexus.snake.hs";

type Point = { x: number; y: number };
type Dir = "up" | "down" | "left" | "right";

const DIRS: Record<Dir, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const OPPOSITE: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" };

export function SnakeApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [state, setState] = useState<"ready" | "playing" | "over">("ready");

  // Mutable game refs (don't trigger re-renders each tick).
  const snake = useRef<Point[]>([{ x: 10, y: 10 }]);
  const dir = useRef<Dir>("right");
  const nextDir = useRef<Dir>("right");
  const food = useRef<Point>({ x: 15, y: 10 });

  useEffect(() => {
    setHighScore(Number(localStorage.getItem(HS_KEY) || 0));
  }, []);

  const placeFood = useCallback(() => {
    let p: Point;
    do {
      p = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
    } while (snake.current.some((s) => s.x === p.x && s.y === p.y));
    food.current = p;
  }, []);

  const reset = useCallback(() => {
    snake.current = [{ x: 10, y: 10 }];
    dir.current = "right";
    nextDir.current = "right";
    setScore(0);
    placeFood();
    setState("playing");
  }, [placeFood]);

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#0b1020";
    ctx.fillRect(0, 0, GRID * CELL, GRID * CELL);
    // grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, GRID * CELL); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(GRID * CELL, i * CELL); ctx.stroke();
    }
    // food
    ctx.fillStyle = "#f43f5e";
    ctx.beginPath();
    ctx.arc(food.current.x * CELL + CELL / 2, food.current.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    // snake
    snake.current.forEach((s, i) => {
      const t = i / snake.current.length;
      ctx.fillStyle = i === 0 ? "#a5b4fc" : `rgba(129,140,248,${1 - t * 0.6})`;
      ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
    });
  }, []);

  // Game loop.
  useEffect(() => {
    if (state !== "playing") { draw(); return; }
    const id = setInterval(() => {
      dir.current = nextDir.current;
      const head = snake.current[0];
      const d = DIRS[dir.current];
      const newHead = { x: head.x + d.x, y: head.y + d.y };

      // Collisions.
      if (
        newHead.x < 0 || newHead.x >= GRID || newHead.y < 0 || newHead.y >= GRID ||
        snake.current.some((s) => s.x === newHead.x && s.y === newHead.y)
      ) {
        setState("over");
        setScore((sc) => {
          setHighScore((hs) => {
            const nhs = Math.max(hs, sc);
            localStorage.setItem(HS_KEY, String(nhs));
            return nhs;
          });
          return sc;
        });
        return;
      }

      const ate = newHead.x === food.current.x && newHead.y === food.current.y;
      const body = [newHead, ...snake.current];
      if (!ate) body.pop();
      else { setScore((s) => s + 10); placeFood(); }
      snake.current = body;
      draw();
    }, SPEED);
    return () => clearInterval(id);
  }, [state, draw, placeFood]);

  // Controls.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
        w: "up", s: "down", a: "left", d: "right",
      };
      const nd = map[e.key];
      if (!nd) return;
      e.preventDefault();
      if (nd !== OPPOSITE[dir.current]) nextDir.current = nd;
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#0b1020] p-4 text-white">
      <div className="flex w-full max-w-[400px] items-center justify-between">
        <span className="text-sm">Score: <b className="text-indigo-300">{score}</b></span>
        <span className="text-lg font-bold tracking-wide">🐍 SNAKE</span>
        <span className="text-sm">Best: <b className="text-amber-300">{highScore}</b></span>
      </div>

      <div className="relative">
        <canvas ref={canvasRef} width={GRID * CELL} height={GRID * CELL} className="rounded-lg ring-1 ring-white/10" />
        {state !== "playing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-black/70">
            {state === "over" && <p className="text-2xl font-bold text-rose-400">Game Over</p>}
            <button
              type="button"
              onClick={reset}
              className="rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-6 py-2 font-semibold shadow-lg transition hover:brightness-110"
            >
              {state === "over" ? "Play Again" : "Start"}
            </button>
            <p className="text-xs text-white/50">Arrow keys or WASD</p>
          </div>
        )}
      </div>
    </div>
  );
}
