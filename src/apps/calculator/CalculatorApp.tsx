"use client";

/**
 * Calculator (Phase 2). Basic and scientific modes over the shared expression
 * engine (correct operator precedence). Supports button input and the keyboard.
 */

import { useCallback, useEffect, useState } from "react";
import { evaluate } from "./engine";
import { cn } from "@/core/utils";
import { useIntentStore } from "@/store/intent-store";

type Mode = "basic" | "scientific";

const BASIC_KEYS = [
  "C", "(", ")", "/",
  "7", "8", "9", "*",
  "4", "5", "6", "-",
  "1", "2", "3", "+",
  "0", ".", "⌫", "=",
];

const SCI_KEYS = ["sin(", "cos(", "tan(", "ln(", "sqrt(", "^", "pi", "e", "%", "log("];

export function CalculatorApp() {
  const [expr, setExpr] = useState("");
  const [result, setResult] = useState<string>("0");
  const [isError, setIsError] = useState(false);
  const [mode, setMode] = useState<Mode>("basic");

  // A pending AI intent (e.g. "calculate 54 * 12") is delivered here.
  const pendingCalcIntent = useIntentStore((s) => s.pending.calculator);
  const consumeIntent = useIntentStore((s) => s.consumeIntent);

  const compute = useCallback((expression: string) => {
    try {
      const value = evaluate(expression);
      setResult(String(Number(value.toFixed(10))));
      setIsError(false);
    } catch {
      setResult("Error");
      setIsError(true);
    }
  }, []);

  // Honour a pending AI intent: load the expression and show its result.
  useEffect(() => {
    if (!pendingCalcIntent) return;
    const intent = consumeIntent("calculator");
    if (!intent || intent.action !== "evaluate") return;
    setExpr(intent.expression);
    compute(intent.expression);
  }, [pendingCalcIntent, consumeIntent, compute]);

  const press = useCallback(
    (key: string) => {
      if (key === "C") {
        setExpr("");
        setResult("0");
        setIsError(false);
        return;
      }
      if (key === "⌫") {
        setExpr((e) => e.slice(0, -1));
        return;
      }
      if (key === "=") {
        compute(expr);
        return;
      }
      setExpr((e) => e + key);
    },
    [expr, compute],
  );

  // Live preview as the expression changes.
  useEffect(() => {
    if (!expr) {
      setResult("0");
      setIsError(false);
      return;
    }
    try {
      const value = evaluate(expr);
      setResult(String(Number(value.toFixed(10))));
      setIsError(false);
    } catch {
      // Don't show an error while still typing; keep the last good result.
    }
  }, [expr]);

  // Keyboard support (CA-1).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const k = e.key;
      if (/[0-9.+\-*/()%^]/.test(k)) {
        setExpr((prev) => prev + k);
        e.preventDefault();
      } else if (k === "Enter" || k === "=") {
        compute(expr);
        e.preventDefault();
      } else if (k === "Backspace") {
        setExpr((prev) => prev.slice(0, -1));
        e.preventDefault();
      } else if (k === "Escape") {
        setExpr("");
        setResult("0");
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [expr, compute]);

  return (
    <div className="flex h-full w-full flex-col bg-bg text-text">
      {/* Mode toggle */}
      <div className="flex shrink-0 gap-1 border-b border-border p-2">
        {(["basic", "scientific"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "flex-1 rounded-md px-2 py-1 text-xs font-medium capitalize transition",
              mode === m
                ? "bg-accent text-accent-fg"
                : "text-text-muted hover:bg-surface-elevated",
            )}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Display */}
      <div className="flex shrink-0 flex-col items-end justify-end gap-1 bg-surface px-4 py-3">
        <div className="h-5 w-full truncate text-right text-sm text-text-muted">
          {expr || " "}
        </div>
        <div
          className={cn(
            "w-full truncate text-right text-3xl font-semibold tabular-nums",
            isError ? "text-rose-400" : "text-text",
          )}
        >
          {result}
        </div>
      </div>

      {/* Scientific row */}
      {mode === "scientific" && (
        <div className="grid grid-cols-5 gap-1 p-2 pb-0">
          {SCI_KEYS.map((key) => (
            <CalcButton key={key} label={key} onClick={() => press(key)} variant="sci" />
          ))}
        </div>
      )}

      {/* Basic grid */}
      <div className="grid flex-1 grid-cols-4 gap-1 p-2">
        {BASIC_KEYS.map((key) => (
          <CalcButton
            key={key}
            label={key}
            onClick={() => press(key)}
            variant={key === "=" ? "equals" : /[/*\-+]/.test(key) ? "op" : "num"}
          />
        ))}
      </div>
    </div>
  );
}

function CalcButton({
  label,
  onClick,
  variant,
}: {
  label: string;
  onClick: () => void;
  variant: "num" | "op" | "equals" | "sci";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex items-center justify-center rounded-md text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        variant === "num" && "bg-surface-elevated text-text hover:brightness-125",
        variant === "op" && "bg-accent/20 text-accent hover:bg-accent/30",
        variant === "equals" && "bg-accent text-accent-fg hover:brightness-110",
        variant === "sci" && "bg-surface text-text-muted hover:bg-surface-elevated py-1.5 text-xs",
      )}
    >
      {label.replace(/\($/, "")}
    </button>
  );
}
