import React from 'react';
import type { Movie } from '../../movies/types/movie.types';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Film } from 'lucide-react';

export interface TargetMovieSelectProps {
  movies: Movie[];
  selectedTargetId: string;
  onSelectTarget: (id: string) => void;
  isLoading?: boolean;
}

export const TargetMovieSelect: React.FC<TargetMovieSelectProps> = ({
  movies,
  selectedTargetId,
  onSelectTarget,
  isLoading = false,
}) => {
  return (
    <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-sm">
      <CardHeader className="p-5 pb-3">
        <CardTitle className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <Film className="h-4 w-4 text-red-500" />
          Select Target Movie
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <label htmlFor="target-movie-dropdown" className="sr-only">
            Target movie
          </label>
          <select
            id="target-movie-dropdown"
            value={selectedTargetId}
            onChange={(e) => onSelectTarget(e.target.value)}
            disabled={isLoading}
            className="flex h-11 w-full sm:max-w-md rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/80 focus:border-red-500/80"
          >
            <option value="">-- Choose a target movie (e.g. Avengers: Doomsday) --</option>
            {movies.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title} ({m.releaseYear})
              </option>
            ))}
          </select>
          {selectedTargetId && (
            <span className="text-xs text-slate-400">
              Prerequisite watch order and statistics will be authoritative calculated by the backend API.
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
