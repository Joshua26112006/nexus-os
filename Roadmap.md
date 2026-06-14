# NEXUS OS — Development Roadmap

**Document status:** Draft v1.0
**Last updated:** 2026-06-13
**Companion docs:** `PRD.md`, `Architecture.md`, `ProjectStructure.md`, `Milestones.md`

---

## 1. Roadmap Philosophy

We build **kernel-first, then in vertical slices.** The biggest risk in "build an OS" is spending months on plumbing with nothing to show. We mitigate that two ways:

1. **The foundation comes first** (kernel + the three load-bearing seams: Command Registry, Event Bus, App SDK) because everything else plugs into it and reworking it later is catastrophic.
2. **After the foundation, every phase ships a usable vertical slice** — a real thing a user can do end-to-end — rather than building all of one layer before any of the next.

The order of apps is chosen to *prove the architecture early*: the Terminal is built second because it's the cheapest way to exercise the Command Registry and VFS together; the AI Command Center comes after enough commands exist for it to be impressive.

> **Guiding sequence:** *Make it boot → make it multitask → make it remember → make it useful → make it intelligent → make it shippable.*

---

## 2. Phases at a Glance

| Phase | Theme | Outcome | Rough duration |
|-------|-------|---------|----------------|
| **0** | Foundations & scaffolding | Repo, tooling, kernel skeleton boots. | ~2 wks |
| **1** | Kernel & core seams | Event bus, services registry, command registry, state — working. | ~3 wks |
| **2** | Shell & Window Manager | A real, multitasking desktop with empty windows. | ~3 wks |
| **3** | File system & persistence | VFS that survives reload; durable state. | ~2 wks |
| **4** | First apps (Terminal, Notes, Calculator) | Genuinely useful, talking to the VFS & registry. | ~4 wks |
| **5** | Browser & Settings | Embedded web + live configuration/theming. | ~2 wks |
| **6** | AI Command Center | Natural-language control of the whole OS. | ~4 wks |
| **7** | Polish, a11y, performance | Meets NFR budgets; beta-quality. | ~3 wks |
| **8** | Beta & extensibility groundwork | Onboarding, telemetry, third-party-ready manifest. | ~3 wks |

*Durations assume a small senior team and are planning estimates, not commitments. ~6 months to public beta.*

---

## 3. Phase Detail

### Phase 0 — Foundations & Scaffolding
**Goal:** a developer can clone, install, and see a blank NEXUS boot screen.
- Monorepo + workspace tooling; strict TypeScript; Vite; lint/format with **import-boundary rules** (so the dependency rule is enforced from day one).
- CI pipeline: typecheck, test, and a *placeholder* perf budget.
- Kernel package skeleton + boot sequence rendering a branded splash.
**Exit criteria:** `dev` boots to a splash; CI green; import boundaries enforced.

### Phase 1 — Kernel & Core Seams
**Goal:** the trusted center exists and is tested. *This is the highest-leverage phase.*
- **Event Bus** (typed pub/sub) + central event catalogue.
- **Service Registry** (DI).
- **State Store** (reactive, namespaced).
- **Process/Lifecycle Manager** + process table.
- **Capability Broker** + token model.
- **★ Command Registry** with `register/run/list/search` and the parameter-schema type.
- A handful of system commands (`app.launch`, `app.close`) to prove the loop.
**Exit criteria:** can register a command and run it via a test; an event round-trips; a fake "process" launches/terminates. **These seams are now frozen-ish — changing them later is expensive, so we get them right here.**

### Phase 2 — Desktop Shell & Window Manager
**Goal:** it *feels* like an OS — you can multitask, even with empty windows.
- Desktop (wallpaper, context menu), taskbar/dock, app launcher, system tray with clock.
- **Window Manager:** open/close/move/resize/min/max, focus + z-order, snapping (S), per-app window defaults.
- A trivial "Hello" app to exercise launch → window → focus → close.
- Window geometry persistence (depends lightly on Phase 3; can stub then wire).
**Exit criteria:** launch multiple windows, drag/resize at 60fps, snap, focus behaves, taskbar reflects state.

### Phase 3 — File System & Persistence
**Goal:** nothing is lost on reload.
- **VFS:** tree model, CRUD, path resolution, metadata, `fs:changed` events.
- **Storage:** OPFS content backend + IndexedDB index; IDB fallback; default directory skeleton seeding.
- Settings persistence; window/session layout persistence wired in.
- Storage-usage reporting.
**Exit criteria:** create files/folders, reload the tab, everything is still there; open apps receive change events.

### Phase 4 — First Applications (the "useful" slice)
**Goal:** real tools that prove the architecture pays off.
- **Terminal** *(built first — cheapest proof of Command Registry + VFS):* REPL, `ls/cd/cat/mkdir/rm/touch/echo/pwd/clear` mapped onto registry/VFS commands, history, completion, `open <app>`.
- **Notes:** Markdown editor, autosave to VFS, list + search.
- **Calculator:** precedence-correct expression engine, keypad + keyboard, scientific mode (S).
- Cross-app proof: create a file in Terminal → it appears in Notes (validates the event bus + VFS).
**Exit criteria:** all three apps usable; the cross-app file-sync demo works.

### Phase 5 — Browser & Settings
**Goal:** reach the web; configure the OS live.
- **Browser:** address bar, navigation, sandboxed iframe, **framing-failure fallback**, bookmarks in VFS, tabs (S).
- **Settings:** appearance (theme/accent/wallpaper) applied live via `settings:changed`, system (storage/reset/about), AI (provider/key) panel — *ready for Phase 6*.
**Exit criteria:** browse a framable site (and gracefully handle a non-framable one); flip dark mode and watch the whole OS retheme instantly.

### Phase 6 — AI Command Center (the differentiator)
**Goal:** *anything you can do, you can ask for.*
- **Registry→tool-schema bridge** (the leverage point): every existing command becomes an AI tool automatically.
- **Orchestrator** loop: context assembly → provider call with tools → execute commands → feed back → stream.
- **Claude provider** (default), pluggable interface.
- **Destructive-action confirmation** gating; capability checks on AI-invoked commands.
- Global invocation (hotkey + tray); streaming UI; a "command feed" showing actions taken.
- Conversation persistence to VFS.
- Notes AI actions (summarize/rewrite) registered as commands → free AI integration.
**Exit criteria:** "open Notes and write a haiku about the ocean," "delete that file" (with confirmation), "switch to dark mode" all work end-to-end via natural language.

### Phase 7 — Polish, Accessibility & Performance
**Goal:** hit the non-functional bar.
- Performance: meet boot < 2.5s, 60fps drag, lazy-load every app; move heavy work to Web Workers; virtualize long lists; turn the CI perf budget from placeholder to **gate**.
- Accessibility: keyboard operability everywhere, ARIA on shell, visible focus, reduced-motion; WCAG 2.1 AA pass.
- Robustness: per-app error boundaries verified (one app crashing can't kill the OS); empty/error states; consistent theming audit.
**Exit criteria:** NFR budgets met in CI; a11y audit passes; chaos test (force an app to throw) leaves the OS standing.

### Phase 8 — Beta & Extensibility Groundwork
**Goal:** put it in users' hands and open the platform door.
- Onboarding/first-run; lock/session screen (C).
- Opt-in telemetry feeding the PRD KPIs; structured logging.
- Host import/export (File System Access); trash/restore (C).
- **Extensibility:** finalize and *document* the app manifest + capability model so an outside developer could (in principle) ship an app; publish SDK/command reference (generated from schemas).
- Hosted AI proxy spike (remove BYO-key friction) — may slip to post-beta.
**Exit criteria:** invite-only beta live; first app added by someone *not* on the core team using only the public SDK + docs.

---

## 4. Post-v1 Horizon (Future Phases)

Sequenced by the scalability roadmap in `Architecture.md` §10. None require a rewrite — each lands behind an existing seam.

| Future phase | Lands behind | Value |
|--------------|--------------|-------|
| **Accounts & cloud sync** | VFS backend interface | Multi-device continuity; true durability. |
| **True app isolation** | App SDK (marshal over Workers/iframes) | Safely run third-party code. |
| **App store** | Manifest + capability broker | Platform network effects. |
| **AI plans & autonomy** | Orchestrator (dry-run/preview) | Multi-step task execution. |
| **Collaboration / sharing** | Accounts + VFS | Shared desktops, live co-editing. |
| **Offline-first / PWA** | Service worker + local-first stores | Works without a network. |
| **WASM / WebContainers** | Terminal + command execution | Real dev tooling in-browser. |

---

## 5. Critical Path & Sequencing Logic

```
Phase 0 ─► Phase 1 ─► Phase 2 ─┬─► Phase 4 ─► Phase 5 ─► Phase 6 ─► Phase 7 ─► Phase 8
                       │       │
                       └─► Phase 3 (persistence) ─┘   (3 enables 4's durability)
```

- **Phase 1 is the gate.** Every later phase depends on the Command Registry, Event Bus, and SDK. Rushing it mortgages the whole project.
- **Phases 2 and 3 can partially parallelize** (WM geometry persistence wants the VFS, but WM logic doesn't).
- **Phase 6 depends on Phase 4–5** existing, because the AI is only impressive when there are many commands to call. Building it earlier would mean re-touching it as commands land.
- **Phase 7 cannot start meaningfully** until the surface is feature-complete (you can't budget-tune a moving target).

---

## 6. Risk-Driven Scheduling

The roadmap front-loads the riskiest, most expensive-to-change work (per `PRD.md` §9):

| Risk | Addressed in | How the schedule de-risks it |
|------|--------------|------------------------------|
| Architecture rework | Phase 1 | Seams frozen early, after deliberate design. |
| "Build a whole OS" scope creep | All | Strict MoSCoW; each phase ships a usable slice. |
| Persistence/eviction data loss | Phase 3 | Durability proven before apps depend on it. |
| AI wrong/destructive action | Phase 6 | Confirmation + capability gating built *with* the feature, not after. |
| Performance decay | Phase 7 (budgets from Phase 0) | Perf gate exists from day one, tightened at the end. |
| Cross-browser API gaps | Phases 3, 5 | Fallbacks (IDB, framing-guard) built alongside the primary path. |

---

## 7. Definition of Done (per phase)

A phase is "done" only when:
1. Its exit criteria are demonstrably met (demo, not assertion).
2. Tests cover the new seams (unit for services/commands; e2e for the user-visible slice).
3. CI is green including lint, typecheck, and perf budget.
4. Docs/ADRs updated for any decision that deviated from `Architecture.md`.
5. No P0/P1 regressions in earlier phases (the cross-app demos from Phase 4 still pass).

> Detailed, checkable deliverables per phase live in `Milestones.md`.
