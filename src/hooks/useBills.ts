import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { getJson, setJson } from '../storage/storage';
import { Bill } from '../types/domain';

const BILLS_CACHE_KEY = "billbell_bills_list_cache";

export function useBills() {
  return useQuery({
    queryKey: ['bills'],
    queryFn: async () => {
      const res = await api.billsList();
      // Side Effect: Persist to MMKV for offline restart
      if (res.bills) {
        setJson(BILLS_CACHE_KEY, res.bills);
      }
      return res.bills as Bill[];
    },
    // Instant Load: Use MMKV data while fetching fresh data
    initialData: () => getJson(BILLS_CACHE_KEY) || [],
  });
}

export function useBillMutations() {
  const queryClient = useQueryClient();

  const invalidateBills = () => queryClient.invalidateQueries({ queryKey: ['bills'] });

  const markPaid = useMutation({
    mutationFn: (id: number) => api.billsMarkPaid(id),
    onSuccess: invalidateBills,
  });

  const deleteBill = useMutation({
    mutationFn: (id: number) => api.billsDelete(id),
    onSuccess: invalidateBills,
  });

  return { markPaid, deleteBill };
}