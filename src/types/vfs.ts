/**
 * Virtual File System types (Architecture.md §4.1).
 *
 * Phase 2 implements a localStorage-backed VFS. The OPFS + IndexedDB backends
 * from the architecture are a later-phase concern; the public API shape here
 * matches the doc so the storage layer can be swapped without touching apps.
 *
 * The tree is stored as a flat map of nodes keyed by id (cheap to persist and
 * to look up), with parent/child relationships expressed via `parentId`.
 */

export type VfsNodeType = "file" | "directory";

export interface VfsNode {
  id: string;
  name: string;
  type: VfsNodeType;
  /** Parent node id; the root node's parent is `null`. */
  parentId: string | null;
  /** File contents (empty string for directories). */
  content: string;
  createdAt: number;
  modifiedAt: number;
}

/** A node enriched with its resolved absolute path. */
export interface VfsEntry extends VfsNode {
  path: string;
}

/** Result type for VFS operations that can fail with a user-facing reason. */
export type VfsResult<T = void> =
  | { ok: true; value: T }
  | { ok: false; error: string };
