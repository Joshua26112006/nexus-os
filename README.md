# NEXUS OS

A browser-based, **AI-native** operating system.
**Phase 1 — Foundation · Phase 2 — Core Apps · Phase 3 — AI Command Center.**

A windowed desktop OS in the browser: boot, login, desktop, window manager, a
suite of real applications backed by a shared virtual file system, and an AI
Command Center that drives the whole OS from natural language. See `Roadmap.md`
and `Milestones.md` for what comes next.

## Phase 3 — AI Command Center

Press **Ctrl+Space** anywhere (or click **✦ Ask NEXUS**) to open a Spotlight-like
palette. Type natural language; NEXUS classifies the intent and runs it:

| You type | What happens |
|----------|--------------|
| `open notes` / `show settings` / `open file explorer` | Launches the app |
| `create a shopping list` | Opens Notes and creates the note |
| `calculate 54 * 12` | Opens Calculator showing **648** |
| `99 * 9` | Bare arithmetic → Calculator (**891**) |
| `dark mode` / `light mode` | Switches theme live |
| `set wallpaper to nebula` | Changes the wallpaper |
| `close all windows` | Closes every window |

**Architecture** (`Architecture.md` §4.5, §7): every action is a **Command** in a
single registry (`src/services/commands/`). The UI, dock, and AI all run the
*same* commands — so adding a command extends the AI for free. The AI layer
(`src/ai/`) is a pluggable `AiProvider`: a deterministic rule-based classifier
ships now (no API key, fully offline); an LLM-backed provider is a drop-in
replacement. Apps stay decoupled from the AI via a one-shot intent store
(`src/store/intent-store.ts`).

## Phase 2 apps

| App | Capabilities |
|-----|--------------|
| **Files** | Folder navigation, create folder/file, rename, delete (`src/apps/files/`) |
| **Notes** | Multiple notes, autosave, Markdown editing — stored in the VFS (`src/apps/notes/`) |
| **Calculator** | Basic + scientific, precedence-correct expression engine (`src/apps/calculator/`) |
| **Terminal** | Simulated shell over the VFS: `ls cd cat mkdir touch rm echo pwd open clear help` (`src/apps/terminal/`) |
| **Settings** | Theme, accent, wallpaper, reduced-motion, file-system reset (`src/apps/settings/`) |

All file-backed apps share one **Virtual File System** (`src/store/vfs-store.ts`),
so a folder made in Terminal appears in Files, and a note saved in Notes is
`cat`-able in Terminal. Apps dispatch through `src/apps/registry.tsx` —
adding an app is one registry entry, no window-manager changes.

## Stack

- **Next.js 15** (App Router) + **React 19**
- **TypeScript** (strict)
- **Tailwind CSS** (token-driven theming)
- **Framer Motion** (shell animations)
- **Zustand** (state stores)

## What's implemented

| Foundation piece | Where |
|------------------|-------|
| Boot screen | `src/components/boot/BootScreen.tsx` |
| Login / lock screen | `src/components/login/LoginScreen.tsx` |
| Desktop environment | `src/components/desktop/Desktop.tsx` |
| Wallpaper system | `src/components/desktop/Wallpaper.tsx` + `TopBar` switcher |
| Dock | `src/components/desktop/Dock.tsx` |
| Window manager | `src/components/window/WindowManager.tsx` |
| Draggable / resizable windows | `src/components/window/Window.tsx`, `ResizeHandles.tsx` |
| Minimize / maximize / close | `src/components/window/Window.tsx` |
| State management | `src/store/*` (system, settings, window) |
| Event bus | `src/core/event-bus.ts` |

## Architecture mapping

The code follows `Architecture.md`'s seams, adapted for a single Next.js app:

- **Event bus** (`core/event-bus.ts`) — the only cross-component channel.
- **State stores** (`store/`) — each owns one slice (system/session, settings,
  windows), matching the State Store + Window Manager + Settings services.
- **App registry + launcher** (`core/`) — the manifest-driven seam apps will
  plug into; the dock and (future) command registry launch through it.
- **Design tokens** (`globals.css`) — runtime theming via CSS variables.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint     # eslint
npm run typecheck
```

## Try it

1. Watch the boot sequence, then **Sign in**.
2. Click dock icons to open windows.
3. **Drag** title bars, **resize** from edges/corners, **double-click** a title
   bar to maximize.
4. Use the traffic-light buttons to minimize / maximize / close.
5. Switch wallpapers and toggle light/dark from the top bar.
6. Click your name (top-right) to log out.
