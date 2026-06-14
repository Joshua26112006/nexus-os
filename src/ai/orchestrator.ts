/**
 * AI Orchestrator (Architecture.md §7.1).
 *
 * Owns the classify → resolve → execute loop. Given natural-language input it
 * asks the active provider for an intent, runs the corresponding command via
 * the Command Registry, and returns a turn record. Stateless beyond the
 * provider reference; conversation history lives in the AI store.
 */

import type { AiProvider, AiContext, AiTurn, Suggestion } from "./types";
import { RuleProvider } from "./rule-provider";
import { commandRegistry } from "@/services/commands/command-registry";
import { createId } from "@/core/utils";

class Orchestrator {
  /** The active provider. Swappable for an LLM-backed one in the future. */
  private provider: AiProvider = new RuleProvider();

  setProvider(provider: AiProvider): void {
    this.provider = provider;
  }

  get providerName(): string {
    return this.provider.name;
  }

  suggest(partial: string, context: AiContext): Suggestion[] {
    return this.provider.suggest(partial, context);
  }

  /** Process one natural-language input end-to-end into a turn. */
  async process(input: string, context: AiContext): Promise<AiTurn> {
    const base = {
      id: createId("turn"),
      input,
      timestamp: Date.now(),
    };

    const intent = await this.provider.classify(input, context);

    if (!intent) {
      return {
        ...base,
        intent: null,
        ok: false,
        response:
          "I didn't understand that. Try \"open notes\", \"calculate 54 * 12\", or \"dark mode\".",
      };
    }

    const result = await commandRegistry.run(intent.commandId, intent.args, "ai");
    return {
      ...base,
      intent,
      ok: result.ok,
      response: result.message,
    };
  }

  /** Run a pre-resolved intent directly (e.g. a chosen suggestion). */
  async runIntent(
    input: string,
    intent: NonNullable<AiTurn["intent"]>,
  ): Promise<AiTurn> {
    const result = await commandRegistry.run(intent.commandId, intent.args, "ai");
    return {
      id: createId("turn"),
      input,
      intent,
      ok: result.ok,
      response: result.message,
      timestamp: Date.now(),
    };
  }
}

export const orchestrator = new Orchestrator();
