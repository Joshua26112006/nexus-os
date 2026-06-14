/**
 * AI routing layer types (Architecture.md §7).
 *
 * The AI layer translates natural language into Command Registry calls. An
 * "intent" is a resolved (commandId + args) pair plus a confidence score. The
 * Provider interface abstracts *how* intents are produced — a rule-based
 * classifier ships now; an LLM-backed provider can drop in later without
 * changing the orchestrator or UI.
 */

/** A classified intent: which command to run and with what arguments. */
export interface Intent {
  commandId: string;
  args: Record<string, unknown>;
  /** 0–1 confidence the classifier assigns to this match. */
  confidence: number;
}

/** A turn in the AI conversation history. */
export interface AiTurn {
  id: string;
  /** The raw natural-language input. */
  input: string;
  /** The resolved intent, if any. */
  intent: Intent | null;
  /** Result message after execution. */
  response: string;
  ok: boolean;
  timestamp: number;
}

/** Context the provider may use to disambiguate (running apps, etc.). */
export interface AiContext {
  runningApps: string[];
  focusedAppId: string | null;
}

/**
 * Pluggable intent provider. The rule-based provider is synchronous, but the
 * signature is async so an LLM-backed provider fits the same contract.
 *
 * `suggest` powers autocomplete: given a partial query, return ranked example
 * phrasings the user can complete.
 */
export interface AiProvider {
  readonly name: string;
  classify(input: string, context: AiContext): Promise<Intent | null>;
  suggest(partial: string, context: AiContext): Suggestion[];
}

/** An autocomplete/suggestion entry shown in the palette. */
export interface Suggestion {
  /** The text inserted/run when chosen. */
  text: string;
  /** Short label describing what it will do. */
  label: string;
  /** Icon glyph. */
  icon: string;
  /** Pre-resolved intent (lets us skip re-classification on selection). */
  intent: Intent;
}
