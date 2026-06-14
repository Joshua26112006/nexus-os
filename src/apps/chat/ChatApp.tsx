"use client";

/**
 * AI Chat — a conversational assistant in a window. It routes input through the
 * same orchestrator the Command Center uses, so it can *act* on the OS (open
 * apps, change settings, do math) and reply with the result. Non-command chat
 * gets helpful, friendly responses. Fully offline (rule-based provider).
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAiStore } from "@/store/ai-store";

interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
}

const SUGGESTIONS = [
  "open notes",
  "calculate 1920 * 1080",
  "make it rain",
  "set wallpaper to nebula",
  "what can you do?",
];

function smalltalk(input: string): string | null {
  const t = input.toLowerCase();
  if (/^(hi|hey|hello|yo)\b/.test(t)) return "Hey! I'm Nova, your NEXUS assistant. Ask me to open apps, do math, or change the desktop.";
  if (t.includes("what can you do") || t.includes("help")) return "I can open any app, run calculations, create notes, change the theme/wallpaper, control the weather and time of day, and more — just ask in plain language. Try \"open code editor\" or \"make it snow\".";
  if (t.includes("thank")) return "Anytime! ✦";
  if (t.includes("who are you") || t.includes("your name")) return "I'm Nova — the AI woven into NEXUS OS.";
  return null;
}

export function ChatApp() {
  const submit = useAiStore((s) => s.submit);
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: "assistant", text: "Hi, I'm Nova ✦ — ask me to do something on your NEXUS desktop." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const nextId = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    const value = text.trim();
    if (!value || busy) return;
    setMessages((m) => [...m, { id: nextId.current++, role: "user", text: value }]);
    setInput("");
    setBusy(true);

    const canned = smalltalk(value);
    let reply: string;
    if (canned) {
      reply = canned;
    } else {
      const turn = await submit(value);
      reply = turn.ok
        ? `✓ ${turn.response}`
        : `${turn.response}`;
    }
    // Small delay for a natural feel.
    await new Promise((r) => setTimeout(r, 250));
    setMessages((m) => [...m, { id: nextId.current++, role: "assistant", text: reply }]);
    setBusy(false);
  };

  return (
    <div className="flex h-full w-full flex-col bg-bg text-text">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-surface px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-sm">✦</span>
        <div>
          <p className="text-sm font-semibold">Nova</p>
          <p className="text-xs text-emerald-500">● online</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="nexus-scroll flex-1 space-y-3 overflow-auto p-4">
        {messages.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                m.role === "user"
                  ? "rounded-br-sm bg-accent text-accent-fg"
                  : "rounded-bl-sm bg-surface-elevated text-text"
              }`}
            >
              {m.text}
            </div>
          </motion.div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-surface-elevated px-3 py-2.5">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="flex shrink-0 flex-wrap gap-1.5 px-4 pb-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="rounded-full bg-surface-elevated px-2.5 py-1 text-xs text-text-muted transition hover:text-text"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex shrink-0 items-center gap-2 border-t border-border bg-surface p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder="Message Nova…"
          className="flex-1 rounded-full border border-border bg-surface-elevated px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="button"
          onClick={() => send(input)}
          disabled={busy}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-fg transition hover:brightness-110 disabled:opacity-50"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
