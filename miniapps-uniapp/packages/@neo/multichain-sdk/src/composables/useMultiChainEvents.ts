/**
 * Multi-Chain Events Composable
 *
 * Vue composable for subscribing to blockchain events.
 */

import { ref, onUnmounted, readonly } from "vue";
import { getMultiChainBridge } from "../bridge";
import type { ChainId, EventFilter, ChainEvent, EventSubscription } from "../types";

export function useMultiChainEvents() {
  const bridge = getMultiChainBridge();
  const subscriptions = ref<EventSubscription[]>([]);
  const events = ref<ChainEvent[]>([]);

  function subscribe(
    chainId: ChainId,
    type: EventFilter["type"],
    callback?: (event: ChainEvent) => void,
    options?: Partial<EventFilter>,
  ): EventSubscription {
    const filter: EventFilter = {
      chainId,
      type,
      ...options,
    };

    const sub = bridge.subscribe(filter, (event) => {
      events.value.push(event);
      callback?.(event);
    });

    subscriptions.value.push(sub);
    return sub;
  }

  function unsubscribeAll(): void {
    subscriptions.value.forEach((sub) => sub.unsubscribe());
    subscriptions.value = [];
  }

  function clearEvents(): void {
    events.value = [];
  }

  // Auto cleanup on unmount
  onUnmounted(() => {
    unsubscribeAll();
  });

  return {
    subscriptions: readonly(subscriptions),
    events: readonly(events),
    subscribe,
    unsubscribeAll,
    clearEvents,
  };
}
