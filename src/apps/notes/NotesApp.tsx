"use client";

/**
 * Notes (Phase 2). Multiple notes persisted as files under /home/notes in the
 * shared VFS, with:
 *  - a sidebar list of all notes
 *  - autosave (debounced) as you type
 *  - create / delete notes
 *
 * Storing notes in the VFS means they also appear in Files and Terminal — one
 * source of truth (Architecture.md: state is sacred, one owner per slice).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useVfsStore } from "@/store/vfs-store";
import { AppShell } from "@/components/ui/AppShell";
import { ToolbarButton } from "@/components/ui/ToolbarButton";
import { useIntentStore } from "@/store/intent-store";

const NOTES_DIR = "/home/notes";

export function NotesApp() {
  const nodes = useVfsStore((s) => s.nodes);
  const resolvePath = useVfsStore((s) => s.resolvePath);
  const childrenOf = useVfsStore((s) => s.childrenOf);
  const createNode = useVfsStore((s) => s.createNode);
  const writeFile = useVfsStore((s) => s.writeFile);
  const remove = useVfsStore((s) => s.remove);

  // A pending AI intent (e.g. "create a shopping list") is delivered here.
  const pendingNotesIntent = useIntentStore((s) => s.pending.notes);
  const consumeIntent = useIntentStore((s) => s.consumeIntent);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ensure the notes directory exists.
  const notesDir = resolvePath(NOTES_DIR);

  const notes = useMemo(
    () => (notesDir ? childrenOf(notesDir.id).filter((n) => n.type === "file") : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodes, notesDir?.id],
  );

  // Honour a pending AI intent: create the requested note and select it. This
  // is how "create a shopping list" results in a real note — without Notes
  // knowing anything about the AI layer.
  useEffect(() => {
    if (!pendingNotesIntent || !notesDir) return;
    const intent = consumeIntent("notes");
    if (!intent || intent.action !== "create") return;

    // Ensure a unique filename derived from the title.
    const baseName = `${intent.title}.md`;
    const existing = new Set(childrenOf(notesDir.id).map((n) => n.name));
    let name = baseName;
    let i = 2;
    while (existing.has(name)) name = `${intent.title} ${i++}.md`;

    const content = `# ${intent.title}\n\n${intent.body}`;
    const result = createNode(notesDir.id, name, "file", content);
    if (result.ok) setActiveId(result.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingNotesIntent, notesDir?.id]);

  // Select the first note on mount / when the active one disappears.
  useEffect(() => {
    if (activeId && notes.some((n) => n.id === activeId)) return;
    if (pendingNotesIntent) return; // let the intent effect pick the new note
    setActiveId(notes[0]?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes.length]);

  // Load the active note's content into the editor when the selection changes.
  const activeNote = notes.find((n) => n.id === activeId) ?? null;
  useEffect(() => {
    setDraft(activeNote?.content ?? "");
    setSaved(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const handleChange = (value: string) => {
    setDraft(value);
    setSaved(false);
    if (!activeId) return;
    // Debounced autosave (NO-4).
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      writeFile(activeId, value);
      setSaved(true);
    }, 500);
  };

  const handleNew = () => {
    if (!notesDir) return;
    let name = "Untitled.md";
    let i = 2;
    const existing = new Set(notes.map((n) => n.name));
    while (existing.has(name)) name = `Untitled ${i++}.md`;
    const result = createNode(notesDir.id, name, "file", "# New note\n\n");
    if (result.ok) setActiveId(result.value);
  };

  const handleDelete = () => {
    if (!activeId) return;
    remove(activeId);
    setActiveId(null);
  };

  return (
    <AppShell
      toolbar={
        <>
          <ToolbarButton onClick={handleNew} title="New note">
            ＋ New Note
          </ToolbarButton>
          <ToolbarButton onClick={handleDelete} title="Delete note" disabled={!activeId}>
            🗑️ Delete
          </ToolbarButton>
          <span className="ml-auto pr-1 text-xs text-text-muted">
            {activeId ? (saved ? "Saved" : "Saving…") : ""}
          </span>
        </>
      }
      sidebar={
        <ul className="py-1">
          {notes.length === 0 && (
            <li className="px-3 py-2 text-xs text-text-muted">No notes yet.</li>
          )}
          {notes.map((note) => (
            <li key={note.id}>
              <button
                type="button"
                onClick={() => setActiveId(note.id)}
                className={`w-full truncate px-3 py-2 text-left text-sm transition ${
                  activeId === note.id
                    ? "bg-accent/20 text-text"
                    : "text-text-muted hover:bg-surface-elevated hover:text-text"
                }`}
              >
                {note.name.replace(/\.md$/, "")}
              </button>
            </li>
          ))}
        </ul>
      }
    >
      {activeId ? (
        <textarea
          value={draft}
          onChange={(e) => handleChange(e.target.value)}
          spellCheck={false}
          placeholder="Start writing… (Markdown supported)"
          className="nexus-scroll h-full w-full resize-none bg-bg p-4 font-mono text-sm leading-relaxed text-text placeholder:text-text-muted focus:outline-none"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-text-muted">
          Create a note to get started.
        </div>
      )}
    </AppShell>
  );
}
