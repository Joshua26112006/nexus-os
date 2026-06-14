/**
 * Terminal shell command interpreter (Architecture.md §6.3, TE-2).
 *
 * Pure command logic operating on the shared VFS store, kept separate from the
 * React component so it's easy to test and extend. Each command returns output
 * lines and the (possibly changed) working directory.
 *
 * Built-ins: pwd, ls, cd, cat, mkdir, touch, rm, echo, clear, open, help.
 */

import { useVfsStore } from "@/store/vfs-store";
import { launchApp } from "@/core/launcher";
import { getApp } from "@/core/app-registry";

export interface ShellResult {
  /** Output lines to print (may be empty). */
  output: string[];
  /** New working directory node id, if `cd` changed it. */
  newCwdId?: string;
  /** Signal to clear the screen (for `clear`). */
  clear?: boolean;
}

/** Resolve a path argument relative to the current directory. */
function resolveArg(cwdId: string, arg: string): string | null {
  const vfs = useVfsStore.getState();
  if (!arg || arg === ".") return cwdId;

  if (arg === "/") return vfs.resolvePath("/")?.id ?? null;

  if (arg === "..") {
    const node = vfs.nodes[cwdId];
    return node?.parentId ?? cwdId;
  }

  // Absolute path.
  if (arg.startsWith("/")) {
    return vfs.resolvePath(arg)?.id ?? null;
  }

  // Relative path: walk segments from cwd.
  const segments = arg.split("/").filter(Boolean);
  let currentId = cwdId;
  for (const seg of segments) {
    if (seg === "..") {
      currentId = vfs.nodes[currentId]?.parentId ?? currentId;
      continue;
    }
    if (seg === ".") continue;
    const child = vfs
      .childrenOf(currentId)
      .find((c) => c.name === seg);
    if (!child) return null;
    currentId = child.id;
  }
  return currentId;
}

export function runCommand(input: string, cwdId: string): ShellResult {
  const vfs = useVfsStore.getState();
  const trimmed = input.trim();
  if (!trimmed) return { output: [] };

  const [cmd, ...args] = trimmed.split(/\s+/);

  switch (cmd) {
    case "help":
      return {
        output: [
          "Available commands:",
          "  pwd                 print working directory",
          "  ls [path]           list directory contents",
          "  cd <path>           change directory",
          "  cat <file>          print file contents",
          "  mkdir <name>        create a directory",
          "  touch <name>        create an empty file",
          "  rm <name>           remove a file or directory",
          "  echo <text>         print text",
          "  open <app>          launch an app",
          "  clear               clear the screen",
          "  help                show this help",
        ],
      };

    case "pwd":
      return { output: [vfs.getPath(cwdId) || "/"] };

    case "ls": {
      const targetId = resolveArg(cwdId, args[0] ?? ".");
      if (targetId === null) {
        return { output: [`ls: ${args[0]}: no such file or directory`] };
      }
      const node = vfs.nodes[targetId];
      if (node?.type === "file") return { output: [node.name] };
      const children = vfs.childrenOf(targetId);
      if (children.length === 0) return { output: [] };
      return {
        output: [
          children
            .map((c) => (c.type === "directory" ? `${c.name}/` : c.name))
            .join("   "),
        ],
      };
    }

    case "cd": {
      const targetId = resolveArg(cwdId, args[0] ?? "/");
      if (targetId === null) {
        return { output: [`cd: ${args[0]}: no such file or directory`] };
      }
      if (vfs.nodes[targetId]?.type !== "directory") {
        return { output: [`cd: ${args[0]}: not a directory`] };
      }
      return { output: [], newCwdId: targetId };
    }

    case "cat": {
      if (!args[0]) return { output: ["cat: missing file operand"] };
      const targetId = resolveArg(cwdId, args[0]);
      if (targetId === null) {
        return { output: [`cat: ${args[0]}: no such file or directory`] };
      }
      const node = vfs.nodes[targetId];
      if (node?.type !== "file") {
        return { output: [`cat: ${args[0]}: is a directory`] };
      }
      return { output: node.content.split("\n") };
    }

    case "mkdir": {
      if (!args[0]) return { output: ["mkdir: missing operand"] };
      const result = vfs.createNode(cwdId, args[0], "directory");
      return { output: result.ok ? [] : [`mkdir: ${result.error}`] };
    }

    case "touch": {
      if (!args[0]) return { output: ["touch: missing operand"] };
      const result = vfs.createNode(cwdId, args[0], "file");
      return { output: result.ok ? [] : [`touch: ${result.error}`] };
    }

    case "rm": {
      if (!args[0]) return { output: ["rm: missing operand"] };
      const targetId = resolveArg(cwdId, args[0]);
      if (targetId === null) {
        return { output: [`rm: ${args[0]}: no such file or directory`] };
      }
      if (targetId === cwdId) {
        return { output: ["rm: cannot remove the current directory"] };
      }
      vfs.remove(targetId);
      return { output: [] };
    }

    case "echo":
      return { output: [args.join(" ")] };

    case "open": {
      if (!args[0]) return { output: ["open: missing app name"] };
      const app = getApp(args[0]);
      if (!app) return { output: [`open: ${args[0]}: no such app`] };
      launchApp(app.id);
      return { output: [`Opening ${app.name}…`] };
    }

    case "clear":
      return { output: [], clear: true };

    default:
      return { output: [`${cmd}: command not found (try 'help')`] };
  }
}
