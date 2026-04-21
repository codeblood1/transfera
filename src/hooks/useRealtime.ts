import { useEffect } from 'react';
import { subscribeToTransfers, subscribeToTransactions } from '@/lib/database';
import { useQueryClient } from '@tanstack/react-query';

export function useRealtime(accountId?: string) {
  const queryClient = useQueryClient();
  const targetId = accountId;

  useEffect(() => {
    if (!targetId) return;

    const transferSub = subscribeToTransfers(targetId, () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['account'] });
    });

    const transactionSub = subscribeToTransactions(targetId, () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['account'] });
    });

    return () => {
      transferSub.unsubscribe();
      transactionSub.unsubscribe();
    };
  }, [targetId, queryClient]);
}
