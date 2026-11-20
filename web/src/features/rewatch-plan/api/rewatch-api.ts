import { apiClient } from '../../../lib/api-client';
import type { RewatchOrderResponse } from '../types/rewatch.types';

export const rewatchApi = {
  getRewatchOrder: (targetMovieId: string) =>
    apiClient.get<RewatchOrderResponse>(`/movies/${targetMovieId}/rewatch-order`),
};
