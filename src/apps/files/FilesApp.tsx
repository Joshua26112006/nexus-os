"use client";

/**
 * File Explorer (Phase 2). Navigates the shared VFS and supports:
 *  - folder navigation (double-click a folder, breadcrumb up)
 *  - create folder / create file
 *  - rename
 *  - delete
 *
 * All state lives in the VFS store, so changes are instantly reflected in the
 * Terminal and Notes apps too (via the `fs:changed` event + shared store).
 */

import { useState, useMemo } from "react";
import type { VfsEntry } from "@/types";
import { useVfsStore, VFS_ROOT_ID } from "@/store/vfs-store";
import { AppShell } from "@/components/ui/AppShell";
import { ToolbarButton } from "@/components/ui/ToolbarButton";

export function FilesApp() {
  const [cwdId, setCwdId] = useState<string>(VFS_ROOT_ID);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Subscribe to the node map so the listing re-renders on any FS change.
  const nodes = useVfsStore((s) => s.nodes);
  const childrenOf = useVfsStore((s) => s.childrenOf);
  const getPath = useVfsStore((s) => s.getPath);
  const createNode = useVfsStore((s) => s.createNode);
  const rename = useVfsStore((s) => s.rename);
  const remove = useVfsStore((s) => s.remove);

  // Recompute the listing whenever the tree (`nodes`) or cwd changes.
  const entries = useMemo(
    () => childrenOf(cwdId),
    // `nodes` is the reactive trigger; childrenOf reads the latest tree.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodes, cwdId],
  );
  const cwdPath = getPath(cwdId) || "/";

  const flash = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 2500);
  };

  const handleOpen = (entry: VfsEntry) => {
    if (entry.type === "directory") {
      setCwdId(entry.id);
      setSelectedId(null);
    }
  };

  const handleCreate = (type: "directory" | "file") => {
    const base = type === "directory" ? "New Folder" : "untitled.txt";
    // Find a non-colliding name.
    let name = base;
    let i = 2;
    const existing = new Set(entries.map((e) => e.name));
    while (existing.has(name)) {
      name = type === "directory" ? `New Folder ${i}` : `untitled-${i}.txt`;
      i++;
    }
    const result = createNode(cwdId, name, type);
    if (!result.ok) {
      flash(result.error);
      return;
    }
    // Immediately enter rename mode for the new node.
    setSelectedId(result.value);
    setRenamingId(result.value);
    setRenameValue(name);
  };

  const commitRename = () => {
    if (!renamingId) return;
    const result = rename(renamingId, renameValue);
    if (!result.ok) {
      flash(result.error);
      return;
    }
    setRenamingId(null);
  };

  const handleDelete = () => {
    if (!selectedId) return;
    remove(selectedId);
    setSelectedId(null);
  };

  // Breadcrumb segments from root to cwd.
  const crumbs = buildCrumbs(cwdPath);

  return (
    <AppShell
      toolbar={
        <>
          <ToolbarButton
            onClick={() => handleCreate("directory")}
            title="New folder"
          >
            📁 New Folder
          </ToolbarButton>
          <ToolbarButton onClick={() => handleCreate("file")} title="New file">
            📄 New File
          </ToolbarButton>
          <div className="mx-1 h-5 w-px bg-border" />
          <ToolbarButton
            onClick={() => {
              if (!selectedId) return;
              const e = entries.find((x) => x.id === selectedId);
              if (e) {
                setRenamingId(e.id);
                setRenameValue(e.name);
              }
            }}
            title="Rename"
            disabled={!selectedId}
          >
            ✏️ Rename
          </ToolbarButton>
          <ToolbarButton onClick={handleDelete} title="Delete" disabled={!selectedId}>
            🗑️ Delete
          </ToolbarButton>
          {error && (
            <span className="ml-2 truncate text-xs text-rose-400">{error}</span>
          )}
        </>
      }
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 border-b border-border bg-surface px-3 py-1.5 text-sm">
        {crumbs.map((crumb, idx) => (
          <span key={crumb.id} className="flex items-center gap-1">
            {idx > 0 && <span className="text-text-muted">/</span>}
            <button
              type="button"
              onClick={() => {
                setCwdId(crumb.id);
                setSelectedId(null);
              }}
              className="rounded px-1.5 py-0.5 text-text-muted transition hover:bg-surface-elevated hover:text-text"
            >
              {crumb.label}
            </button>
          </span>
        ))}
      </div>

      {/* Grid of entries */}
      {entries.length === 0 ? (
        <div className="flex h-full items-center justify-center p-8 text-sm text-text-muted">
          This folder is empty.
        </div>
      ) : (
        <div
          className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2 p-3"
          onClick={() => setSelectedId(null)}
        >
          {entries.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(entry.id);
              }}
              onDoubleClick={() => handleOpen(entry)}
              className={`flex flex-col items-center gap-1.5 rounded-lg p-3 text-center transition ${
                selectedId === entry.id
                  ? "bg-accent/20 ring-1 ring-accent"
                  : "hover:bg-surface-elevated"
              }`}
            >
              <span className="text-4xl">
                {entry.type === "directory" ? "📁" : "📄"}
              </span>
              {renamingId === entry.id ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") setRenamingId(null);
                  }}
                  className="w-full rounded border border-accent bg-surface px-1 text-center text-xs text-text focus:outline-none"
                />
              ) : (
                <span className="line-clamp-2 break-all text-xs text-text">
                  {entry.name}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </AppShell>
  );
}

/** Build clickable breadcrumb segments from an absolute path. */
function buildCrumbs(path: string): { id: string; label: string }[] {
  // We only have the path string here; map each prefix back to a node via the
  // store's resolvePath at click time would be ideal, but for the breadcrumb we
  // resolve ids through the store.
  const segments = path.split("/").filter(Boolean);
  const crumbs: { id: string; label: string }[] = [
    { id: VFS_ROOT_ID, label: "Root" },
  ];
  const resolvePath = useVfsStore.getState().resolvePath;
  let acc = "";
  for (const seg of segments) {
    acc += "/" + seg;
    const node = resolvePath(acc);
    if (node) crumbs.push({ id: node.id, label: seg });
  }
  return crumbs;
}
