# NEXUS OS — Product Requirements Document

**Document status:** Draft v1.0
**Last updated:** 2026-06-13
**Owner:** Product & Architecture
**Audience:** Founders, engineering, design, early investors

---

## 1. Executive Summary

**NEXUS OS** is a browser-based operating system — a full desktop computing environment that runs entirely inside a modern web browser, with no installation. It delivers a windowed desktop, a file system, and a suite of native-feeling applications, unified by an **AI Command Center** that lets users drive the entire OS through natural language.

The thesis: the browser has quietly become the most capable, most distributed application runtime on earth. NEXUS OS treats the browser tab as a computer — portable across any device, instantly shareable via a URL, and AI-native from the ground up rather than AI bolted on.

### One-line pitch
> *Your computer, in a tab — AI-native, installable nowhere, available everywhere.*

### Why now
- **Browser capability parity:** WASM, OPFS (Origin Private File System), WebGPU, File System Access API, Web Workers, and WebContainers have closed most of the gap with native runtimes.
- **AI as primary interface:** LLMs make natural-language control of complex software viable for the first time. An OS is the highest-leverage surface for this.
- **Distribution collapse:** A URL is the new install. Zero-friction onboarding is a structural advantage over native apps.

---

## 2. Vision & Strategic Goals

### Vision
A computing environment where the boundary between "using an app" and "telling the computer what you want" disappears. The desktop is familiar enough to be intuitive on day one, but the AI Command Center makes it more capable than any native OS for non-expert users.

### Strategic goals (18-month horizon)
| Goal | Description | Signal of success |
|------|-------------|-------------------|
| **G1 — Believable desktop** | A windowed environment that feels like a real OS, not a website. | New users intuitively drag, resize, multitask without instruction. |
| **G2 — AI-native control** | Any action achievable by hand is also achievable by asking. | >40% of power-user sessions issue at least one AI command. |
| **G3 — Persistent & portable** | State (files, layout, settings) survives reloads and follows the user. | Day-7 retention; cross-device session continuity. |
| **G4 — Extensible platform** | Third parties can ship apps into the OS. | First external app published by an outside developer. |
| **G5 — Startup-grade foundation** | Architecture that scales from prototype to platform without a rewrite. | Adding a new first-party app takes <1 week. |

### Non-goals (explicitly out of scope for v1)
- Replacing a native OS for heavy local compute (video editing, 3D rendering at scale).
- Running arbitrary unsandboxed native binaries.
- Offline-first as a launch requirement (it's a roadmap item, not a v1 gate).
- A real kernel / actual hardware abstraction — NEXUS is an *OS metaphor*, not a literal kernel.

---

## 3. Target Users & Personas

### Persona A — "The Switcher" (primary, consumer)
Tech-comfortable individual on a Chromebook, a borrowed machine, or a locked-down work laptop. Wants a personal computing space that follows them anywhere. **Pain:** can't install software; loses their setup across machines. **NEXUS value:** their whole environment lives in a URL + login.

### Persona B — "The Builder" (primary, prosumer/developer)
Developer or tinkerer who lives in the terminal and wants a scriptable, AI-augmented scratchpad. **Pain:** context-switching between tools. **NEXUS value:** terminal + AI Command Center + file system in one place, accessible from any device.

### Persona C — "The Curious" (growth/virality)
Lands via a shared link, expecting a website, discovers a whole OS. **Pain:** none — pure delight/novelty. **NEXUS value:** shareability and "wow" drive top-of-funnel growth.

### Persona D — "The Integrator" (future, platform)
Third-party developer who wants to publish an app *into* NEXUS rather than building standalone. **NEXUS value:** distribution + built-in AI + file system + window manager for free.

---

## 4. Product Principles

1. **Familiar shell, alien power.** The desktop metaphor lowers the learning curve; the AI raises the ceiling.
2. **Everything is addressable.** Files, windows, apps, and settings all have stable identifiers the AI can act on.
3. **The AI is a first-class citizen, not a chatbot in a corner.** It has a structured API to the OS, not just text.
4. **State is sacred.** Nothing the user creates should be lost to a reload. Persistence is a platform guarantee.
5. **Apps are sandboxed, the kernel is trusted.** A clear trust boundary between the OS core and the apps it hosts.
6. **Degrade gracefully.** No WebGPU? Fall back. No network? Local apps still work. Browser too old? Tell the user clearly.

---

## 5. System Overview

NEXUS OS is composed of five conceptual layers (detailed in `Architecture.md`):

1. **Kernel** — process/app lifecycle, event bus, capability/permission broker, service registry.
2. **System services** — virtual file system, window manager, settings store, notification center, AI orchestration.
3. **Desktop shell** — wallpaper, taskbar/dock, app launcher, system tray, global command palette.
4. **Applications** — Browser, Notes, Calculator, Terminal, Settings, and the AI Command Center.
5. **AI layer** — the orchestrator that translates natural language into OS actions via a tool/command registry.

---

## 6. Functional Requirements

Requirements use **MoSCoW** priority: **M**ust / **S**hould / **C**ould / **W**on't (v1).

### 6.1 Desktop Environment & Shell

| ID | Requirement | Priority |
|----|-------------|----------|
| DE-1 | Boot sequence with a branded splash, then render the desktop. | M |
| DE-2 | Desktop with configurable wallpaper and optional desktop icons. | M |
| DE-3 | Taskbar/dock showing pinned apps and running windows. | M |
| DE-4 | App launcher (start menu / grid) listing all installed apps. | M |
| DE-5 | System tray: clock, network status, AI Command Center trigger, settings shortcut. | M |
| DE-6 | Global command palette (keyboard-invoked) for quick app launch & actions. | S |
| DE-7 | Lock screen / session screen with user identity. | C |
| DE-8 | Right-click context menus on desktop and within shell. | S |

### 6.2 Window Manager

| ID | Requirement | Priority |
|----|-------------|----------|
| WM-1 | Windows can be opened, closed, moved (drag), and resized (edge/corner handles). | M |
| WM-2 | Minimize, maximize/restore, and focus management with correct z-ordering. | M |
| WM-3 | Active-window highlighting; click-to-focus; focus follows interaction. | M |
| WM-4 | Window snapping (left/right halves, maximize on top-edge drag). | S |
| WM-5 | Per-app default window size, min size, and resizability flags. | M |
| WM-6 | Multiple instances of the same app where allowed. | S |
| WM-7 | Window state (position/size) persisted per session. | S |
| WM-8 | Virtual desktops / workspaces. | W |

### 6.3 Virtual File System (VFS)

| ID | Requirement | Priority |
|----|-------------|----------|
| FS-1 | Hierarchical file system with folders and files, rooted at `/`. | M |
| FS-2 | CRUD on files and folders: create, read, write, rename, move, delete. | M |
| FS-3 | Persistence across reloads (OPFS primary, IndexedDB fallback). | M |
| FS-4 | Metadata: name, type/MIME, size, created/modified timestamps. | M |
| FS-5 | A standard directory skeleton (`/home`, `/documents`, `/downloads`, `/system`). | M |
| FS-6 | Path resolution + a programmatic API consumed by apps and the AI layer. | M |
| FS-7 | Import from / export to the host machine (File System Access API). | S |
| FS-8 | Trash/recycle bin with restore. | C |
| FS-9 | Quotas and storage-usage reporting. | S |
| FS-10 | File watching / change events so open apps stay in sync. | S |

### 6.4 Applications

#### Browser App
| ID | Requirement | Priority |
|----|-------------|----------|
| BR-1 | Address bar + navigation (back/forward/reload/home). | M |
| BR-2 | Render external sites via sandboxed `iframe`. | M |
| BR-3 | Tabbed browsing within the app window. | S |
| BR-4 | Bookmarks persisted to the VFS. | S |
| BR-5 | Graceful handling of sites that block framing (clear messaging + open-in-new-tab). | M |
| BR-6 | History. | C |

#### Notes App
| ID | Requirement | Priority |
|----|-------------|----------|
| NO-1 | Create, edit, and delete notes saved to the VFS. | M |
| NO-2 | Rich-text or Markdown editing. | M |
| NO-3 | Note list / sidebar with search. | S |
| NO-4 | Autosave. | M |
| NO-5 | AI assist: summarize / rewrite / continue (via AI layer). | S |

#### Calculator App
| ID | Requirement | Priority |
|----|-------------|----------|
| CA-1 | Standard arithmetic with a button grid + keyboard input. | M |
| CA-2 | Order-of-operations-correct expression evaluation. | M |
| CA-3 | Scientific mode (trig, powers, roots, constants). | S |
| CA-4 | Calculation history. | C |

#### Terminal App
| ID | Requirement | Priority |
|----|-------------|----------|
| TE-1 | Interactive prompt with command input and scrollback. | M |
| TE-2 | Built-in shell commands operating on the VFS (`ls`, `cd`, `cat`, `mkdir`, `rm`, `touch`, `echo`, `pwd`, `clear`). | M |
| TE-3 | Command history (up/down) and tab-completion. | S |
| TE-4 | App-control commands (`open <app>`, `apps`, `whoami`). | S |
| TE-5 | An `ai "<prompt>"` command routing to the AI Command Center. | S |
| TE-6 | Pipe/redirect support. | C |

#### Settings App
| ID | Requirement | Priority |
|----|-------------|----------|
| SE-1 | Appearance: theme (light/dark/system), accent color, wallpaper. | M |
| SE-2 | System: storage usage, factory reset, about. | M |
| SE-3 | AI: model/provider selection, API key entry, behavior toggles. | M |
| SE-4 | Settings persisted and applied live (reactive). | M |
| SE-5 | User profile (display name, avatar). | S |

#### AI Command Center
| ID | Requirement | Priority |
|----|-------------|----------|
| AI-1 | Conversational interface invokable globally (hotkey + tray). | M |
| AI-2 | Natural-language → OS actions: open/close apps, file ops, settings changes. | M |
| AI-3 | A **tool/command registry** the model calls to act on the OS. | M |
| AI-4 | Confirmation step for destructive actions (delete, reset). | M |
| AI-5 | Context awareness: knows running apps, focused window, recent files. | S |
| AI-6 | Streaming responses. | S |
| AI-7 | Conversation history persisted to the VFS. | S |
| AI-8 | Pluggable providers (Claude default; others configurable). | M |
| AI-9 | Multi-step task execution ("plans") with progress reporting. | C |

### 6.5 Platform / Cross-cutting

| ID | Requirement | Priority |
|----|-------------|----------|
| PL-1 | Inter-app communication via a central event bus. | M |
| PL-2 | App manifest format declaring metadata, capabilities, window defaults. | M |
| PL-3 | Capability-based permissions (apps request access to FS, network, AI). | S |
| PL-4 | Theming tokens consumed by all apps for visual consistency. | M |
| PL-5 | Keyboard-shortcut registry (global + per-app). | S |
| PL-6 | Notification center API any app can publish to. | S |

---

## 7. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Cold boot to interactive desktop < 2.5s on mid-tier hardware. Window drag at 60fps. App launch < 300ms. |
| **Scalability** | Architecture supports 20+ apps and 10+ concurrent windows without redesign. Apps lazy-loaded. |
| **Persistence & durability** | No user-created data lost on reload or crash. Writes are atomic where feasible. |
| **Security** | App sandboxing; AI destructive actions gated by confirmation; API keys stored securely (not in plaintext logs); strict iframe sandboxing for the browser app. |
| **Privacy** | Local-first by default; user data does not leave the device except for explicit AI calls. Clear disclosure of what is sent to AI providers. |
| **Accessibility** | Keyboard navigability, ARIA roles on shell components, visible focus, respects reduced-motion. WCAG 2.1 AA target. |
| **Compatibility** | Latest Chrome/Edge/Firefox/Safari. Graceful degradation + clear messaging on unsupported browsers. |
| **Responsiveness** | Desktop-first; defined tablet behavior; mobile shows an informative fallback in v1. |
| **Observability** | Structured client-side logging, error boundaries per app, optional opt-in telemetry. |
| **Maintainability** | New first-party app addable in < 1 week; apps isolated so one crashing can't take down the OS. |

---

## 8. Success Metrics (KPIs)

| Metric | Target (first 90 days post-launch) |
|--------|-------------------------------------|
| Time-to-interactive (cold) | < 2.5s p75 |
| Day-1 retention | > 35% |
| Day-7 retention | > 15% |
| % sessions using AI Command Center | > 40% (power users) |
| Median windows opened per session | ≥ 3 |
| AI command success rate (intended action executed) | > 85% |
| Crash-free sessions | > 99% |

---

## 9. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| Browser storage limits / eviction wipes user data | High | Med | OPFS + IndexedDB; persistent-storage permission; export/backup; cloud sync on roadmap. |
| Sites block iframe embedding, weakening the Browser app | Med | High | Detect framing failure; offer open-in-new-tab; set expectations in UX. |
| AI executes a wrong/destructive action | High | Med | Confirmation gates, dry-run/preview, scoped capabilities, undo where possible. |
| AI provider cost/latency hurts UX & unit economics | Med | Med | Streaming, caching, smaller models for routing, configurable provider, rate limits. |
| Scope creep ("build a whole OS") stalls delivery | High | High | Strict MoSCoW, vertical-slice milestones, kernel-first architecture. |
| Performance degrades as apps multiply | Med | Med | Lazy-loading, Web Workers for heavy work, perf budgets in CI. |
| Cross-browser API gaps (OPFS/WebGPU) | Med | Med | Capability detection + fallbacks; feature-gate non-essential features. |

---

## 10. Dependencies & Assumptions

- **Assumption:** Users are on an evergreen browser supporting OPFS or IndexedDB.
- **Assumption:** AI features require either a user-supplied API key or a hosted proxy (post-MVP).
- **Dependency:** An LLM provider (Claude as default) for the AI Command Center.
- **Dependency:** Browser persistence APIs (OPFS, IndexedDB, File System Access).
- **Assumption:** v1 is single-user, single-device with persistence; multi-device sync is a later phase.

---

## 11. Release Strategy

- **Alpha (internal):** Kernel + WM + VFS + two apps. Dogfooding only.
- **Private Beta:** All six apps + AI Command Center, invite-only, BYO API key.
- **Public Beta:** Hosted AI proxy, onboarding, polish, shareable links.
- **v1.0:** Stability, accessibility, performance budgets met; extensibility groundwork shipped.

Full timing in `Roadmap.md`.

---

## 12. Open Questions

1. Hosted AI proxy vs. strictly BYO-key for public beta? (Unit economics vs. friction.)
2. Account system at v1, or anonymous-local until sync ships?
3. How open is the app platform at v1 — first-party only, or a documented manifest for outsiders?
4. Monetization: freemium (AI usage tiers), pro features, or platform take-rate later?

> These are tracked as decisions, not blockers. Defaults are documented in `Architecture.md` and `Roadmap.md`.
