import NetInfo from "@react-native-community/netinfo";
import { getJson, setJson } from "../storage/storage"; // Your MMKV helpers
import { api } from "../api/client";

const QUEUE_KEY = "billbell_sync_queue";

type QueueItem = {
  id: string;
  type: "CREATE" | "UPDATE" | "DELETE" | "MARK_PAID";
  payload: any;
  timestamp: number;
};


export const SyncQueue = {
  // Add an item to the queue
  enqueue: async (type: QueueItem["type"], payload: any) => {
const queue = (getJson(QUEUE_KEY) as QueueItem[]) || [];
    const item: QueueItem = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      payload,
      timestamp: Date.now(),
    };
    
    // Optimistic Update Helpers (Optional: You can trigger global state updates here)
    // For now, we save to queue to ensure persistence
    setJson(QUEUE_KEY, [...queue, item]);
    
    // Try to process immediately
    SyncQueue.process();
  },

  // Process the queue
  process: async () => {
    const state = await NetInfo.fetch();
    if (!state.isConnected) return; // Still offline

const queue = (getJson(QUEUE_KEY) as QueueItem[]) || [];
    if (queue.length === 0) return;

    const remainingQueue = [];

    for (const item of queue) {
      try {
        switch (item.type) {
          case "CREATE":
            await api.billsCreate(item.payload);
            break;
          case "UPDATE":
            // Assumes payload has { id, ...data }
            await api.billsUpdate(item.payload.id, item.payload);
            break;
          case "DELETE":
            await api.billsDelete(item.payload.id);
            break;
          case "MARK_PAID":
            await api.billsMarkPaid(item.payload.id);
            break;
        }
        // Success! Don't add back to queue.
      } catch (error) {
        console.error("Sync failed for item", item, error);
        // If it's a 4xx error (validation), drop it. If 5xx or network, keep it.
        // For simplicity, we keep it to retry.
        remainingQueue.push(item); 
      }
    }

    setJson(QUEUE_KEY, remainingQueue);
  },

  // Get Pending Count (for UI Badges)
  getPendingCount: () => {
const queue = (getJson(QUEUE_KEY) as QueueItem[]) || [];
    return queue.length;
  }
};