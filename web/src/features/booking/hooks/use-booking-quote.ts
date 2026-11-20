import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingApi } from '../api/booking-api';
import type { CreateCinemaPayload } from '../types/booking.types';

export const CINEMAS_QUERY_KEY = ['cinemas'] as const;

export function useCinemas() {
  const queryClient = useQueryClient();

  const cinemasQuery = useQuery({
    queryKey: CINEMAS_QUERY_KEY,
    queryFn: () => bookingApi.getCinemas(),
  });

  const createCinemaMutation = useMutation({
    mutationFn: (payload: CreateCinemaPayload) => bookingApi.createCinema(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CINEMAS_QUERY_KEY });
    },
  });

  return {
    cinemas: cinemasQuery.data ?? [],
    isLoading: cinemasQuery.isLoading,
    isError: cinemasQuery.isError,
    error: cinemasQuery.error,
    refetch: cinemasQuery.refetch,
    createCinema: createCinemaMutation.mutateAsync,
    isCreating: createCinemaMutation.isPending,
    createError: createCinemaMutation.error,
  };
}

export function useBookingQuote(cinemaId: string | null, groupSize: number | null) {
  const isEnabled = Boolean(cinemaId && groupSize && groupSize > 0 && groupSize <= 10000);

  return useQuery({
    queryKey: ['booking-quote', cinemaId, groupSize],
    queryFn: () => {
      if (!cinemaId || !groupSize) throw new Error('Cinema and group size are required');
      return bookingApi.getBookingQuote(cinemaId, groupSize);
    },
    enabled: isEnabled,
    staleTime: 1000 * 60, // 1 min
  });
}
