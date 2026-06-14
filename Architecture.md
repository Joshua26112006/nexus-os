# NEXUS OS — Technical Architecture

**Document status:** Draft v1.0
**Last updated:** 2026-06-13
**Owner:** Architecture
**Companion docs:** `PRD.md`, `ProjectStructure.md`, `Roadmap.md`, `Milestones.md`

---

## 1. Architectural Goals

This architecture is written to satisfy one constraint above all others: **we should be able to grow from a prototype to a platform without a rewrite.** Concretely, that means:

- **A hard trust boundary** between the OS core (the "kernel") and the apps it hosts.
- **Apps as plugins**, not hard-coded screens — declared by manifest, loaded lazily, sandboxed.
- **One canonical way for anything to act on the OS** — the same command registry the AI uses is the one apps and the UI use. The AI gets no special backdoor; it gets a great front door.
- **State that is observable and persistent** — every meaningful piece of state has an owner service, a stable address, and a persistence strategy.
- **Performance budgets baked in**, because an OS that feels slow is not an OS.

### Guiding principle
> The kernel is small and trusted. Everything interesting is an app or a service registered with the kernel. The AI is just an exceptionally capable user of the same public APIs.

---

## 2. Layered Architecture (C4 Level 1–2)

```
┌──────────────────────────────────────────────────────────────────────┐
│                            NEXUS OS (Browser Tab)                      │
│                                                                        │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  LAYER 5 — AI LAYER                                             │   │
│  │  AI Orchestrator · Tool/Command Registry Bridge · Providers    │   │
│  └───────────────▲────────────────────────────────────────────────┘   │
│                  │ calls the SAME command registry as everything else  │
│  ┌───────────────┴────────────────────────────────────────────────┐   │
│  │  LAYER 4 — APPLICATIONS (sandboxed, manifest-declared)         │   │
│  │  Browser · Notes · Calculator · Terminal · Settings · AI CC    │   │
│  └───────────────▲────────────────────────────────────────────────┘   │
│                  │ App SDK (capability-scoped)                         │
│  ┌───────────────┴────────────────────────────────────────────────┐   │
│  │  LAYER 3 — DESKTOP SHELL                                       │   │
│  │  Desktop · Taskbar/Dock · Launcher · Tray · Command Palette    │   │
│  └───────────────▲────────────────────────────────────────────────┘   │
│                  │                                                      │
│  ┌───────────────┴────────────────────────────────────────────────┐   │
│  │  LAYER 2 — SYSTEM SERVICES                                     │   │
│  │  VFS · Window Manager · Settings · Notifications · Command Reg │   │
│  └───────────────▲────────────────────────────────────────────────┘   │
│                  │                                                      │
│  ┌───────────────┴────────────────────────────────────────────────┐   │
│  │  LAYER 1 — KERNEL                                              │   │
│  │  Event Bus · Process/App Lifecycle · Service Registry ·        │   │
│  │  Capability Broker · State Store                               │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│  ── Persistence ──  OPFS │ IndexedDB │ localStorage (settings)         │
│  ── External   ──  AI Provider APIs │ Embedded sites (sandboxed)       │
└──────────────────────────────────────────────────────────────────────┘
```

**Dependency rule:** dependencies point *downward only*. An app may call a service; a service never imports an app. The shell orchestrates but does not contain app logic. This keeps the core stable while the app surface grows.

---

## 3. Layer 1 — The Kernel

The kernel is the only "trusted" code. It is deliberately small. Its job is to be the runtime that everything else plugs into.

### 3.1 Event Bus
A typed publish/subscribe message bus and the **only** sanctioned channel for cross-component communication. No app reaches into another app's internals; they emit and listen to events.

- **Pattern:** `emit(eventType, payload)` / `on(eventType, handler) → unsubscribe`.
- **Namespacing:** `domain:action` (e.g. `window:focus`, `fs:changed`, `app:launch`, `ai:command`).
- **Guarantees:** synchronous delivery within a tick; handlers are isolated (one throwing doesn't break delivery to others).
- **Why central:** it's the seam that makes the system observable, testable, and loosely coupled. Logging/telemetry tap this one place.

### 3.2 Process / App Lifecycle Manager
Treats each running app instance as a "process" with a lifecycle:

```
registered → launching → running → suspended → terminating → terminated
```

- Tracks process table: instance id, app id, window id, status, mount node.
- Enforces single-instance vs. multi-instance per manifest.
- Lazy-loads app bundles on first launch (code-splitting boundary).
- Crash isolation: each app mounts inside an **error boundary**; a crash terminates that process only and notifies the shell.

### 3.3 Service Registry
A dependency-injection container. Services register themselves at boot; consumers resolve by interface, never by concrete import. This makes services swappable (e.g. swap the OPFS VFS backend for an in-memory one in tests) and keeps wiring explicit.

### 3.4 Capability Broker (Permissions)
Mediates access to powerful resources. An app declares required capabilities in its manifest (`fs:read`, `fs:write`, `network`, `ai`, `notifications`, `settings:write`). At launch the broker grants a **capability token**; the App SDK checks tokens before privileged calls. This is the foundation for safely hosting third-party apps later.

### 3.5 State Store
A central, reactive state container holding kernel-level state (process table, focused window, boot status). Services own their own slices. Reactivity lets the shell re-render on change without polling. State is namespaced by owner; only the owning service may mutate its slice.

---

## 4. Layer 2 — System Services

Each service exposes a typed interface, registers with the Service Registry, and communicates outward via the Event Bus.

### 4.1 Virtual File System (VFS)
The most important service — many apps and the AI depend on it.

- **Model:** a tree of nodes. Each node is a *file* (with content + MIME) or a *directory*. Nodes carry metadata: id, name, parent id, type, size, `createdAt`, `modifiedAt`.
- **Public API (illustrative):**
  ```
  readFile(path) · writeFile(path, data) · deleteNode(path)
  createDir(path) · list(path) · move(src, dest) · rename(path, name)
  stat(path) · exists(path) · watch(path, cb)
  ```
- **Storage strategy (layered, with fallback):**
  | Tier | Backend | Use |
  |------|---------|-----|
  | Primary | **OPFS** | File contents — fast, large, real file handles. |
  | Index | **IndexedDB** | The tree/metadata index for quick traversal & search. |
  | Fallback | **IndexedDB (content too)** | When OPFS is unavailable. |
  | Bridge | **File System Access API** | Optional import/export to the host machine. |
- **Events:** emits `fs:changed` (created/updated/deleted/moved) so open apps stay in sync (satisfies FS-10).
- **Concurrency:** writes serialized per-path; metadata index updated transactionally with content writes to avoid divergence.
- **Why this split:** OPFS gives durable, performant blob storage; a separate IndexedDB index gives us cheap listing/search without reading every file. The index is the source of truth for structure; OPFS for bytes.

### 4.2 Window Manager (WM)
Owns the geometry, stacking, and lifecycle of windows (a window is the visual host of an app process).

- **Window model:** id, appId, processId, title, rect `{x,y,w,h}`, state `{minimized, maximized}`, zIndex, focused, constraints `{minW, minH, resizable}`.
- **Responsibilities:** create/destroy windows, drag/resize (pointer-driven, rAF-throttled for 60fps), focus & z-order management, snapping, persistence of geometry.
- **Rendering approach:** windows are absolutely-positioned layers driven by reactive state; drag/resize manipulate state, the renderer reflects it. Heavy DOM reflow avoided by transforming rather than re-laying-out during drags.
- **Persistence:** window geometry snapshotted to settings/session store so layout survives reload (WM-7).

### 4.3 Settings Service
Reactive key-value store for OS and app preferences, persisted to `localStorage` (small, synchronous, fine for config) with a typed schema and defaults. Emits `settings:changed`; theming and shell subscribe to apply changes live (SE-4). Namespaced: `system.*`, `appearance.*`, `ai.*`, `app.<id>.*`.

### 4.4 Notification Service
A pub/sub façade over the Event Bus. Apps call `notify({title, body, level, actions})`; the Notification Center (in the shell) renders toasts and maintains a history. Decouples *producing* a notification from *displaying* it.

### 4.5 Command Registry — the architectural keystone
This is the single most important design decision in NEXUS.

**Every action the OS can perform is registered as a Command.** A command has:

```
{
  id:          "fs.createFile",
  title:       "Create File",
  description:  "Create a new file at a path with optional contents",
  category:    "filesystem",
  parameters:  <schema: name, type, required, description>,
  capability:  "fs:write",
  destructive: false,
  handler:     async (args, ctx) => result
}
```

Commands are invoked by **four** different callers through the *same* interface:

1. **The UI** (a button calls `commands.run("app.launch", {appId})`).
2. **The Command Palette** (lists & fuzzy-searches commands).
3. **The Terminal** (maps shell commands onto registry commands).
4. **The AI Command Center** (the LLM's tool definitions are *generated from the registry*).

> **Why this matters for scalability:** when a new app registers a new command, it becomes *simultaneously* available to the UI, the palette, the terminal, and the AI — for free. The AI never needs bespoke integration per feature. The parameter schemas double as LLM tool schemas. This is what makes "anything you can do, you can ask for" a structural property rather than a per-feature effort.

Destructive commands are flagged so the AI layer and UI can enforce confirmation (AI-4, NFR security).

---

## 5. Layer 3 — Desktop Shell

The shell is the visual chrome that hosts everything. It is a *consumer* of services, holding minimal logic of its own.

- **Desktop:** wallpaper layer + optional icon grid; right-click context menu (commands again).
- **Window layer:** renders all windows from WM state.
- **Taskbar / Dock:** pinned apps + running-window buttons; reads process table + WM state.
- **App Launcher:** grid/list of installed apps from the app registry; launches via `app.launch` command.
- **System Tray:** clock, storage/network indicators, AI trigger, quick settings.
- **Command Palette:** global hotkey opens a fuzzy search over the Command Registry — the keyboard-driven nerve center.

The shell subscribes to the Event Bus and State Store and re-renders reactively. It never imports an app directly; it renders whatever the registries describe.

---

## 6. Layer 4 — Applications & the App SDK

### 6.1 App Manifest
Every app — first- or third-party — ships a manifest. This is the contract with the kernel:

```
{
  id:            "com.nexus.notes",
  name:          "Notes",
  version:       "1.0.0",
  icon:          "<asset ref>",
  entry:         "<lazy module ref>",
  singleton:     false,
  window:        { defaultW, defaultH, minW, minH, resizable, title },
  capabilities:  ["fs:read", "fs:write", "ai"],
  commands:      [ /* commands this app contributes to the registry */ ],
  contributes:   { trayItems?, launcherCategory?, fileAssociations? }
}
```

The kernel reads manifests to populate the launcher, register commands, allocate capabilities, and configure default windows. **Adding an app = adding a manifest + an entry module.** No core changes. (This is the "<1 week to add an app" guarantee from the PRD.)

### 6.2 App SDK
The capability-scoped API surface apps are allowed to touch. It wraps services and enforces the capability broker. An app *cannot* import the VFS directly; it receives `sdk.fs`, which checks its `fs:*` tokens. The SDK provides:

```
sdk.fs           – file system (capability-gated)
sdk.windows      – control own window (title, resize, close)
sdk.settings     – read/write own + read system settings
sdk.notify       – publish notifications
sdk.commands     – register/run commands
sdk.ai           – ask the AI layer (capability-gated)
sdk.events       – scoped event bus (own + subscribed channels)
sdk.storage      – app-private key-value store
```

This is the seam that lets us *eventually* run third-party apps in Web Workers or sandboxed iframes with the SDK marshalled over `postMessage` — without changing app code. **v1 runs apps in-process for speed; the SDK boundary keeps the door open for true isolation later.**

### 6.3 The six v1 apps (architectural notes)

- **Browser:** sandboxed `<iframe>` with a strict `sandbox` attribute; address bar drives `src`; framing-failure detection (load timeout + error) triggers the open-in-new-tab fallback (BR-5). Bookmarks/history persisted via `sdk.fs`.
- **Notes:** Markdown/rich editor; autosave debounced to `sdk.fs`; contributes `notes.summarize` etc. as commands so the AI can act on notes.
- **Calculator:** pure, self-contained; a small expression parser (tokenize → shunting-yard → evaluate) for correct precedence (CA-2); no external deps.
- **Terminal:** a line-discipline REPL whose commands **map onto the Command Registry**. `ls/cd/cat/...` call VFS commands; `open` calls `app.launch`; `ai "..."` calls the AI layer. The terminal is essentially a text frontend to the same registry.
- **Settings:** a reactive form over the Settings Service; changes propagate live via `settings:changed`.
- **AI Command Center:** see Layer 5 — it's an app *and* a system surface (also invokable globally).

---

## 7. Layer 5 — The AI Layer (AI-Native Design)

This is the differentiator. The architecture's job is to make the AI *capable and safe* by construction.

### 7.1 Orchestrator
The orchestrator owns a conversation and a loop:

```
user NL input
   → assemble context (running apps, focused window, recent files, cwd)
   → send to provider WITH tool schemas generated from the Command Registry
   → provider responds with text and/or tool calls
   → for each tool call:
        • resolve to a registry command
        • if destructive → require user confirmation (AI-4)
        • check capability → execute via commands.run(...)
        • feed result back to the model
   → repeat until the model returns a final answer (multi-step "plans", AI-9)
   → stream text to the UI (AI-6)
```

### 7.2 Registry → Tool-schema bridge
The single most leveraged piece of the AI design: **tool definitions are generated, not hand-written.** Each Command's parameter schema is transformed into the provider's tool/function-calling schema. Consequences:

- Zero per-feature AI integration work.
- The AI's capabilities are *exactly* the OS's capabilities — no more, no less.
- New apps extend the AI automatically by registering commands.
- The `destructive` and `capability` flags travel with the tool, so safety is enforced uniformly.

### 7.3 Provider abstraction
A `Provider` interface (`chat(messages, tools, opts) → stream`) with a default **Claude** implementation and room for others (AI-8). Keys are entered in Settings and stored outside logs. Post-MVP, a hosted proxy removes the BYO-key requirement and centralizes cost controls (caching, model routing, rate limits).

### 7.4 Context & memory
- **Working context:** OS state snapshot injected each turn (cheap, structured).
- **Conversation history:** persisted to the VFS (AI-7), so sessions resume.
- **Cost control:** a small/cheap model can do intent-routing; the strong model handles execution. Streaming keeps perceived latency low.

### 7.5 Safety model
- Destructive commands always confirm.
- The AI is confined to the Command Registry — it literally cannot do what isn't a command.
- Capability checks apply to AI-invoked commands identically to app-invoked ones.
- A dry-run/preview mode for multi-step plans (roadmap) shows intended actions before executing.

---

## 8. Cross-Cutting Concerns

### 8.1 State & data flow (summary)
```
User / AI / Terminal / Palette
        │  (all funnel through)
        ▼
   COMMAND REGISTRY ──runs──► SERVICE (VFS / WM / Settings / …)
                                   │ mutates owned state slice
                                   ▼
                              STATE STORE ──emits──► EVENT BUS
                                   │
                                   ▼
                         SHELL & APPS re-render reactively
```
One direction, one source of truth per slice, one bus. Easy to reason about, easy to log.

### 8.2 Persistence map
| Data | Store | Rationale |
|------|-------|-----------|
| File contents | OPFS (→ IDB fallback) | Large, durable, performant. |
| FS tree / metadata index | IndexedDB | Fast listing & search. |
| Settings | localStorage | Small, synchronous config. |
| Window/session layout | localStorage / IDB | Restore on reload. |
| AI conversations | VFS | User-owned, portable, exportable. |
| App-private data | IDB (namespaced) | Isolation per app. |

**Durability:** request persistent-storage permission to resist eviction; offer export/backup; cloud sync is the roadmap answer to true durability across devices.

### 8.3 Performance strategy
- **Lazy-load** app bundles (code-split per app) → fast cold boot (NFR < 2.5s).
- **Web Workers** for heavy/blocking work (search indexing, large file ops, AI streaming parse) to keep the main thread at 60fps.
- **rAF-throttled** drag/resize; transform-based movement to avoid layout thrash.
- **Virtualize** long lists (file listings, notes, terminal scrollback).
- **Perf budgets in CI:** bundle-size and boot-time gates so regressions are caught early.

### 8.4 Security & privacy
- Strict `iframe sandbox` for the Browser app; no `allow-same-origin` with `allow-scripts` together for untrusted content.
- Capability broker gates all privileged calls.
- AI keys never logged; destructive actions confirmed.
- Local-first: nothing leaves the device except explicit AI requests, which are disclosed.

### 8.5 Error handling & observability
- **Error boundary per app** → one app crashing terminates only its process.
- Kernel-level structured logger tapping the Event Bus.
- Opt-in telemetry (boot time, command success/failure, crash counts) → feeds the PRD KPIs.

### 8.6 Accessibility & theming
- **Design tokens** (color, spacing, radius, typography) consumed by every app via the SDK → visual consistency and one-switch theming (light/dark/system + accent).
- ARIA roles on shell components, full keyboard operability, visible focus, `prefers-reduced-motion` respected.

---

## 9. Recommended Technology Direction

*Choices are recommendations; the architecture does not depend on any single one. The boundaries above are framework-agnostic.*

| Concern | Recommendation | Rationale |
|---------|----------------|-----------|
| UI framework | A reactive component framework (e.g. React or Svelte) | Reactive rendering matches our state-driven shell; large ecosystem. |
| Language | **TypeScript** (strict) | Typed command/manifest/SDK contracts are central to safety. |
| Build/dev | Vite | Fast HMR, first-class code-splitting for lazy app loading. |
| State | Lightweight reactive store (signals/Zustand-style) | Fine-grained reactivity without heavy boilerplate. |
| Styling | Token-driven CSS (CSS variables) + utility or CSS-modules | Live theming via variables; per-app isolation. |
| Persistence | OPFS + IndexedDB (via a thin wrapper) | As mapped in §8.2. |
| AI | Provider interface; **Claude** default (latest Claude models) | Strong tool-use/function-calling; pluggable. |
| Testing | Unit (services/commands) + component + e2e (boot, WM, an AI command path) | Confidence at the seams that matter. |
| Workers | Web Workers / Comlink-style RPC | Offload heavy work; future app isolation. |

**Monorepo** layout (see `ProjectStructure.md`) so kernel, services, SDK, and apps are separately versioned packages with explicit dependencies — enforcing the dependency rule mechanically.

---

## 10. Scalability Roadmap (architecture evolution)

The v1 makes pragmatic choices (apps in-process, single-user, local persistence). The boundaries are chosen so each can evolve **without a rewrite**:

| Dimension | v1 | Evolution | Enabled by |
|-----------|----|-----------|-----------|
| App isolation | In-process + error boundaries | Web Worker / iframe sandbox per app | The App SDK is already the only access path; marshal it over `postMessage`. |
| Persistence | Local (OPFS/IDB) | Cloud sync, multi-device | VFS is an interface; add a syncing backend behind it. |
| AI | BYO-key, client-side | Hosted proxy, caching, model routing, plans | Provider interface + orchestrator already abstract this. |
| Apps | First-party only | Third-party app store | Manifest + capability broker already designed for untrusted apps. |
| Users | Single, anonymous-local | Accounts, sharing, collaboration | Settings/VFS keyed by user once accounts land. |
| Compute | Browser main thread + workers | WASM modules, WebContainers for real dev tooling | Terminal/commands already abstract execution. |

> The discipline that pays this off: **never let anything bypass the Command Registry, the App SDK, or the Event Bus.** Those three seams are the entire bet.

---

## 11. Key Architectural Decisions (ADR summary)

| # | Decision | Why | Trade-off accepted |
|---|----------|-----|--------------------|
| ADR-1 | Small trusted kernel; everything else is a service or app. | Stability + extensibility. | More upfront structure than a monolith. |
| ADR-2 | Single Command Registry as the universal action interface. | AI, UI, terminal, palette unified for free. | Every feature must be expressed as a command (a healthy constraint). |
| ADR-3 | AI tool schemas generated from the registry. | Zero per-feature AI work; AI = OS capabilities exactly. | Requires disciplined command schemas. |
| ADR-4 | Manifest + capability broker for apps from day one. | Third-party readiness without a rewrite. | Slight overhead for first-party apps. |
| ADR-5 | OPFS for bytes + IndexedDB index for structure. | Performance + durability + cheap search. | Two stores to keep transactionally consistent. |
| ADR-6 | Apps in-process for v1, SDK boundary preserved. | Speed to ship; isolation later. | Temporary weaker isolation; mitigated by error boundaries. |
| ADR-7 | Event Bus as the only cross-component channel. | Loose coupling, observability. | Indirection; mitigated by typed events. |
| ADR-8 | TypeScript-strict, monorepo packages. | Enforce the dependency rule + typed contracts. | Build complexity. |

---

## 12. Open Technical Questions

1. **In-process vs. worker isolation for v1 apps** — default is in-process for performance; revisit if a third-party app program starts early.
2. **Search**: client-side index in IDB vs. a worker-built inverted index — depends on corpus size targets.
3. **Conflict resolution** for eventual cloud sync (CRDT vs. last-write-wins) — deferred to the sync phase but flagged now.
4. **AI cost model**: where the hosted proxy sits and how usage is metered/billed.

These do not block v1; defaults are chosen and documented.
