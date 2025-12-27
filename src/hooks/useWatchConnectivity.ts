import { useEffect } from 'react';
import { updateApplicationContext, watchEvents } from 'react-native-watch-connectivity';
import { useBills } from './useBills';
import { api } from '../api/client';
import { Bill, WatchMessage } from '../types/domain';

export function useWatchConnectivity() {
  // FIX 1: Alias 'data' to 'bills' so we can use it by name.
  const { data: bills, refetch } = useBills();

  // 1. SEND: Sync Bills to Watch whenever they change
  useEffect(() => {
    // Safety check: Ensure 'bills' is treated as an array even if data is still loading (undefined)
    const safeBills = bills || [];

    if (safeBills.length > 0) {
      // Filter and map to a lightweight format to save battery/bandwidth
      const watchData = safeBills
        .filter((b: Bill) => b.status === 'active')
        .sort((a: Bill, b: Bill) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
        .slice(0, 15) // Limit to top 15 most urgent
        .map((b: Bill) => ({
          id: b.id,
          creditor: b.creditor,
          amount_cents: b.amount_cents,
          due_date: b.due_date,
          status: b.status
        }));

      // updateApplicationContext is best for background state sync
      updateApplicationContext({ bills: watchData });
    }
  }, [bills]);

  // 2. RECEIVE: Listen for "Mark Paid" actions from Watch
  useEffect(() => {
    // FIX 2: Use 'any' for the callback argument to satisfy the library's strict types
    // and remove 'async' from the top-level callback.
    const unsubscribe = watchEvents.on('message', (rawMessage: any) => {
      
      // Cast safely to our interface
      const message = rawMessage as WatchMessage;

      if (message.action === 'markPaid' && message.id) {
        console.log(`⌚️ Watch requested payment for bill ${message.id}`);
        
        // Internal async function to handle the logic
        const handlePayment = async () => {
          try {
            // Perform the API call (using non-null assertion '!' since we checked existence)
           const billId = parseInt(message.id!, 0);
            
            await api.billsMarkPaid(billId);
            
            // Refresh the local list (triggers effect #1 to update Watch again)
            refetch(); 
          } catch (error) {
            console.error("Failed to mark paid from watch:", error);
          }
        };

        // Execute the async operation
        handlePayment();
      }
    });

    return () => unsubscribe();
  }, [refetch]);
}