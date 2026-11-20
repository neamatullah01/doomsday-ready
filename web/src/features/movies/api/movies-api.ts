import { apiClient } from '../../../lib/api-client';
import type { Movie, CreateMoviePayload, UpdateMoviePayload } from '../types/movie.types';

export const moviesApi = {
  getAll: () => apiClient.get<Movie[]>('/movies'),
  getById: (id: string) => apiClient.get<Movie>(`/movies/${id}`),
  create: (payload: CreateMoviePayload) => apiClient.post<Movie>('/movies', payload),
  update: (id: string, payload: UpdateMoviePayload) =>
    apiClient.patch<Movie>(`/movies/${id}`, payload),
  toggleWatched: (id: string, watched: boolean) =>
    apiClient.patch<Movie>(`/movies/${id}`, { watched }),
};
