/**
 * Virtual File System store (Architecture.md §4.1, §4.5).
 *
 * Single owner of the file tree. Persisted to localStorage. Exposes a path-
 * based CRUD API consumed by the Files, Notes, and Terminal apps and emits
 * `fs:changed` on the event bus so open apps stay in sync (FS-10).
 *
 * Storage model: a flat `Record<id, VfsNode>` keyed by id. Structure comes
 * from `parentId`; paths are resolved on demand. This keeps persistence trivial
 * and lookups O(1) while still supporting the tree operations apps need.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { VfsNode, VfsEntry, VfsResult } from "@/types";
import { eventBus } from "@/core/event-bus";
import { createId } from "@/core/utils";

const ROOT_ID = "root";

interface VfsState {
  nodes: Record<string, VfsNode>;

  // --- Path / lookup helpers ---
  resolvePath: (path: string) => VfsNode | null;
  getPath: (id: string) => string;
  childrenOf: (id: string) => VfsEntry[];
  entry: (id: string) => VfsEntry | null;

  // --- Mutations (all emit fs:changed) ---
  createNode: (
    parentId: string,
    name: string,
    type: VfsNode["type"],
    content?: string,
  ) => VfsResult<string>;
  writeFile: (id: string, content: string) => void;
  rename: (id: string, name: string) => VfsResult;
  remove: (id: string) => void;
  move: (id: string, newParentId: string) => VfsResult;

  /** Restore the default directory skeleton (used by Settings → reset). */
  resetFileSystem: () => void;
}

/** Build the initial tree: root + a standard home skeleton (FS-5). */
function seedNodes(): Record<string, VfsNode> {
  const now = Date.now();
  const mk = (
    id: string,
    name: string,
    type: VfsNode["type"],
    parentId: string | null,
    content = "",
  ): VfsNode => ({ id, name, type, parentId, content, createdAt: now, modifiedAt: now });

  const nodes: Record<string, VfsNode> = {};
  const add = (n: VfsNode) => {
    nodes[n.id] = n;
  };

  add(mk(ROOT_ID, "", "directory", null));
  add(mk("home", "home", "directory", ROOT_ID));
  add(mk("documents", "documents", "directory", "home"));
  add(mk("downloads", "downloads", "directory", "home"));
  add(mk("notes", "notes", "directory", "home"));
  add(
    mk(
      "welcome",
      "welcome.txt",
      "file",
      "documents",
      "Welcome to NEXUS OS.\n\nThis file lives in the virtual file system. Open it in\nNotes, list it in the Terminal (cd /home/documents && ls),\nor manage it in the Files app.",
    ),
  );
  return nodes;
}

/** Find a direct child of `parentId` by name. */
function findChild(
  nodes: Record<string, VfsNode>,
  parentId: string,
  name: string,
): VfsNode | undefined {
  return Object.values(nodes).find(
    (n) => n.parentId === parentId && n.name === name,
  );
}

export const useVfsStore = create<VfsState>()(
  persist(
    (set, get) => ({
      nodes: seedNodes(),

      resolvePath: (path) => {
        const nodes = get().nodes;
        const clean = path.trim();
        if (clean === "/" || clean === "") return nodes[ROOT_ID] ?? null;
        const segments = clean.split("/").filter(Boolean);
        let current = nodes[ROOT_ID];
        for (const segment of segments) {
          if (!current) return null;
          const child = findChild(nodes, current.id, segment);
          if (!child) return null;
          current = child;
        }
        return current ?? null;
      },

      getPath: (id) => {
        const nodes = get().nodes;
        const parts: string[] = [];
        let current = nodes[id];
        while (current && current.parentId !== null) {
          parts.unshift(current.name);
          current = nodes[current.parentId];
        }
        return "/" + parts.join("/");
      },

      childrenOf: (id) => {
        const { nodes, getPath } = get();
        return Object.values(nodes)
          .filter((n) => n.parentId === id)
          .map((n) => ({ ...n, path: getPath(n.id) }))
          .sort((a, b) => {
            // Directories first, then alphabetical.
            if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
            return a.name.localeCompare(b.name);
          });
      },

      entry: (id) => {
        const { nodes, getPath } = get();
        const node = nodes[id];
        return node ? { ...node, path: getPath(id) } : null;
      },

      createNode: (parentId, name, type, content = "") => {
        const nodes = get().nodes;
        const parent = nodes[parentId];
        if (!parent || parent.type !== "directory") {
          return { ok: false, error: "Parent is not a directory" };
        }
        const trimmed = name.trim();
        if (!trimmed) return { ok: false, error: "Name cannot be empty" };
        if (trimmed.includes("/")) {
          return { ok: false, error: "Name cannot contain '/'" };
        }
        if (findChild(nodes, parentId, trimmed)) {
          return { ok: false, error: `"${trimmed}" already exists` };
        }
        const id = createId(type === "directory" ? "dir" : "file");
        const now = Date.now();
        set((state) => ({
          nodes: {
            ...state.nodes,
            [id]: {
              id,
              name: trimmed,
              type,
              parentId,
              content,
              createdAt: now,
              modifiedAt: now,
            },
          },
        }));
        eventBus.emit("fs:changed", { path: get().getPath(id), kind: "create" });
        return { ok: true, value: id };
      },

      writeFile: (id, content) => {
        set((state) => {
          const node = state.nodes[id];
          if (!node || node.type !== "file") return state;
          return {
            nodes: {
              ...state.nodes,
              [id]: { ...node, content, modifiedAt: Date.now() },
            },
          };
        });
        eventBus.emit("fs:changed", { path: get().getPath(id), kind: "update" });
      },

      rename: (id, name) => {
        const nodes = get().nodes;
        const node = nodes[id];
        if (!node) return { ok: false, error: "Not found" };
        const trimmed = name.trim();
        if (!trimmed) return { ok: false, error: "Name cannot be empty" };
        if (trimmed.includes("/")) {
          return { ok: false, error: "Name cannot contain '/'" };
        }
        if (
          node.parentId &&
          findChild(nodes, node.parentId, trimmed) &&
          findChild(nodes, node.parentId, trimmed)?.id !== id
        ) {
          return { ok: false, error: `"${trimmed}" already exists` };
        }
        set((state) => ({
          nodes: {
            ...state.nodes,
            [id]: { ...node, name: trimmed, modifiedAt: Date.now() },
          },
        }));
        eventBus.emit("fs:changed", { path: get().getPath(id), kind: "rename" });
        return { ok: true, value: undefined };
      },

      remove: (id) => {
        if (id === ROOT_ID) return;
        const path = get().getPath(id);
        set((state) => {
          const nodes = { ...state.nodes };
          // Collect the node and all descendants, then delete them.
          const toDelete = new Set<string>();
          const collect = (nodeId: string) => {
            toDelete.add(nodeId);
            for (const child of Object.values(nodes)) {
              if (child.parentId === nodeId) collect(child.id);
            }
          };
          collect(id);
          for (const delId of toDelete) delete nodes[delId];
          return { nodes };
        });
        eventBus.emit("fs:changed", { path, kind: "delete" });
      },

      move: (id, newParentId) => {
        const nodes = get().nodes;
        const node = nodes[id];
        const target = nodes[newParentId];
        if (!node || !target) return { ok: false, error: "Not found" };
        if (target.type !== "directory") {
          return { ok: false, error: "Target is not a directory" };
        }
        if (id === newParentId) {
          return { ok: false, error: "Cannot move into itself" };
        }
        if (findChild(nodes, newParentId, node.name)) {
          return { ok: false, error: `"${node.name}" already exists there` };
        }
        set((state) => ({
          nodes: {
            ...state.nodes,
            [id]: { ...node, parentId: newParentId, modifiedAt: Date.now() },
          },
        }));
        eventBus.emit("fs:changed", { path: get().getPath(id), kind: "move" });
        return { ok: true, value: undefined };
      },

      resetFileSystem: () => {
        set({ nodes: seedNodes() });
        eventBus.emit("fs:changed", { path: "/", kind: "reset" });
      },
    }),
    {
      name: "nexus.vfs",
      version: 1,
    },
  ),
);

/** The id of the file-system root, exported for apps that start at `/`. */
export const VFS_ROOT_ID = ROOT_ID;
