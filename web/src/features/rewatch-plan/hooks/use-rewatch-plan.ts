import { useQuery } from '@tanstack/react-query';
import { rewatchApi } from '../api/rewatch-api';

export function useRewatchPlan(targetMovieId: string | null) {
  return useQuery({
    queryKey: ['rewatch-plan', targetMovieId],
    queryFn: () => {
      if (!targetMovieId) throw new Error('Target movie ID is required');
      return rewatchApi.getRewatchOrder(targetMovieId);
    },
    enabled: Boolean(targetMovieId),
  });
}
