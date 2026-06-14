"use client";

/**
 * App component registry (Architecture.md §6, ProjectStructure.md §3.7).
 *
 * Maps an `appId` to the React component that renders inside its window. Every
 * app is **lazy-loaded** via React.lazy so its code is code-split into its own
 * chunk and only fetched when first launched — essential for keeping the cold
 * boot fast with 25+ apps (including the heavy Monaco editor). The window host
 * wraps these in <Suspense> (see WindowContent).
 *
 * Adding an app = one entry here + a manifest in app-registry. No window-manager
 * changes — the "<1 week to add an app" guarantee made physical.
 */

import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { WindowInstance } from "@/types";

/** Props every app component receives from the window host. */
export interface AppProps {
  win: WindowInstance;
}

type AppComponent = LazyExoticComponent<ComponentType<AppProps>>;

/** Helper: lazy-load a module that exports the app under a named export. */
function app(loader: () => Promise<Record<string, ComponentType<AppProps>>>, name: string): AppComponent {
  return lazy(async () => {
    const mod = await loader();
    return { default: mod[name] };
  });
}

export const APP_COMPONENTS: Record<string, AppComponent> = {
  // Core (Phases 1–4)
  files: app(() => import("./files/FilesApp"), "FilesApp"),
  notes: app(() => import("./notes/NotesApp"), "NotesApp"),
  calculator: app(() => import("./calculator/CalculatorApp"), "CalculatorApp"),
  terminal: app(() => import("./terminal/TerminalApp"), "TerminalApp"),
  settings: app(() => import("./settings/SettingsApp"), "SettingsApp"),
  marketplace: app(() => import("./marketplace/MarketplaceApp"), "MarketplaceApp"),

  // Productivity
  whiteboard: app(() => import("./whiteboard/WhiteboardApp"), "WhiteboardApp"),
  kanban: app(() => import("./kanban/KanbanApp"), "KanbanApp"),
  calendar: app(() => import("./calendar/CalendarApp"), "CalendarApp"),
  writer: app(() => import("./writer/WriterApp"), "WriterApp"),

  // Developer tools
  code: app(() => import("./code/CodeEditorApp"), "CodeEditorApp"),
  apitester: app(() => import("./apitester/ApiTesterApp"), "ApiTesterApp"),
  json: app(() => import("./json/JsonVisualizerApp"), "JsonVisualizerApp"),
  database: app(() => import("./database/DatabaseApp"), "DatabaseApp"),

  // Media
  music: app(() => import("./music/MusicApp"), "MusicApp"),
  video: app(() => import("./video/VideoApp"), "VideoApp"),
  imageeditor: app(() => import("./imageeditor/ImageEditorApp"), "ImageEditorApp"),
  gallery: app(() => import("./gallery/GalleryApp"), "GalleryApp"),

  // AI apps
  chat: app(() => import("./chat/ChatApp"), "ChatApp"),
  promptbuilder: app(() => import("./promptbuilder/PromptBuilderApp"), "PromptBuilderApp"),
  workflow: app(() => import("./workflow/WorkflowApp"), "WorkflowApp"),
  research: app(() => import("./research/ResearchApp"), "ResearchApp"),

  // Fun
  arcade: app(() => import("./arcade/ArcadeApp"), "ArcadeApp"),
  snake: app(() => import("./snake/SnakeApp"), "SnakeApp"),
  chess: app(() => import("./chess/ChessApp"), "ChessApp"),
  pet: app(() => import("./pet/PetApp"), "PetApp"),
};

/** Resolve the component for an app id, or null if none is registered. */
export function getAppComponent(appId: string): AppComponent | null {
  return APP_COMPONENTS[appId] ?? null;
}
