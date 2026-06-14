# NEXUS OS — Project Structure

**Document status:** Draft v1.0
**Last updated:** 2026-06-13
**Companion docs:** `PRD.md`, `Architecture.md`, `Roadmap.md`, `Milestones.md`

---

## 1. Philosophy

The directory layout is the architecture made physical. The goals from `Architecture.md` — a small trusted kernel, apps as plugins, a universal command registry, capability-scoped SDK — should be **visible and enforceable** in the folder structure.

We use a **monorepo of packages**. Each package has an explicit public surface and explicit dependencies, which lets us *mechanically* enforce the dependency rule (dependencies point downward only): the kernel may not import an app; an app may not import the VFS directly, only the SDK.

```
kernel  ◄── services  ◄── shell  ◄── apps
                   ▲                    │
                   └──── app-sdk ◄──────┘   (apps only touch services via the SDK)
```

---

## 2. Top-Level Layout

```
nexus-os/
├── PRD.md                      # Product requirements
├── Architecture.md             # Technical architecture
├── ProjectStructure.md         # This document
├── Roadmap.md                  # Development roadmap
├── Milestones.md               # Milestone breakdown
├── README.md                   # Project intro, quickstart, contribution guide
├── LICENSE
│
├── package.json                # Workspace root (monorepo manager config)
├── tsconfig.base.json          # Shared strict TS config; project references
├── vite.config.ts              # Build + code-splitting (lazy app bundles)
├── .eslintrc / .prettierrc     # Lint & format (incl. import-boundary rules)
├── .github/
│   └── workflows/ci.yml        # Lint, typecheck, test, perf-budget gates
│
├── packages/                   # The OS itself, as layered packages
│   ├── kernel/
│   ├── services/
│   ├── app-sdk/
│   ├── shell/
│   ├── ai/
│   ├── ui-kit/
│   └── apps/
│
├── docs/                       # Deeper design notes, ADRs, diagrams
│   ├── adr/                    # Architecture Decision Records
│   ├── diagrams/
│   └── api/                    # Generated SDK/command reference
│
├── tools/                      # Dev tooling, codegen, scripts
│   └── scripts/
│
└── tests/                      # Cross-package e2e (boot, WM, AI command path)
    ├── e2e/
    └── fixtures/
```

---

## 3. Package Breakdown

### 3.1 `packages/kernel/` — Layer 1
The small trusted core. Depends on nothing else in the repo.

```
kernel/
├── src/
│   ├── event-bus/          # Typed pub/sub; the only cross-component channel
│   │   ├── event-bus.ts
│   │   └── events.ts       # Central event-type catalogue (domain:action)
│   ├── process/            # App/process lifecycle + process table
│   │   ├── process-manager.ts
│   │   └── lifecycle.ts
│   ├── registry/           # Service registry (DI container)
│   │   └── service-registry.ts
│   ├── capabilities/       # Capability broker + token model
│   │   └── capability-broker.ts
│   ├── state/              # Central reactive state store
│   │   └── state-store.ts
│   ├── boot/               # Boot sequence orchestration
│   │   └── boot.ts
│   └── index.ts            # Kernel public API
├── tests/
└── package.json
```

### 3.2 `packages/services/` — Layer 2
System services. Each is independently testable and registers with the kernel's service registry. **This is where the Command Registry lives** — the architectural keystone.

```
services/
├── src/
│   ├── vfs/                        # Virtual File System
│   │   ├── vfs.ts                  # Public API (readFile, writeFile, …)
│   │   ├── tree-index.ts           # IndexedDB metadata/tree index
│   │   ├── backends/
│   │   │   ├── opfs-backend.ts     # Primary content store
│   │   │   └── idb-backend.ts      # Fallback content store
│   │   ├── host-bridge.ts          # File System Access import/export
│   │   └── seed.ts                 # Default directory skeleton (/home, …)
│   │
│   ├── window-manager/             # Window geometry, stacking, focus
│   │   ├── window-manager.ts
│   │   ├── snapping.ts
│   │   └── geometry.ts
│   │
│   ├── settings/                   # Reactive, persisted preferences
│   │   ├── settings-service.ts
│   │   └── schema.ts               # Typed schema + defaults
│   │
│   ├── notifications/              # Notification API + history
│   │   └── notification-service.ts
│   │
│   ├── commands/                   # ★ COMMAND REGISTRY (the keystone)
│   │   ├── command-registry.ts     # register / run / list / search
│   │   ├── command.types.ts        # Command, parameter-schema types
│   │   └── system-commands.ts      # Core commands (app.launch, fs.*, …)
│   │
│   └── index.ts
├── tests/
└── package.json
```

### 3.3 `packages/app-sdk/` — the trust boundary
The capability-scoped API every app is allowed to use. Apps depend on this, **never on `services` directly**. This package is the seam that enables future worker/iframe isolation.

```
app-sdk/
├── src/
│   ├── sdk.ts              # createSdk(manifest, capabilityToken) → AppSDK
│   ├── fs.ts               # Capability-gated FS facade
│   ├── windows.ts          # Control own window
│   ├── settings.ts         # Own + read-only system settings
│   ├── notify.ts
│   ├── commands.ts         # Register/run commands (scoped)
│   ├── ai.ts               # Ask the AI layer (capability-gated)
│   ├── storage.ts          # App-private KV store
│   ├── events.ts           # Scoped event bus
│   ├── manifest.types.ts   # App manifest schema (the app↔kernel contract)
│   └── index.ts            # The public SDK surface apps import
├── tests/
└── package.json
```

### 3.4 `packages/shell/` — Layer 3
The desktop chrome. Consumes services; contains no app logic.

```
shell/
├── src/
│   ├── boot-screen/            # Splash / boot animation
│   ├── desktop/                # Wallpaper + icon grid + context menu
│   ├── window-layer/           # Renders windows from WM state
│   │   ├── window-frame.ts     # Title bar, controls, resize handles
│   │   └── window-host.ts      # Mounts an app process into a frame
│   ├── taskbar/                # Dock / running apps
│   ├── launcher/               # App grid / start menu
│   ├── tray/                   # Clock, indicators, AI trigger
│   ├── command-palette/        # Global fuzzy command search
│   ├── notification-center/    # Toasts + history UI
│   └── index.ts
├── tests/
└── package.json
```

### 3.5 `packages/ai/` — Layer 5
The AI orchestration layer. Depends on the command registry (for the tool bridge) and a provider abstraction.

```
ai/
├── src/
│   ├── orchestrator.ts          # The NL → tool-call → execute loop
│   ├── registry-bridge.ts       # ★ Command schema → LLM tool schema
│   ├── context.ts               # Assembles OS-state context per turn
│   ├── confirmation.ts          # Destructive-action gating
│   ├── providers/
│   │   ├── provider.types.ts     # Provider interface
│   │   ├── claude-provider.ts     # Default (latest Claude models)
│   │   └── proxy-provider.ts      # Hosted proxy (post-MVP)
│   ├── memory.ts                # Conversation persistence (→ VFS)
│   └── index.ts
├── tests/
└── package.json
```

### 3.6 `packages/ui-kit/` — shared design system
Tokens + primitive components consumed by the shell and all apps, guaranteeing visual consistency and one-switch theming.

```
ui-kit/
├── src/
│   ├── tokens/             # Color, spacing, radius, type, elevation, motion
│   │   ├── tokens.ts
│   │   └── themes.ts       # light / dark / accent
│   ├── primitives/         # Button, Input, List, Menu, Modal, Icon, …
│   ├── hooks/              # Shared reactive hooks (focus, drag, hotkeys)
│   └── index.ts
└── package.json
```

### 3.7 `packages/apps/` — Layer 4
Each app is its **own sub-package** with a manifest + lazy entry. Adding an app = adding a folder here. No core changes — this is the "<1 week to add an app" guarantee in physical form.

```
apps/
├── browser/
│   ├── src/
│   │   ├── manifest.ts         # App↔kernel contract
│   │   ├── index.ts            # Lazy entry (mounted by the kernel)
│   │   ├── browser-app.ts      # Sandboxed iframe, address bar, tabs
│   │   ├── framing-guard.ts    # Detect embed failure → open-in-new-tab
│   │   └── bookmarks.ts        # Persisted via sdk.fs
│   └── package.json
│
├── notes/
│   ├── src/
│   │   ├── manifest.ts
│   │   ├── index.ts
│   │   ├── editor.ts           # Markdown/rich editor + autosave
│   │   ├── note-list.ts        # Sidebar + search
│   │   └── ai-actions.ts       # Registers notes.summarize, etc.
│   └── package.json
│
├── calculator/
│   ├── src/
│   │   ├── manifest.ts
│   │   ├── index.ts
│   │   ├── keypad.ts
│   │   └── expression-engine.ts  # tokenize → shunting-yard → evaluate
│   └── package.json
│
├── terminal/
│   ├── src/
│   │   ├── manifest.ts
│   │   ├── index.ts
│   │   ├── repl.ts             # Line discipline, history, completion
│   │   ├── builtins.ts         # ls/cd/cat/... → map onto Command Registry
│   │   └── ai-command.ts       # `ai "..."` → AI layer
│   └── package.json
│
├── settings/
│   ├── src/
│   │   ├── manifest.ts
│   │   ├── index.ts
│   │   ├── panels/
│   │   │   ├── appearance.ts   # Theme, accent, wallpaper
│   │   │   ├── system.ts       # Storage, reset, about
│   │   │   └── ai.ts           # Provider, key, behavior
│   │   └── settings-app.ts
│   └── package.json
│
├── ai-command-center/
│   ├── src/
│   │   ├── manifest.ts
│   │   ├── index.ts
│   │   ├── conversation-view.ts  # Streaming chat UI
│   │   ├── command-feed.ts       # Shows actions the AI is taking
│   │   └── global-trigger.ts     # Hotkey + tray invocation
│   └── package.json
│
└── registry.ts                 # Enumerates installed app manifests
```

### 3.8 `tools/` and `tests/`
- `tools/scripts/` — codegen (e.g. generate API docs from command schemas), seed/reset scripts, perf-budget checks.
- `tests/e2e/` — full-stack journeys: cold boot, open/drag/snap a window, create a file in Terminal and see it in Notes, issue an AI command that opens an app and writes a file.

---

## 4. Enforcing the Architecture

The structure is only valuable if the boundaries are enforced, not merely suggested:

| Rule | Enforced by |
|------|-------------|
| Apps may not import `services` directly. | ESLint import-boundary rule + TS project references. |
| Kernel imports nothing app-specific. | Package dependency graph (kernel has no app deps). |
| Only the owning service mutates its state slice. | State store namespacing + code review. |
| Every action is a registered command. | Lint rule discouraging direct service mutation from UI; review. |
| Bundle size & boot time stay within budget. | CI perf gates in `ci.yml`. |
| Public surfaces are explicit. | Each package exports only via `index.ts`. |

---

## 5. How Common Tasks Map to the Structure

| Task | Where you work | Core changes needed? |
|------|----------------|----------------------|
| Add a new app | New folder in `packages/apps/` + register manifest. | **No.** |
| Add a new AI-callable action | Register a command in the owning service/app. | **No** — AI, palette, terminal pick it up automatically. |
| Add a settings option | `services/settings/schema.ts` + a Settings panel. | No. |
| Add a window feature (e.g. snapping zone) | `services/window-manager/`. | Localized. |
| Swap AI provider | Add an implementation under `ai/providers/`. | No — provider interface. |
| Add cloud sync later | New VFS backend under `services/vfs/backends/`. | No — VFS is an interface. |

> The recurring answer "No core changes" is the whole point of the structure: growth happens at the edges, the trusted center stays stable.
