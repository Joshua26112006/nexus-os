"use client";

/**
 * Chess — a playable two-player board with real per-piece move generation
 * (pawns, knights, bishops, rooks, queens, kings) including path blocking and
 * captures, alternating turns, and a captured-pieces tray. (Castling, en
 * passant, and check detection are intentionally out of scope.)
 */

import { useMemo, useState } from "react";

type Color = "w" | "b";
type Type = "p" | "n" | "b" | "r" | "q" | "k";
interface Piece { color: Color; type: Type }
type Board = (Piece | null)[][];

const GLYPH: Record<Color, Record<Type, string>> = {
  w: { p: "♙", n: "♘", b: "♗", r: "♖", q: "♕", k: "♔" },
  b: { p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚" },
};

function initialBoard(): Board {
  const back: Type[] = ["r", "n", "b", "q", "k", "b", "n", "r"];
  const board: Board = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let c = 0; c < 8; c++) {
    board[0][c] = { color: "b", type: back[c] };
    board[1][c] = { color: "b", type: "p" };
    board[6][c] = { color: "w", type: "p" };
    board[7][c] = { color: "w", type: back[c] };
  }
  return board;
}

const inBounds = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;

/** Legal destination squares for the piece at (r,c). No check validation. */
function legalMoves(board: Board, r: number, c: number): [number, number][] {
  const piece = board[r][c];
  if (!piece) return [];
  const moves: [number, number][] = [];
  const enemy = (rr: number, cc: number) => board[rr][cc] && board[rr][cc]!.color !== piece.color;
  const empty = (rr: number, cc: number) => !board[rr][cc];

  const ray = (dr: number, dc: number) => {
    let rr = r + dr, cc = c + dc;
    while (inBounds(rr, cc)) {
      if (empty(rr, cc)) moves.push([rr, cc]);
      else { if (enemy(rr, cc)) moves.push([rr, cc]); break; }
      rr += dr; cc += dc;
    }
  };

  switch (piece.type) {
    case "p": {
      const dir = piece.color === "w" ? -1 : 1;
      const startRow = piece.color === "w" ? 6 : 1;
      if (inBounds(r + dir, c) && empty(r + dir, c)) {
        moves.push([r + dir, c]);
        if (r === startRow && empty(r + 2 * dir, c)) moves.push([r + 2 * dir, c]);
      }
      for (const dc of [-1, 1]) {
        if (inBounds(r + dir, c + dc) && enemy(r + dir, c + dc)) moves.push([r + dir, c + dc]);
      }
      break;
    }
    case "n":
      for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
        const rr = r + dr, cc = c + dc;
        if (inBounds(rr, cc) && (empty(rr, cc) || enemy(rr, cc))) moves.push([rr, cc]);
      }
      break;
    case "b": [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dr,dc]) => ray(dr,dc)); break;
    case "r": [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr,dc]) => ray(dr,dc)); break;
    case "q": [[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr,dc]) => ray(dr,dc)); break;
    case "k":
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const rr = r + dr, cc = c + dc;
        if (inBounds(rr, cc) && (empty(rr, cc) || enemy(rr, cc))) moves.push([rr, cc]);
      }
      break;
  }
  return moves;
}

export function ChessApp() {
  const [board, setBoard] = useState<Board>(initialBoard);
  const [turn, setTurn] = useState<Color>("w");
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [captured, setCaptured] = useState<Piece[]>([]);

  const moves = useMemo(
    () => (selected ? legalMoves(board, selected[0], selected[1]) : []),
    [board, selected],
  );

  const click = (r: number, c: number) => {
    const piece = board[r][c];
    if (selected) {
      const isMove = moves.some(([mr, mc]) => mr === r && mc === c);
      if (isMove) {
        const next = board.map((row) => row.slice());
        const target = next[r][c];
        if (target) setCaptured((cap) => [...cap, target]);
        next[r][c] = next[selected[0]][selected[1]];
        next[selected[0]][selected[1]] = null;
        // Auto-queen promotion.
        const moved = next[r][c]!;
        if (moved.type === "p" && (r === 0 || r === 7)) moved.type = "q";
        setBoard(next);
        setTurn((t) => (t === "w" ? "b" : "w"));
        setSelected(null);
        return;
      }
    }
    if (piece && piece.color === turn) setSelected([r, c]);
    else setSelected(null);
  };

  const reset = () => {
    setBoard(initialBoard());
    setTurn("w");
    setSelected(null);
    setCaptured([]);
  };

  const capByColor = (col: Color) => captured.filter((p) => p.color === col);

  return (
    <div className="flex h-full w-full flex-col items-center gap-2 bg-[#1a1410] p-3 text-white">
      <div className="flex w-full items-center justify-between px-1">
        <CapturedTray pieces={capByColor("b")} />
        <button type="button" onClick={reset} className="rounded-md bg-white/10 px-3 py-1 text-xs hover:bg-white/20">
          ↻ New Game
        </button>
      </div>

      <div className="relative">
        <div className="grid grid-cols-8 overflow-hidden rounded-lg shadow-2xl ring-1 ring-black/40">
          {board.map((row, r) =>
            row.map((piece, c) => {
              const dark = (r + c) % 2 === 1;
              const isSel = selected && selected[0] === r && selected[1] === c;
              const isMove = moves.some(([mr, mc]) => mr === r && mc === c);
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  onClick={() => click(r, c)}
                  className={`relative flex h-[52px] w-[52px] items-center justify-center text-[34px] leading-none transition ${
                    dark ? "bg-[#9c6b43]" : "bg-[#e8d3b0]"
                  } ${isSel ? "ring-2 ring-inset ring-indigo-400" : ""}`}
                >
                  <span className={piece?.color === "w" ? "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]" : "text-black"}>
                    {piece ? GLYPH[piece.color][piece.type] : ""}
                  </span>
                  {isMove && (
                    <span className={`absolute ${board[r][c] ? "inset-1 rounded-full ring-4 ring-emerald-400/70" : "h-3 w-3 rounded-full bg-emerald-400/70"}`} />
                  )}
                </button>
              );
            }),
          )}
        </div>
      </div>

      <div className="flex w-full items-center justify-between px-1">
        <CapturedTray pieces={capByColor("w")} />
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
          {turn === "w" ? "⚪ White" : "⚫ Black"} to move
        </span>
      </div>
    </div>
  );
}

function CapturedTray({ pieces }: { pieces: Piece[] }) {
  return (
    <div className="flex h-6 min-w-[120px] items-center gap-0.5 text-lg">
      {pieces.map((p, i) => (
        <span key={i} className={p.color === "w" ? "text-white/80" : "text-black/70"}>
          {GLYPH[p.color][p.type]}
        </span>
      ))}
    </div>
  );
}
