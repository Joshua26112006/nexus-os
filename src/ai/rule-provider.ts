/**
 * Rule-based intent provider (Architecture.md §7.3 — the default provider).
 *
 * Deterministic NL → intent classification using pattern rules plus the Command
 * Registry's fuzzy search as a fallback. No network/API key required, so the AI
 * Command Center works fully offline. It implements the same `AiProvider`
 * contract an LLM provider would, so swapping in a hosted model later is a
 * drop-in change (extensible plugin architecture requirement).
 */

import type { AiProvider, AiContext, Intent, Suggestion } from "./types";
import { commandRegistry } from "@/services/commands/command-registry";
import { APP_REGISTRY } from "@/core/app-registry";
import { WALLPAPERS } from "@/core/constants";

/** A pattern rule: a regex and a function turning its match into an Intent. */
interface Rule {
  pattern: RegExp;
  build: (m: RegExpMatchArray) => Intent | null;
}

/** Map a spoken app name/alias to a registered app id. */
function resolveAppId(raw: string): string | null {
  const name = raw.trim().toLowerCase();
  const aliases: Record<string, string> = {
    "file explorer": "files",
    "file manager": "files",
    explorer: "files",
    files: "files",
    notes: "notes",
    note: "notes",
    calculator: "calculator",
    calc: "calculator",
    terminal: "terminal",
    console: "terminal",
    shell: "terminal",
    settings: "settings",
    preferences: "settings",
    browser: "browser",
    web: "browser",
    "ai center": "ai",
    ai: "ai",
  };
  if (aliases[name]) return aliases[name];
  const app = APP_REGISTRY.find(
    (a) => a.id === name || a.name.toLowerCase() === name,
  );
  return app?.id ?? null;
}

const rules: Rule[] = [
  // "calculate 54 * 12", "compute 2+2", "what is 9 * 9"
  {
    pattern: /^(?:calculate|compute|calc|eval(?:uate)?|what\s+is|how\s+much\s+is)\s+(.+)$/i,
    build: (m) => ({
      commandId: "calculator.evaluate",
      args: { expression: m[1].replace(/[?=]+$/, "").trim() },
      confidence: 0.95,
    }),
  },
  // A bare arithmetic expression like "54 * 12"
  {
    pattern: /^[\d\s().+\-*/^%]+$/,
    build: (m) =>
      /[+\-*/^%]/.test(m[0])
        ? {
            commandId: "calculator.evaluate",
            args: { expression: m[0].trim() },
            confidence: 0.8,
          }
        : null,
  },
  // ★ AI Workspace Builder — the signature feature.
  // Open the builder overlay: "workspaces", "open workspace builder".
  {
    pattern: /^(?:open\s+|show\s+|launch\s+)?(?:the\s+)?workspace(?:s)?(?:\s+builder|\s+picker)?$/i,
    build: () => ({ commandId: "workspace.open", args: {}, confidence: 0.95 }),
  },
  // Create a workspace: "create a frontend developer workspace",
  // "student workspace", "set up my trading environment".
  {
    pattern: /^(?:(?:create|build|set\s*up|setup|make|launch|start|open|give\s+me|i\s+want(?:\s+a)?|i\s+need(?:\s+a)?|need)\s+)?(?:a\s+|an\s+|my\s+)?(.+?)\s+(?:work\s*space|setup|environment|workflow|workspace)\b/i,
    build: (m) => {
      const descriptor = m[1].trim();
      return descriptor
        ? { commandId: "workspace.create", args: { descriptor }, confidence: 0.93 }
        : null;
    },
  },
  // Weather: "make it rain", "set weather to snow", "let it snow", "storm"
  {
    pattern: /^(?:make\s+it\s+|let\s+it\s+|set\s+(?:the\s+)?weather\s+(?:to\s+)?|weather\s+|i\s+want\s+)?(rain|raining|snow|snowing|storm|stormy|thunder(?:storm)?|fog|foggy|cloud(?:s|y)?|clear|sunny|sun)\.?$/i,
    build: (m) => {
      const raw = m[1].toLowerCase();
      const map: Record<string, string> = {
        rain: "rain", raining: "rain",
        snow: "snow", snowing: "snow",
        storm: "storm", stormy: "storm", thunder: "storm", thunderstorm: "storm",
        fog: "fog", foggy: "fog",
        cloud: "clouds", clouds: "clouds", cloudy: "clouds",
        clear: "clear", sunny: "clear", sun: "clear",
      };
      const condition = map[raw];
      return condition
        ? { commandId: "env.weather", args: { condition }, confidence: 0.9 }
        : null;
    },
  },
  // Time of day: "set time to night", "make it night", "sunset"
  {
    pattern: /^(?:set\s+(?:the\s+)?time\s+(?:of\s+day\s+)?(?:to\s+)?|make\s+it\s+|it'?s\s+)?(dawn|sunrise|morning|day|noon|afternoon|dusk|sunset|evening|night|midnight)\.?$/i,
    build: (m) => ({
      commandId: "env.timeOfDay",
      args: { time: m[1].toLowerCase() },
      confidence: 0.85,
    }),
  },
  // Widgets: "show clock widget", "hide stock widget", "toggle calendar"
  {
    pattern: /^(?:show|hide|toggle|add|remove)\s+(?:the\s+)?(clock|weather|calendar|system|stock|stocks|news|monitor)\s*(?:widget)?$/i,
    build: (m) => {
      let w = m[1].toLowerCase();
      if (w === "stocks") w = "stock";
      if (w === "monitor") w = "system";
      return { commandId: "widget.toggle", args: { widget: w }, confidence: 0.88 };
    },
  },
  // "developer mode", "dev mode", "toggle debug"
  {
    pattern: /^(?:toggle\s+|enable\s+|show\s+)?(?:developer|dev|debug)\s*mode$/i,
    build: () => ({ commandId: "system.devmode", args: {}, confidence: 0.9 }),
  },
  // "command palette", "global search", "shortcuts"
  {
    pattern: /^(?:open\s+)?(?:command\s+palette|global\s+search)$/i,
    build: () => ({ commandId: "shell.commandPalette", args: {}, confidence: 0.9 }),
  },
  {
    pattern: /^(?:show\s+|open\s+)?(?:keyboard\s+)?shortcuts$/i,
    build: () => ({ commandId: "shell.shortcuts", args: {}, confidence: 0.9 }),
  },
  // "create a shopping list", "make a todo list", "new note about X"
  {
    pattern: /^(?:create|make|new|add|start)\s+(?:a\s+|an\s+)?(.+?)(?:\s+(?:note|list))?$/i,
    build: (m) => {
      const subject = m[1].trim();
      // Detect note/list intent by keyword in the original phrasing.
      return {
        commandId: "notes.create",
        args: {
          title: titleCase(subject),
          body: subject.toLowerCase().includes("list") ? "- \n- \n- \n" : "",
        },
        confidence: 0.7,
      };
    },
  },
  // "set theme to dark", "switch to light mode", "dark mode"
  {
    pattern: /^(?:set\s+|switch\s+to\s+|change\s+|use\s+)?(light|dark|system)(?:\s+(?:theme|mode))?$/i,
    build: (m) => ({
      commandId: "settings.theme",
      args: { mode: m[1].toLowerCase() },
      confidence: 0.9,
    }),
  },
  // "set wallpaper to nebula", "change background to aurora"
  {
    pattern: /^(?:set|change|use)\s+(?:the\s+)?(?:wallpaper|background)\s+(?:to\s+)?(.+)$/i,
    build: (m) => ({
      commandId: "settings.wallpaper",
      args: { name: m[1].trim() },
      confidence: 0.9,
    }),
  },
  // "create folder Projects", "make a folder called Work"
  {
    pattern: /^(?:create|make|new)\s+(?:a\s+)?folder\s+(?:called\s+|named\s+)?(.+)$/i,
    build: (m) => ({
      commandId: "files.createFolder",
      args: { name: m[1].trim() },
      confidence: 0.9,
    }),
  },
  // "close all windows", "close everything"
  {
    pattern: /^close\s+(?:all|everything)(?:\s+windows?)?$/i,
    build: () => ({ commandId: "system.closeAll", args: {}, confidence: 0.95 }),
  },
  // "open notes", "launch calculator", "show settings", "go to files"
  {
    pattern: /^(?:open|launch|start|show|go\s+to|switch\s+to|run)\s+(?:the\s+)?(.+)$/i,
    build: (m) => {
      const appId = resolveAppId(m[1]);
      return appId
        ? { commandId: `app.open.${appId}`, args: {}, confidence: 0.92 }
        : null;
    },
  },
];

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export class RuleProvider implements AiProvider {
  readonly name = "rule-based";

  async classify(input: string, _context: AiContext): Promise<Intent | null> {
    const text = input.trim();
    if (!text) return null;

    // 1) Try pattern rules in order.
    for (const rule of rules) {
      const match = text.match(rule.pattern);
      if (match) {
        const intent = rule.build(match);
        if (intent) return intent;
      }
    }

    // 2) Fall back to fuzzy command search.
    const matches = commandRegistry.search(text);
    if (matches.length > 0) {
      // Parameterless commands are safe to run directly; parameterised ones
      // need args we don't have, so only accept when confident.
      const top = matches[0];
      const hasRequired = top.parameters.some((p) => p.required);
      if (!hasRequired) {
        return { commandId: top.id, args: {}, confidence: 0.5 };
      }
    }

    return null;
  }

  suggest(partial: string, _context: AiContext): Suggestion[] {
    const q = partial.trim().toLowerCase();

    // Curated example prompts that showcase capabilities.
    const examples: Suggestion[] = [
      ...APP_REGISTRY.map((app) => ({
        text: `open ${app.name.toLowerCase()}`,
        label: `Launch ${app.name}`,
        icon: app.icon,
        intent: { commandId: `app.open.${app.id}`, args: {}, confidence: 0.92 },
      })),
      {
        text: "create a shopping list",
        label: "New note in Notes",
        icon: "📝",
        intent: {
          commandId: "notes.create",
          args: { title: "Shopping List", body: "- \n- \n- \n" },
          confidence: 0.7,
        },
      },
      {
        text: "calculate 54 * 12",
        label: "Evaluate in Calculator",
        icon: "🧮",
        intent: {
          commandId: "calculator.evaluate",
          args: { expression: "54 * 12" },
          confidence: 0.9,
        },
      },
      {
        text: "dark mode",
        label: "Switch theme to dark",
        icon: "🌙",
        intent: { commandId: "settings.theme", args: { mode: "dark" }, confidence: 0.9 },
      },
      ...WALLPAPERS.slice(0, 2).map((wp) => ({
        text: `set wallpaper to ${wp.name.toLowerCase()}`,
        label: `Wallpaper: ${wp.name}`,
        icon: "🖼️",
        intent: {
          commandId: "settings.wallpaper",
          args: { name: wp.id },
          confidence: 0.9,
        },
      })),
    ];

    if (!q) return examples.slice(0, 6);
    return examples
      .filter(
        (s) =>
          s.text.toLowerCase().includes(q) ||
          s.label.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }
}
