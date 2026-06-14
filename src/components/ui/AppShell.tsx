"use client";

/**
 * AppShell — the standard inner layout every app uses: an optional toolbar row
 * on top and a scrollable body below. Keeps app chrome consistent and removes
 * boilerplate from each app (reusable-components requirement).
 */

import type { ReactNode } from "react";
import { cn } from "@/core/utils";

interface AppShellProps {
  toolbar?: ReactNode;
  /** Optional left sidebar (e.g. Notes list, Settings sections). */
  sidebar?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function AppShell({ toolbar, sidebar, children, className }: AppShellProps) {
  return (
    <div className="flex h-full w-full flex-col bg-bg text-text">
      {toolbar && (
        <div className="flex shrink-0 items-center gap-1 border-b border-border bg-surface px-2 py-1.5">
          {toolbar}
        </div>
      )}
      <div className="flex min-h-0 flex-1">
        {sidebar && (
          <div className="w-48 shrink-0 overflow-auto border-r border-border bg-surface nexus-scroll">
            {sidebar}
          </div>
        )}
        <div className={cn("nexus-scroll min-w-0 flex-1 overflow-auto", className)}>
          {children}
        </div>
      </div>
    </div>
  );
}
