/**
 * useEvents - Contract events composable for uni-app
 */
import { ref } from "vue";
import { waitForSDK } from "../bridge";
import type { EventsListParams, EventsListResponse } from "../types";

export function useEvents() {
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  const list = async (params: EventsListParams = {}): Promise<EventsListResponse> => {
    isLoading.value = true;
    error.value = null;
    try {
      const sdk = await waitForSDK();
      if (!sdk.events?.list) {
        throw new Error("events.list not available");
      }
      return await sdk.events.list(params);
    } catch (e) {
      error.value = e as Error;
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  return { isLoading, error, list };
}
