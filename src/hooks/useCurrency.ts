import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userSettings } from '../storage/userSettings';

export function useCurrency() {
  const query = useQuery({
    queryKey: ['currency'],
    queryFn: () => userSettings.getCurrency(),
    initialData: () => userSettings.getCurrency(),
    staleTime: Infinity, // Does not change unless user changes it
  });

  return query.data || 'USD';
}

export function useSetCurrency() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (code: string) => {
      userSettings.setCurrency(code);
      return code;
    },
    onSuccess: (newCode) => {
      // Force all screens to re-read the currency
      queryClient.setQueryData(['currency'], newCode);
    }
  });
}