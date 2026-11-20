import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moviesApi } from '../api/movies-api';
import type { CreateMoviePayload, UpdateMoviePayload } from '../types/movie.types';

export const MOVIES_QUERY_KEY = ['movies'] as const;

export function useMovies() {
  const queryClient = useQueryClient();

  const moviesQuery = useQuery({
    queryKey: MOVIES_QUERY_KEY,
    queryFn: () => moviesApi.getAll(),
  });

  const createMovieMutation = useMutation({
    mutationFn: (payload: CreateMoviePayload) => moviesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MOVIES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['rewatch-plan'] });
    },
  });

  const updateMovieMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMoviePayload }) =>
      moviesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MOVIES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['rewatch-plan'] });
    },
  });

  const toggleWatchedMutation = useMutation({
    mutationFn: ({ id, watched }: { id: string; watched: boolean }) =>
      moviesApi.toggleWatched(id, watched),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MOVIES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['rewatch-plan'] });
    },
  });

  return {
    movies: moviesQuery.data ?? [],
    isLoading: moviesQuery.isLoading,
    isError: moviesQuery.isError,
    error: moviesQuery.error,
    refetch: moviesQuery.refetch,
    createMovie: createMovieMutation.mutateAsync,
    isCreating: createMovieMutation.isPending,
    createError: createMovieMutation.error,
    updateMovie: updateMovieMutation.mutateAsync,
    isUpdating: updateMovieMutation.isPending,
    updateError: updateMovieMutation.error,
    toggleWatched: toggleWatchedMutation.mutateAsync,
    isTogglingWatched: toggleWatchedMutation.isPending,
  };
}
