# NEXUS OS — Milestone Breakdown

**Document status:** Draft v1.0
**Last updated:** 2026-06-13
**Companion docs:** `PRD.md`, `Architecture.md`, `ProjectStructure.md`, `Roadmap.md`

---

## How to read this document

The `Roadmap.md` describes *phases* (the strategy and sequencing). This document breaks those phases into **concrete, checkable milestones** — each with deliverables, acceptance criteria, dependencies, and the requirement IDs (from `PRD.md`) it satisfies. A milestone is a unit of work you can demo and check off.

Milestone IDs are `Mx.y`. Each ends with a **Demo** — the one thing you show to prove it's real.

Effort key (relative, for a small senior team): **S** ≈ days · **M** ≈ ~1 wk · **L** ≈ ~2 wks.

---

## Milestone Map

| ID | Milestone | Phase | Effort | Depends on |
|----|-----------|-------|--------|-----------|
| M0.1 | Repo, tooling & CI scaffolding | 0 | M | — |
| M0.2 | Boot screen | 0 | S | M0.1 |
| M1.1 | Event Bus | 1 | S | M0.1 |
| M1.2 | Service Registry & State Store | 1 | M | M1.1 |
| M1.3 | Process / Lifecycle Manager | 1 | M | M1.2 |
| M1.4 | Capability Broker | 1 | S | M1.2 |
| M1.5 | **Command Registry** | 1 | M | M1.2 |
| M2.1 | Window Manager core | 2 | L | M1.3 |
| M2.2 | Window snapping & persistence-ready geometry | 2 | M | M2.1 |
| M2.3 | Desktop shell (desktop, taskbar, tray) | 2 | M | M2.1 |
| M2.4 | App Launcher & Command Palette | 2 | M | M1.5, M2.3 |
| M3.1 | VFS core (tree, CRUD, events) | 3 | L | M1.2 |
| M3.2 | Persistence backends (OPFS + IDB) | 3 | M | M3.1 |
| M3.3 | Settings & session persistence | 3 | M | M3.2, M2.2 |
| M4.1 | App SDK & manifest loader | 4 | M | M1.5, M3.1 |
| M4.2 | Terminal app | 4 | L | M4.1 |
| M4.3 | Notes app | 4 | M | M4.1 |
| M4.4 | Calculator app | 4 | S | M4.1 |
| M5.1 | Browser app | 5 | M | M4.1 |
| M5.2 | Settings app | 5 | M | M3.3, M4.1 |
| M6.1 | Provider abstraction & Claude provider | 6 | M | M4.1 |
| M6.2 | **Registry → tool-schema bridge** | 6 | M | M1.5, M6.1 |
| M6.3 | AI Orchestrator loop | 6 | L | M6.2 |
| M6.4 | AI Command Center UI & global trigger | 6 | M | M6.3 |
| M6.5 | Safety: confirmation & capability gating | 6 | M | M6.3 |
| M7.1 | Performance budgets met | 7 | L | Phase 6 done |
| M7.2 | Accessibility pass | 7 | M | Phase 6 done |
| M7.3 | Robustness & error isolation | 7 | M | Phase 6 done |
| M8.1 | Onboarding & telemetry | 8 | M | Phase 7 done |
| M8.2 | Host import/export & trash | 8 | M | M3.2 |
| M8.3 | Extensibility docs & SDK reference | 8 | M | M4.1 |
| M8.4 | Private beta launch | 8 | M | M8.1 |

---

## Phase 0 — Foundations

### M0.1 — Repo, tooling & CI scaffolding
**Deliverables:** monorepo workspace; strict TS + project references; Vite; ESLint/Prettier **with import-boundary rules**; CI (typecheck, test, placeholder perf budget).
**Acceptance:** clean install builds; CI green; an illegal import (app → services) **fails lint**.
**Satisfies:** NFR-maintainability, ADR-8.
**Demo:** open a PR that imports `services` from an app → CI rejects it.

### M0.2 — Boot screen
**Deliverables:** kernel skeleton + boot sequence; branded splash → blank desktop placeholder.
**Acceptance:** `dev` renders splash then transitions; boot is orchestrated by the kernel, not ad-hoc.
**Satisfies:** DE-1.
**Demo:** run dev server → NEXUS boot animation appears.

---

## Phase 1 — Kernel & Core Seams

### M1.1 — Event Bus
**Deliverables:** typed `emit/on` pub/sub; central event catalogue (`domain:action`); handler isolation.
**Acceptance:** events round-trip; a throwing handler doesn't block others; unsubscribe works.
**Satisfies:** PL-1, ADR-7.
**Demo:** unit test: three subscribers, one throws, other two still receive.

### M1.2 — Service Registry & State Store
**Deliverables:** DI registry (register/resolve by interface); reactive, namespaced state store.
**Acceptance:** a service resolves by interface; state change notifies subscribers; only owner mutates its slice (enforced in review/types).
**Satisfies:** Architecture §3.3, §3.5.
**Demo:** register a mock service, resolve it, mutate state, observe a subscriber re-run.

### M1.3 — Process / Lifecycle Manager
**Deliverables:** process table; lifecycle states; single/multi-instance enforcement; lazy-load hook.
**Acceptance:** launching/terminating a fake process updates the table and emits lifecycle events.
**Satisfies:** WM-6 (instancing), Architecture §3.2.
**Demo:** launch two instances of a multi-instance app, one of a singleton (second blocked).

### M1.4 — Capability Broker
**Deliverables:** capability token model; grant on launch from manifest; check on privileged call.
**Acceptance:** a call without the required capability is denied.
**Satisfies:** PL-3, ADR-4.
**Demo:** an app lacking `fs:write` is refused a write.

### M1.5 — Command Registry ★
**Deliverables:** `register/run/list/search`; command + parameter-schema types; `destructive` & `capability` flags; seed system commands (`app.launch`, `app.close`).
**Acceptance:** a command registers, is discoverable by search, runs with validated args; a destructive command is flagged.
**Satisfies:** AI-3, PL-1, ADR-2 — *the keystone.*
**Demo:** register `demo.echo`, run it from a test; list shows it; search finds it by title.

---

## Phase 2 — Shell & Window Manager

### M2.1 — Window Manager core
**Deliverables:** window model; open/close/move/resize; focus + z-order; per-app size/min/resizable constraints; 60fps drag (rAF + transforms).
**Acceptance:** multiple windows; drag/resize smooth; click-to-focus correct; constraints honored.
**Satisfies:** WM-1, WM-2, WM-3, WM-5.
**Demo:** open three "Hello" windows; drag/resize/focus all behave.

### M2.2 — Snapping & persistence-ready geometry
**Deliverables:** left/right-half + top-edge-maximize snapping; geometry serialized to a restorable shape.
**Acceptance:** snap zones trigger correctly; geometry export/import restores layout.
**Satisfies:** WM-4, WM-7.
**Demo:** drag a window to the left edge → snaps to half.

### M2.3 — Desktop shell
**Deliverables:** desktop + wallpaper + context menu; taskbar/dock reflecting running windows; system tray with live clock + indicators.
**Acceptance:** taskbar updates as windows open/close/minimize; tray clock ticks.
**Satisfies:** DE-2, DE-3, DE-5, DE-8.
**Demo:** open/minimize windows → dock reflects state in real time.

### M2.4 — App Launcher & Command Palette
**Deliverables:** launcher grid from app registry (launch via `app.launch`); global-hotkey command palette over the Command Registry.
**Acceptance:** launcher lists apps and opens them; palette fuzzy-searches and runs commands.
**Satisfies:** DE-4, DE-6.
**Demo:** hit the palette hotkey, type "open notes," launch it — *and the same command will later power the AI.*

---

## Phase 3 — File System & Persistence

### M3.1 — VFS core
**Deliverables:** tree model; full CRUD; path resolution; `stat/exists/list/move/rename`; `fs:changed` events; default directory skeleton.
**Acceptance:** all CRUD ops correct; events emitted; skeleton seeded on first boot.
**Satisfies:** FS-1, FS-2, FS-4, FS-5, FS-6, FS-10.
**Demo:** create `/documents/hello.txt`, list `/documents`, rename, delete — events fire each time.

### M3.2 — Persistence backends
**Deliverables:** OPFS content backend; IndexedDB metadata index; IDB content fallback; transactional index/content consistency; storage-usage reporting.
**Acceptance:** data survives reload; OPFS-absent path falls back cleanly; usage reported.
**Satisfies:** FS-3, FS-9, ADR-5.
**Demo:** create files, reload tab → still present; disable OPFS → still works via IDB.

### M3.3 — Settings & session persistence
**Deliverables:** Settings Service (typed schema, defaults, `settings:changed`); window/session layout persistence wired to WM.
**Acceptance:** settings persist & apply live; window layout restored on reload.
**Satisfies:** SE-4, WM-7.
**Demo:** move windows, change a setting, reload → layout and setting preserved.

---

## Phase 4 — First Applications

### M4.1 — App SDK & manifest loader
**Deliverables:** manifest schema; SDK (`fs/windows/settings/notify/commands/ai/storage/events`) with capability gating; kernel loads manifests → launcher + command registration + capability grants; lazy app loading.
**Acceptance:** an app declared only by manifest + entry appears in the launcher and runs; SDK calls respect capabilities.
**Satisfies:** PL-2, PL-3, PL-4, ADR-4, ADR-6 — *the "<1 week to add an app" guarantee.*
**Demo:** add a stub app via manifest only → it shows up and launches with no core edits.

### M4.2 — Terminal app *(built first to exercise registry + VFS)*
**Deliverables:** REPL with scrollback; builtins `ls/cd/cat/mkdir/rm/touch/echo/pwd/clear` mapped onto VFS/registry; history; tab-completion; `open <app>`, `apps`, `whoami`; stub `ai "..."`.
**Acceptance:** all builtins operate on the real VFS; history & completion work; `open notes` launches Notes.
**Satisfies:** TE-1, TE-2, TE-3, TE-4 (and TE-5 stub).
**Demo:** `mkdir /demo && cd /demo && touch a.txt && ls` → file appears, confirmed in the VFS.

### M4.3 — Notes app
**Deliverables:** Markdown editor; debounced autosave to VFS; note list + search; registers `notes.summarize`/`notes.rewrite` command stubs.
**Acceptance:** notes persist; search filters; created notes visible in Terminal/VFS.
**Satisfies:** NO-1, NO-2, NO-3, NO-4 (NO-5 wired in Phase 6).
**Demo:** write a note, reload → present; `ls /documents/notes` in Terminal shows it (cross-app proof).

### M4.4 — Calculator app
**Deliverables:** precedence-correct expression engine (tokenize → shunting-yard → evaluate); keypad + keyboard input; scientific mode.
**Acceptance:** `2 + 3 * 4 = 14` (not 20); keyboard & buttons agree; scientific functions correct.
**Satisfies:** CA-1, CA-2, CA-3.
**Demo:** evaluate a nested expression with correct precedence.

---

## Phase 5 — Browser & Settings

### M5.1 — Browser app
**Deliverables:** address bar + back/forward/reload/home; strict sandboxed iframe; **framing-failure detection → open-in-new-tab fallback**; bookmarks in VFS; tabs.
**Acceptance:** framable sites render; non-framable sites show a clear message + escape hatch; bookmarks persist.
**Satisfies:** BR-1, BR-2, BR-3, BR-4, BR-5.
**Demo:** load a framable site; attempt a framing-blocked site → graceful fallback.

### M5.2 — Settings app
**Deliverables:** Appearance (theme/accent/wallpaper, applied live), System (storage/reset/about), AI (provider/key/behavior) panels over the Settings Service.
**Acceptance:** changing the theme re-themes the whole OS instantly; reset clears state; AI panel stores keys securely.
**Satisfies:** SE-1, SE-2, SE-3, SE-5.
**Demo:** toggle dark mode → entire OS retheme without reload.

---

## Phase 6 — AI Command Center

### M6.1 — Provider abstraction & Claude provider
**Deliverables:** `Provider` interface (`chat(messages, tools, opts) → stream`); Claude implementation (latest Claude models); key from Settings, never logged.
**Acceptance:** a raw prompt returns a streamed completion; provider is swappable.
**Satisfies:** AI-8.
**Demo:** send "hello" → streamed reply in a test harness.

### M6.2 — Registry → tool-schema bridge ★
**Deliverables:** transform every registered command's parameter schema into the provider's tool schema; carry `destructive`/`capability` metadata.
**Acceptance:** all registry commands appear as callable tools; adding a command adds a tool with **zero AI-specific code**.
**Satisfies:** AI-3, ADR-3 — *the leverage point.*
**Demo:** register a new command → it instantly appears in the model's available tools.

### M6.3 — Orchestrator loop
**Deliverables:** context assembly (running apps, focused window, recent files, cwd); call-with-tools; execute tool calls via `commands.run`; feed results back; multi-step loop; streaming.
**Acceptance:** a request requiring 2+ tool calls completes end-to-end with streamed narration.
**Satisfies:** AI-1, AI-2, AI-5, AI-6, AI-9 (basic).
**Demo:** "make a notes file about today and open it" → creates file *and* opens Notes.

### M6.4 — AI Command Center UI & global trigger
**Deliverables:** conversation view (streaming); "command feed" showing actions taken; global hotkey + tray invocation; conversation persistence to VFS.
**Acceptance:** invokable from anywhere; shows what it did; history survives reload.
**Satisfies:** AI-1, AI-7.
**Demo:** hotkey from any app → ask → watch the action feed → reload → history intact.

### M6.5 — Safety: confirmation & capability gating
**Deliverables:** destructive-action confirmation UX; capability checks on AI-invoked commands identical to app-invoked ones.
**Acceptance:** a delete/reset via AI prompts for confirmation; an AI tool call lacking capability is denied.
**Satisfies:** AI-4, NFR-security.
**Demo:** "delete all my notes" → explicit confirmation required before anything happens.

---

## Phase 7 — Polish, Accessibility & Performance

### M7.1 — Performance budgets met
**Deliverables:** lazy-load all apps; Web Workers for heavy work; virtualized long lists; transform-based drag; **CI perf gate** (bundle size + boot time).
**Acceptance:** cold boot < 2.5s p75; 60fps drag; app launch < 300ms; CI fails on regression.
**Satisfies:** NFR-performance, NFR-scalability.
**Demo:** Lighthouse/trace showing budgets met; a deliberate bloat PR fails CI.

### M7.2 — Accessibility pass
**Deliverables:** full keyboard operability; ARIA roles on shell; visible focus; `prefers-reduced-motion`; contrast audit.
**Acceptance:** WCAG 2.1 AA checks pass; the OS is usable keyboard-only.
**Satisfies:** NFR-accessibility.
**Demo:** operate launcher → open app → use it → close, entirely via keyboard.

### M7.3 — Robustness & error isolation
**Deliverables:** verified per-app error boundaries; empty/error states; theming consistency audit.
**Acceptance:** forcing an app to throw terminates only that app; OS stays responsive.
**Satisfies:** NFR-maintainability, Architecture §8.5.
**Demo:** chaos test: crash the Browser app → desktop and other apps keep working.

---

## Phase 8 — Beta & Extensibility

### M8.1 — Onboarding & telemetry
**Deliverables:** first-run onboarding; lock/session screen; opt-in telemetry feeding KPIs; structured logging.
**Acceptance:** new user is oriented; telemetry reports boot time & command success when opted in.
**Satisfies:** DE-7, NFR-observability, PRD §8 KPIs.
**Demo:** fresh profile → onboarding → KPI events visible in the telemetry sink.

### M8.2 — Host import/export & trash
**Deliverables:** File System Access import/export; trash with restore.
**Acceptance:** import a host file into the VFS and export back; deleted files recoverable.
**Satisfies:** FS-7, FS-8.
**Demo:** drag a file from the host machine → appears in VFS → delete → restore from trash.

### M8.3 — Extensibility docs & SDK reference
**Deliverables:** finalized, documented manifest + capability model; SDK/command reference **generated from schemas**; a sample third-party app template.
**Acceptance:** the docs alone are sufficient to build an app without reading core source.
**Satisfies:** G4, ADR-4.
**Demo:** hand the docs + template to a developer outside the team.

### M8.4 — Private beta launch
**Deliverables:** invite flow; feedback channel; stability triage; BYO-key AI (hosted proxy spike tracked separately).
**Acceptance:** external users complete real sessions; crash-free > 99%; **first app shipped by an outside developer** (the G4 signal).
**Satisfies:** PRD §11 (Private Beta), G3, G4, G5.
**Demo:** an outsider boots NEXUS, uses it across a reload, and an external dev's app runs inside it.

---

## Traceability Summary

Every PRD requirement maps to at least one milestone:

| PRD area | Covered by |
|----------|-----------|
| Desktop/Shell (DE-*) | M0.2, M2.3, M2.4, M8.1 |
| Window Manager (WM-*) | M1.3, M2.1, M2.2, M3.3 |
| File System (FS-*) | M3.1, M3.2, M8.2 |
| Browser (BR-*) | M5.1 |
| Notes (NO-*) | M4.3, M6.3 |
| Calculator (CA-*) | M4.4 |
| Terminal (TE-*) | M4.2 |
| Settings (SE-*) | M3.3, M5.2 |
| AI Command Center (AI-*) | M6.1–M6.5 |
| Platform (PL-*) | M1.1, M1.4, M1.5, M4.1, M5.2 |
| Non-functional (NFR-*) | M7.1, M7.2, M7.3, M8.1 |

> **Definition of v1.0 complete:** all Phase 0–7 milestones done, M8.1–M8.3 done, and M8.4's exit criteria met (external session across a reload + an outside-developer app running inside NEXUS).
