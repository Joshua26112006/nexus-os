/**
 * System commands — the built-in command set (Architecture.md §4.5).
 *
 * Each app and capability contributes commands here. Because the AI resolves
 * intents to these same commands, adding a command automatically extends what
 * the user can ask for in natural language.
 */

import type { Command } from "@/types";
import { commandRegistry } from "./command-registry";
import { APP_REGISTRY, getApp } from "@/core/app-registry";
import { launchApp } from "@/core/launcher";
import { useIntentStore } from "@/store/intent-store";
import { useAiStore } from "@/store/ai-store";
import { useSettingsStore } from "@/store/settings-store";
import { useVfsStore } from "@/store/vfs-store";
import {
  useEnvironmentStore,
  WEATHER_CONDITIONS,
  type WeatherCondition,
} from "@/store/environment-store";
import { useWidgetStore, type WidgetType } from "@/store/widget-store";
import { useShellUiStore } from "@/store/shell-ui-store";
import { useAchievementStore } from "@/store/achievement-store";
import {
  WORKSPACES,
  launchWorkspace,
  launchWorkspaceByText,
} from "@/services/workspaces/workspaces";
import { WALLPAPERS } from "@/core/constants";
import { evaluate } from "@/apps/calculator/engine";

/** Build a `app.open.<id>` command for each installed app. */
function appLaunchCommands(): Command[] {
  return APP_REGISTRY.map((app) => ({
    id: `app.open.${app.id}`,
    title: `Open ${app.name}`,
    description: `Launch the ${app.name} application`,
    category: "app" as const,
    keywords: ["open", "launch", "start", app.name.toLowerCase(), app.id],
    parameters: [],
    destructive: false,
    handler: () => {
      // The AI Center is the global palette, not a window.
      if (app.id === "ai") {
        useAiStore.getState().openPalette();
        return { ok: true, message: "Opened AI Command Center" };
      }
      const winId = launchApp(app.id);
      return winId
        ? { ok: true, message: `Opened ${app.name}` }
        : { ok: false, message: `Could not open ${app.name}` };
    },
  }));
}

/** Commands that do more than just open an app. */
const richCommands: Command[] = [
  {
    id: "notes.create",
    title: "Create a note",
    description: "Open Notes and create a new note with a title and contents",
    category: "app",
    keywords: ["note", "notes", "create", "write", "list", "todo", "shopping"],
    parameters: [
      { name: "title", type: "string", required: false, description: "Note title" },
      { name: "body", type: "string", required: false, description: "Note contents" },
    ],
    destructive: false,
    handler: ({ args }) => {
      const title = typeof args.title === "string" && args.title ? args.title : "Untitled";
      const body = typeof args.body === "string" ? args.body : "";
      useIntentStore.getState().setIntent({
        app: "notes",
        action: "create",
        title,
        body,
      });
      launchApp("notes");
      return { ok: true, message: `Created note "${title}" in Notes` };
    },
  },
  {
    id: "calculator.evaluate",
    title: "Calculate an expression",
    description: "Open Calculator and evaluate a math expression",
    category: "app",
    keywords: ["calculate", "calc", "math", "evaluate", "compute", "plus", "times"],
    parameters: [
      {
        name: "expression",
        type: "string",
        required: true,
        description: "The math expression to evaluate, e.g. 54 * 12",
      },
    ],
    destructive: false,
    handler: ({ args }) => {
      const expression = String(args.expression ?? "").trim();
      if (!expression) {
        return { ok: false, message: "No expression to calculate" };
      }
      // Validate before launching so we can report errors up front.
      try {
        const value = evaluate(expression);
        useIntentStore.getState().setIntent({
          app: "calculator",
          action: "evaluate",
          expression,
        });
        launchApp("calculator");
        return {
          ok: true,
          message: `${expression} = ${Number(value.toFixed(10))}`,
          data: value,
        };
      } catch {
        return { ok: false, message: `Couldn't evaluate "${expression}"` };
      }
    },
  },
  {
    id: "settings.theme",
    title: "Change theme",
    description: "Switch the OS theme (light, dark, or system)",
    category: "settings",
    keywords: ["theme", "dark", "light", "mode", "appearance"],
    parameters: [
      { name: "mode", type: "string", required: true, description: "light | dark | system" },
    ],
    destructive: false,
    handler: ({ args }) => {
      const mode = String(args.mode ?? "").toLowerCase();
      if (mode !== "light" && mode !== "dark" && mode !== "system") {
        return { ok: false, message: `Unknown theme "${mode}"` };
      }
      useSettingsStore.getState().setTheme(mode);
      return { ok: true, message: `Theme set to ${mode}` };
    },
  },
  {
    id: "settings.wallpaper",
    title: "Change wallpaper",
    description: "Set the desktop wallpaper by name",
    category: "settings",
    keywords: ["wallpaper", "background", "desktop"],
    parameters: [
      { name: "name", type: "string", required: true, description: "Wallpaper name" },
    ],
    destructive: false,
    handler: ({ args }) => {
      const name = String(args.name ?? "").toLowerCase();
      const wp =
        WALLPAPERS.find((w) => w.id === name) ||
        WALLPAPERS.find((w) => w.name.toLowerCase() === name);
      if (!wp) return { ok: false, message: `No wallpaper named "${name}"` };
      useSettingsStore.getState().setWallpaper(wp.id);
      return { ok: true, message: `Wallpaper set to ${wp.name}` };
    },
  },
  {
    id: "system.closeAll",
    title: "Close all windows",
    description: "Close every open window",
    category: "system",
    keywords: ["close", "all", "windows", "quit", "clear"],
    parameters: [],
    destructive: true,
    handler: async () => {
      const { useWindowStore } = await import("@/store/window-store");
      const store = useWindowStore.getState();
      const ids = store.windows.map((w) => w.id);
      ids.forEach((id) => store.closeWindow(id));
      return { ok: true, message: `Closed ${ids.length} window(s)` };
    },
  },
  {
    id: "files.createFolder",
    title: "Create a folder",
    description: "Create a folder in the home directory",
    category: "filesystem",
    keywords: ["folder", "directory", "mkdir", "create", "new"],
    parameters: [
      { name: "name", type: "string", required: true, description: "Folder name" },
    ],
    destructive: false,
    handler: ({ args }) => {
      const name = String(args.name ?? "").trim();
      if (!name) return { ok: false, message: "No folder name given" };
      const vfs = useVfsStore.getState();
      const home = vfs.resolvePath("/home");
      if (!home) return { ok: false, message: "Home directory missing" };
      const result = vfs.createNode(home.id, name, "directory");
      if (!result.ok) return { ok: false, message: result.error };
      launchApp("files");
      return { ok: true, message: `Created folder "${name}" in /home` };
    },
  },
  {
    id: "env.weather",
    title: "Set the weather",
    description: "Change the desktop weather (clear, rain, snow, storm, fog, clouds)",
    category: "system",
    keywords: ["weather", "rain", "snow", "storm", "sunny", "clear", "fog", "clouds"],
    parameters: [
      { name: "condition", type: "string", required: true, description: "Weather condition" },
    ],
    destructive: false,
    handler: ({ args }) => {
      const c = String(args.condition ?? "").toLowerCase() as WeatherCondition;
      if (!WEATHER_CONDITIONS.includes(c)) {
        return { ok: false, message: `Unknown weather "${args.condition}"` };
      }
      useEnvironmentStore.getState().setWeather(c);
      return { ok: true, message: `Weather set to ${c}` };
    },
  },
  {
    id: "env.timeOfDay",
    title: "Set time of day",
    description: "Set the day/night cycle (dawn, day, dusk, night)",
    category: "system",
    keywords: ["time", "day", "night", "dawn", "dusk", "sunset", "sunrise", "cycle"],
    parameters: [
      { name: "time", type: "string", required: true, description: "dawn | day | dusk | night" },
    ],
    destructive: false,
    handler: ({ args }) => {
      const map: Record<string, number> = {
        dawn: 6 / 24,
        morning: 8 / 24,
        day: 12 / 24,
        noon: 12 / 24,
        afternoon: 15 / 24,
        dusk: 19 / 24,
        sunset: 19 / 24,
        evening: 20 / 24,
        night: 23 / 24,
        midnight: 0,
      };
      const t = String(args.time ?? "").toLowerCase();
      if (!(t in map)) return { ok: false, message: `Unknown time "${args.time}"` };
      useEnvironmentStore.getState().setSunPosition(map[t]);
      return { ok: true, message: `Time set to ${t}` };
    },
  },
  {
    id: "env.liveWallpaper",
    title: "Toggle live wallpaper",
    description: "Turn animated live wallpaper effects on or off",
    category: "settings",
    keywords: ["live", "wallpaper", "animated", "motion", "effects"],
    parameters: [],
    destructive: false,
    handler: () => {
      const env = useEnvironmentStore.getState();
      env.setLiveWallpaper(!env.liveWallpaper);
      return { ok: true, message: `Live wallpaper ${env.liveWallpaper ? "off" : "on"}` };
    },
  },
  {
    id: "widget.toggle",
    title: "Toggle a widget",
    description: "Show or hide a desktop widget (clock, weather, calendar, system, stock, news)",
    category: "system",
    keywords: ["widget", "clock", "weather", "calendar", "stock", "news", "monitor", "show", "hide"],
    parameters: [
      { name: "widget", type: "string", required: true, description: "Widget type" },
    ],
    destructive: false,
    handler: ({ args }) => {
      const valid: WidgetType[] = ["clock", "weather", "calendar", "system", "stock", "news"];
      const w = String(args.widget ?? "").toLowerCase() as WidgetType;
      if (!valid.includes(w)) return { ok: false, message: `Unknown widget "${args.widget}"` };
      useWidgetStore.getState().toggleWidget(w);
      return { ok: true, message: `Toggled ${w} widget` };
    },
  },
  {
    id: "shell.commandPalette",
    title: "Open Command Palette",
    description: "Open the global search command palette",
    category: "system",
    keywords: ["command", "palette", "search", "global", "launcher"],
    parameters: [],
    destructive: false,
    handler: () => {
      useShellUiStore.getState().openCommandPalette();
      return { ok: true, message: "Opened Command Palette" };
    },
  },
  {
    id: "shell.shortcuts",
    title: "Show keyboard shortcuts",
    description: "Open the keyboard shortcut overlay",
    category: "system",
    keywords: ["shortcuts", "keyboard", "keys", "help", "hotkeys"],
    parameters: [],
    destructive: false,
    handler: () => {
      useShellUiStore.getState().openShortcuts();
      return { ok: true, message: "Opened keyboard shortcuts" };
    },
  },
  {
    id: "system.devmode",
    title: "Toggle Developer Mode",
    description: "Toggle the hidden developer diagnostics HUD",
    category: "system",
    keywords: ["developer", "dev", "mode", "debug", "fps", "diagnostics"],
    parameters: [],
    destructive: false,
    handler: () => {
      const ui = useShellUiStore.getState();
      ui.toggleDevMode();
      if (!ui.devMode) {
        // Was just turned on.
        useAchievementStore.getState().unlock("developer");
      }
      return { ok: true, message: `Developer Mode ${ui.devMode ? "off" : "on"}` };
    },
  },
];

/** The signature AI Workspace Builder commands. */
function workspaceCommands(): Command[] {
  const commands: Command[] = [
    // Generic: "create a <descriptor> workspace".
    {
      id: "workspace.create",
      title: "Create a workspace",
      description: "Open and arrange a set of apps for a role (e.g. frontend developer, student, stock trader)",
      category: "system",
      keywords: ["workspace", "create", "setup", "environment", "arrange", "layout"],
      parameters: [
        { name: "descriptor", type: "string", required: true, description: "Workspace description, e.g. 'frontend developer'" },
      ],
      destructive: false,
      handler: ({ args }) => launchWorkspaceByText(String(args.descriptor ?? "")),
    },
    // Open the Workspace Builder overlay.
    {
      id: "workspace.open",
      title: "Open Workspace Builder",
      description: "Browse and launch smart workspace layouts",
      category: "system",
      keywords: ["workspace", "builder", "workspaces", "layouts"],
      parameters: [],
      destructive: false,
      handler: () => {
        useShellUiStore.getState().openWorkspaceBuilder();
        return { ok: true, message: "Opened Workspace Builder" };
      },
    },
  ];

  // One parameterless command per workspace (so Search & the palette list them).
  for (const ws of WORKSPACES) {
    commands.push({
      id: `workspace.launch.${ws.id}`,
      title: `${ws.name} Workspace`,
      description: ws.description,
      category: "system",
      keywords: ["workspace", ws.id, ...ws.keywords],
      parameters: [],
      destructive: false,
      handler: () => launchWorkspace(ws),
    });
  }

  return commands;
}

let registered = false;

/** Register all system commands exactly once (idempotent). */
export function registerSystemCommands(): void {
  if (registered) return;
  commandRegistry.registerAll([
    ...appLaunchCommands(),
    ...richCommands,
    ...workspaceCommands(),
  ]);
  registered = true;
}

/** Exposed for callers that want the app-open command id for an app. */
export function openCommandId(appId: string): string | null {
  return getApp(appId) ? `app.open.${appId}` : null;
}
