export interface RewatchMovie {
  id: string;
  title: string;
  releaseYear: number;
  runtimeMinutes: number;
  watched: boolean;
}

export interface RewatchOrderResponse {
  targetMovie: {
    id: string;
    title: string;
  };
  movies: RewatchMovie[];
  watchedCount: number;
  totalCount: number;
  unwatchedCount: number;
  remainingRuntimeMinutes: number;
}
