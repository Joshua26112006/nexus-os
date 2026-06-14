/**
 * Global search — a unified index across the OS for the Command Palette.
 *
 * Aggregates four sources into a single ranked result list:
 *  - commands (the Command Registry),
 *  - apps (the App Registry),
 *  - files (the VFS, by name),
 *  - settings/quick actions.
 *
 * Each result knows how to `run()` itself, so the palette stays dumb.
 */

import { commandRegistry } from "@/services/commands/command-registry";
import { APP_REGISTRY } from "@/core/app-registry";
import { launchApp } from "@/core/launcher";
import { useVfsStore } from "@/store/vfs-store";

export type SearchKind = "command" | "app" | "file" | "setting";

export interface SearchResult {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle: string;
  icon: string;
  run: () => void | Promise<void>;
}

const KIND_RANK: Record<SearchKind, number> = {
  app: 4,
  command: 3,
  setting: 2,
  file: 1,
};

/** Build the full, unfiltered result set. */
function buildIndex(): SearchResult[] {
  const results: SearchResult[] = [];

  // Apps.
  for (const app of APP_REGISTRY) {
    results.push({
      id: `app:${app.id}`,
      kind: "app",
      title: app.name,
      subtitle: "Application",
      icon: app.icon,
      run: () => {
        if (app.id === "ai") return;
        launchApp(app.id);
      },
    });
  }

  // Commands.
  for (const cmd of commandRegistry.list()) {
    // Skip the auto-generated app-open commands (apps already indexed above).
    if (cmd.id.startsWith("app.open.")) continue;
    results.push({
      id: `cmd:${cmd.id}`,
      kind: "command",
      title: cmd.title,
      subtitle: cmd.description,
      icon: cmd.destructive ? "⚠️" : "⚡",
      run: () => {
        // Commands needing required params can't run blind from search.
        if (cmd.parameters.some((p) => p.required)) {
          launchApp("settings");
          return;
        }
        commandRegistry.run(cmd.id, {}, "palette");
      },
    });
  }

  // Files (top-level + a couple levels, by name).
  const vfs = useVfsStore.getState();
  for (const node of Object.values(vfs.nodes)) {
    if (node.parentId === null) continue;
    results.push({
      id: `file:${node.id}`,
      kind: "file",
      title: node.name,
      subtitle: vfs.getPath(node.id),
      icon: node.type === "directory" ? "📁" : "📄",
      run: () => {
        launchApp("files");
      },
    });
  }

  return results;
}

/** Fuzzy/substring search across the index, ranked by kind then match. */
export function searchEverything(query: string): SearchResult[] {
  const index = buildIndex();
  const q = query.trim().toLowerCase();
  if (!q) {
    // Empty query → show apps + top commands as suggestions.
    return index
      .filter((r) => r.kind === "app" || r.kind === "command")
      .sort((a, b) => KIND_RANK[b.kind] - KIND_RANK[a.kind])
      .slice(0, 8);
  }

  const scored = index
    .map((r) => {
      const title = r.title.toLowerCase();
      let score = 0;
      if (title === q) score += 10;
      else if (title.startsWith(q)) score += 6;
      else if (title.includes(q)) score += 4;
      else if (r.subtitle.toLowerCase().includes(q)) score += 1;
      score += KIND_RANK[r.kind] * 0.1;
      return { r, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return scored.map((s) => s.r);
}
