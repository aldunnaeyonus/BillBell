import { useEffect } from 'react';
import { updateApplicationContext, watchEvents } from 'react-native-watch-connectivity';
import { useBills } from './useBills'; // Assumes you have this hook
import { api } from '../api/client';
import { Bill } from '../types/domain';

export function useWatchConnectivity() {
  const { bills, refetch } = useBills();

  // 1. SEND: Sync Bills to Watch whenever they change
  useEffect(() => {
    if (bills) {
      // Filter and map to a lightweight format to save battery/bandwidth
      const watchData = bills
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

      // updateApplicationContext is best for state sync
      updateApplicationContext({ bills: watchData });
    }
  }, [bills]);

  // 2. RECEIVE: Listen for "Mark Paid" actions from Watch
  useEffect(() => {
    // Listen for immediate messages
    const unsubscribe = watchEvents.on('message', async (message) => {
      if (message.action === 'markPaid' && message.id) {
        console.log(`⌚️ Watch requested payment for bill ${message.id}`);
        
        try {
          // Perform the API call
          await api.billsMarkPaid(message.id);
          
          // Refresh the local list (which triggers effect #1 to update Watch again)
          refetch(); 
        } catch (error) {
          console.error("Failed to mark paid from watch:", error);
        }
      }
    });

    return () => unsubscribe();
  }, [refetch]);
}