export interface Movie {
  id: string;
  title: string;
  releaseYear: number;
  runtimeMinutes: number;
  watched: boolean;
  prerequisites: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMoviePayload {
  title: string;
  releaseYear: number;
  runtimeMinutes: number;
  prerequisiteIds?: string[];
}

export interface UpdateMoviePayload {
  title?: string;
  releaseYear?: number;
  runtimeMinutes?: number;
  watched?: boolean;
  prerequisiteIds?: string[];
}
