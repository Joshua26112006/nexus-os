"use client";

/**
 * ToolbarButton — a compact action button for app toolbars. Reused across
 * Files, Notes, and Settings so toolbar affordances look and behave the same.
 */

import type { ReactNode } from "react";
import { cn } from "@/core/utils";

interface ToolbarButtonProps {
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
  active?: boolean;
  children: ReactNode;
}

export function ToolbarButton({
  onClick,
  title,
  disabled,
  active,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        "disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "bg-accent text-accent-fg"
          : "text-text hover:bg-surface-elevated",
      )}
    >
      {children}
    </button>
  );
}
