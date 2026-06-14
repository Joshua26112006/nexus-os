/**
 * Command Registry types (Architecture.md §4.5 — the architectural keystone).
 *
 * Every action the OS can perform is a registered Command. The UI, the command
 * palette, and the AI Command Center all invoke commands through the same
 * interface — so a new command becomes available to all of them at once. The
 * AI's "tools" are generated from these same definitions.
 */

/** A single declared parameter for a command. */
export interface CommandParameter {
  name: string;
  type: "string" | "number" | "boolean";
  required: boolean;
  description: string;
}

/** Context passed to a command handler at execution time. */
export interface CommandContext {
  /** Free-form arguments resolved by the caller (UI form, AI, palette). */
  args: Record<string, unknown>;
  /** How the command was invoked — useful for telemetry/behaviour tweaks. */
  source: "ui" | "palette" | "ai" | "terminal";
}

/** The outcome of running a command. */
export interface CommandResult {
  ok: boolean;
  /** Human-readable message describing what happened (shown by the AI/palette). */
  message: string;
  /** Optional structured data a caller may use. */
  data?: unknown;
}

/** A registered command. */
export interface Command {
  id: string;
  title: string;
  description: string;
  category: "app" | "filesystem" | "settings" | "system";
  /** Keywords that aid palette search and AI intent matching. */
  keywords: string[];
  parameters: CommandParameter[];
  /** Destructive commands can be flagged for confirmation (AI-4). */
  destructive: boolean;
  handler: (ctx: CommandContext) => CommandResult | Promise<CommandResult>;
}
