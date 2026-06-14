/**
 * Typed Event Bus — the kernel's only sanctioned cross-component channel
 * (Architecture.md §3.1).
 *
 * Guarantees:
 *  - Synchronous delivery within a tick.
 *  - Handler isolation: one throwing handler does not stop delivery to others.
 *  - `on` returns an unsubscribe function.
 */

import type { SystemEventMap, SystemEventType } from "@/types";

type Handler<T extends SystemEventType> = (payload: SystemEventMap[T]) => void;

class EventBus {
  private handlers: Map<SystemEventType, Set<Handler<SystemEventType>>> =
    new Map();

  /** Subscribe to an event. Returns an unsubscribe function. */
  on<T extends SystemEventType>(type: T, handler: Handler<T>): () => void {
    let set = this.handlers.get(type);
    if (!set) {
      set = new Set();
      this.handlers.set(type, set);
    }
    set.add(handler as Handler<SystemEventType>);
    return () => {
      set?.delete(handler as Handler<SystemEventType>);
    };
  }

  /** Emit an event to all subscribers. Handlers are isolated from each other. */
  emit<T extends SystemEventType>(
    type: T,
    ...args: SystemEventMap[T] extends undefined ? [] : [SystemEventMap[T]]
  ): void {
    const set = this.handlers.get(type);
    if (!set) return;
    const payload = args[0] as SystemEventMap[T];
    for (const handler of set) {
      try {
        (handler as Handler<T>)(payload);
      } catch (err) {
        // Isolation: never let one bad handler break the bus.
        // eslint-disable-next-line no-console
        console.error(`[event-bus] handler for "${type}" threw:`, err);
      }
    }
  }
}

/** Singleton bus shared across the OS. */
export const eventBus = new EventBus();
