"use client";

/**
 * Kanban board — multiple boards, columns, and drag-and-drop cards.
 * State persists to localStorage so boards survive reloads.
 */

import { useEffect, useState } from "react";

interface Card {
  id: string;
  text: string;
}
interface Column {
  id: string;
  title: string;
  cards: Card[];
}
interface Board {
  id: string;
  name: string;
  columns: Column[];
}

const uid = () => Math.random().toString(36).slice(2, 9);

function seedBoards(): Board[] {
  return [
    {
      id: uid(),
      name: "Product Roadmap",
      columns: [
        { id: uid(), title: "Backlog", cards: [{ id: uid(), text: "Research competitors" }, { id: uid(), text: "Define MVP scope" }] },
        { id: uid(), title: "In Progress", cards: [{ id: uid(), text: "Build onboarding flow" }] },
        { id: uid(), title: "Review", cards: [{ id: uid(), text: "Design system audit" }] },
        { id: uid(), title: "Done", cards: [{ id: uid(), text: "Set up CI pipeline" }] },
      ],
    },
    {
      id: uid(),
      name: "Personal",
      columns: [
        { id: uid(), title: "To Do", cards: [{ id: uid(), text: "Plan weekend trip" }] },
        { id: uid(), title: "Doing", cards: [] },
        { id: uid(), title: "Done", cards: [{ id: uid(), text: "Renew gym membership" }] },
      ],
    },
  ];
}

const STORE_KEY = "nexus.kanban";

export function KanbanApp() {
  const [boards, setBoards] = useState<Board[]>(() => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) try { return JSON.parse(raw); } catch { /* ignore */ }
    }
    return seedBoards();
  });
  const [activeBoardId, setActiveBoardId] = useState<string>(() => "");
  const [drag, setDrag] = useState<{ cardId: string; fromCol: string } | null>(null);

  useEffect(() => {
    if (!activeBoardId && boards[0]) setActiveBoardId(boards[0].id);
  }, [boards, activeBoardId]);

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(boards));
  }, [boards]);

  const board = boards.find((b) => b.id === activeBoardId) ?? boards[0];

  const update = (fn: (b: Board) => Board) =>
    setBoards((list) => list.map((b) => (b.id === board.id ? fn(b) : b)));

  const addCard = (colId: string) => {
    const text = prompt("New task:");
    if (!text) return;
    update((b) => ({
      ...b,
      columns: b.columns.map((c) =>
        c.id === colId ? { ...c, cards: [...c.cards, { id: uid(), text }] } : c,
      ),
    }));
  };

  const deleteCard = (colId: string, cardId: string) =>
    update((b) => ({
      ...b,
      columns: b.columns.map((c) =>
        c.id === colId ? { ...c, cards: c.cards.filter((x) => x.id !== cardId) } : c,
      ),
    }));

  const drop = (toCol: string) => {
    if (!drag) return;
    update((b) => {
      let moved: Card | undefined;
      const columns = b.columns.map((c) => {
        if (c.id === drag.fromCol) {
          moved = c.cards.find((x) => x.id === drag.cardId);
          return { ...c, cards: c.cards.filter((x) => x.id !== drag.cardId) };
        }
        return c;
      });
      return {
        ...b,
        columns: columns.map((c) =>
          c.id === toCol && moved ? { ...c, cards: [...c.cards, moved] } : c,
        ),
      };
    });
    setDrag(null);
  };

  const addBoard = () => {
    const name = prompt("Board name:");
    if (!name) return;
    const nb: Board = {
      id: uid(),
      name,
      columns: [
        { id: uid(), title: "To Do", cards: [] },
        { id: uid(), title: "Doing", cards: [] },
        { id: uid(), title: "Done", cards: [] },
      ],
    };
    setBoards((l) => [...l, nb]);
    setActiveBoardId(nb.id);
  };

  if (!board) return null;

  return (
    <div className="flex h-full w-full flex-col bg-bg text-text">
      {/* Board tabs */}
      <div className="flex shrink-0 items-center gap-1 border-b border-border bg-surface px-3 py-2">
        {boards.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setActiveBoardId(b.id)}
            className={`rounded-full px-3 py-1 text-sm transition ${
              b.id === board.id ? "bg-accent text-accent-fg" : "text-text-muted hover:bg-surface-elevated"
            }`}
          >
            {b.name}
          </button>
        ))}
        <button
          type="button"
          onClick={addBoard}
          className="ml-1 rounded-full bg-surface-elevated px-2.5 py-1 text-sm text-text-muted hover:text-text"
        >
          ＋
        </button>
      </div>

      {/* Columns */}
      <div className="nexus-scroll flex flex-1 gap-3 overflow-x-auto p-4">
        {board.columns.map((col) => (
          <div
            key={col.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => drop(col.id)}
            className="flex w-64 shrink-0 flex-col rounded-xl bg-surface p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{col.title}</h3>
              <span className="rounded-full bg-surface-elevated px-2 text-xs text-text-muted">
                {col.cards.length}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              {col.cards.map((card) => (
                <div
                  key={card.id}
                  draggable
                  onDragStart={() => setDrag({ cardId: card.id, fromCol: col.id })}
                  className="group cursor-grab rounded-lg border border-border bg-surface-elevated p-2.5 text-sm shadow-sm transition hover:border-accent active:cursor-grabbing"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span>{card.text}</span>
                    <button
                      type="button"
                      onClick={() => deleteCard(col.id, card.id)}
                      className="hidden text-xs text-text-muted hover:text-rose-400 group-hover:block"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => addCard(col.id)}
              className="mt-2 rounded-lg border border-dashed border-border py-1.5 text-xs text-text-muted transition hover:border-accent hover:text-text"
            >
              ＋ Add card
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
