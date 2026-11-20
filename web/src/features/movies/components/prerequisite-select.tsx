import React, { useState, useMemo } from 'react';
import type { Movie } from '../types/movie.types';
import { Badge } from '../../../components/ui/Badge';
import { X, Search, Check } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface PrerequisiteSelectProps {
  movies: Movie[];
  currentMovieId?: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export const PrerequisiteSelect: React.FC<PrerequisiteSelectProps> = ({
  movies,
  currentMovieId,
  selectedIds,
  onChange,
  disabled = false,
}) => {
  const [search, setSearch] = useState('');

  // Filter out the current movie itself (a movie cannot be its own prerequisite)
  const availableMovies = useMemo(() => {
    return movies.filter((m) => m.id !== currentMovieId);
  }, [movies, currentMovieId]);

  const filteredMovies = useMemo(() => {
    if (!search.trim()) return availableMovies;
    const q = search.toLowerCase();
    return availableMovies.filter((m) => m.title.toLowerCase().includes(q));
  }, [availableMovies, search]);

  const selectedMovies = useMemo(() => {
    return selectedIds
      .map((id) => movies.find((m) => m.id === id))
      .filter((m): m is Movie => Boolean(m));
  }, [selectedIds, movies]);

  const handleToggle = (id: string) => {
    if (disabled) return;
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(selectedIds.filter((item) => item !== id));
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-300">
          Prerequisites
          <span className="text-xs text-slate-500 font-normal ml-2">
            (Movies that must be watched first)
          </span>
        </label>
        <span className="text-xs font-mono text-slate-400">
          {selectedIds.length} selected
        </span>
      </div>

      {/* Selected chips */}
      {selectedMovies.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800">
          {selectedMovies.map((movie) => (
            <Badge
              key={movie.id}
              variant="cyan"
              size="sm"
              className="gap-1 pl-2 pr-1 py-1 text-xs bg-slate-900 border-slate-700 text-slate-200"
            >
              <span>{movie.title}</span>
              <button
                type="button"
                onClick={(e) => handleRemove(movie.id, e)}
                disabled={disabled}
                className="rounded p-0.5 hover:bg-slate-800 text-slate-400 hover:text-white"
                aria-label={`Remove ${movie.title} prerequisite`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search & Selection Box */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/80 overflow-hidden">
        <div className="flex items-center px-3 border-b border-slate-800/80 bg-slate-950/40">
          <Search className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={disabled}
            placeholder="Search movies to add as prerequisite..."
            className="w-full bg-transparent px-2.5 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-slate-500 hover:text-slate-300 p-1"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="max-h-48 overflow-y-auto divide-y divide-slate-800/40 p-1">
          {filteredMovies.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              {availableMovies.length === 0
                ? 'No other movies available.'
                : 'No movies match your search.'}
            </div>
          ) : (
            filteredMovies.map((movie) => {
              const isSelected = selectedIds.includes(movie.id);

              return (
                <button
                  key={movie.id}
                  type="button"
                  onClick={() => handleToggle(movie.id)}
                  disabled={disabled}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 text-left rounded-md text-xs transition-colors',
                    isSelected
                      ? 'bg-red-950/30 text-white font-medium'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white',
                  )}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <div
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                        isSelected
                          ? 'border-red-500 bg-red-600 text-white'
                          : 'border-slate-700 bg-slate-950',
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <span className="truncate">{movie.title}</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      ({movie.releaseYear})
                    </span>
                  </div>
                  {movie.watched && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 rounded px-1.5 py-0.5 shrink-0">
                      Watched
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
