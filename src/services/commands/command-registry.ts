/**
 * Command Registry (Architecture.md §4.5).
 *
 * The single, canonical place every OS action is registered. UI buttons, the
 * command palette, the terminal, and the AI all `run()` commands from here.
 * Registering a command once makes it available to all of them — including the
 * AI, whose intents resolve to these same commands.
 */

import type { Command, CommandContext, CommandResult } from "@/types";

class CommandRegistry {
  private commands = new Map<string, Command>();

  /** Register a command. Re-registering the same id overwrites (idempotent). */
  register(command: Command): void {
    this.commands.set(command.id, command);
  }

  /** Register many commands at once. */
  registerAll(commands: Command[]): void {
    for (const c of commands) this.register(c);
  }

  /** Get a command by id. */
  get(id: string): Command | undefined {
    return this.commands.get(id);
  }

  /** All registered commands. */
  list(): Command[] {
    return Array.from(this.commands.values());
  }

  /**
   * Fuzzy-search commands by title, description, and keywords. Returns matches
   * ranked by a simple relevance score (title hits beat keyword hits).
   */
  search(query: string): Command[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.list();
    const terms = q.split(/\s+/);

    const scored = this.list().map((cmd) => {
      const haystack = [
        cmd.title.toLowerCase(),
        cmd.description.toLowerCase(),
        ...cmd.keywords.map((k) => k.toLowerCase()),
      ];
      let score = 0;
      for (const term of terms) {
        if (cmd.title.toLowerCase().includes(term)) score += 3;
        if (cmd.keywords.some((k) => k.toLowerCase().includes(term))) score += 2;
        if (haystack.some((h) => h.includes(term))) score += 1;
      }
      return { cmd, score };
    });

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.cmd);
  }

  /** Execute a command by id with the given context. */
  async run(
    id: string,
    args: Record<string, unknown> = {},
    source: CommandContext["source"] = "ui",
  ): Promise<CommandResult> {
    const command = this.commands.get(id);
    if (!command) {
      return { ok: false, message: `Unknown command: ${id}` };
    }
    // Validate required parameters before invoking the handler.
    for (const param of command.parameters) {
      if (param.required && args[param.name] === undefined) {
        return {
          ok: false,
          message: `Missing required parameter "${param.name}" for ${command.title}`,
        };
      }
    }
    try {
      return await command.handler({ args, source });
    } catch (err) {
      return {
        ok: false,
        message: `Command "${command.title}" failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      };
    }
  }
}

/** Singleton registry shared across the OS. */
export const commandRegistry = new CommandRegistry();
