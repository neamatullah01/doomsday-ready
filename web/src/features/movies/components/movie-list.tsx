import React, { useState, useMemo } from 'react';
import type { Movie } from '../types/movie.types';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { formatRuntime } from '../../../lib/format-runtime';
import { CheckCircle2, Circle, Clock, Calendar, Edit3, Search, Filter, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface MovieListProps {
  movies: Movie[];
  onEditMovie: (movie: Movie) => void;
  onToggleWatched: (id: string, currentWatched: boolean) => Promise<void>;
  isTogglingId?: string | null;
}

export const MovieList: React.FC<MovieListProps> = ({
  movies,
  onEditMovie,
  onToggleWatched,
  isTogglingId,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'watched' | 'unwatched'>('all');

  const movieMap = useMemo(() => {
    return new Map<string, Movie>(movies.map((m) => [m.id, m]));
  }, [movies]);

  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      const matchesSearch = movie.title.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'watched'
          ? movie.watched
          : !movie.watched;
      return matchesSearch && matchesStatus;
    });
  }, [movies, search, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Search and Filters toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search movies by title..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/80"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500 shrink-0 hidden sm:block" />
          <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({movies.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('watched')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                statusFilter === 'watched'
                  ? 'bg-emerald-950/80 text-emerald-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Watched ({movies.filter((m) => m.watched).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('unwatched')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                statusFilter === 'unwatched'
                  ? 'bg-amber-950/80 text-amber-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Unwatched ({movies.filter((m) => !m.watched).length})
            </button>
          </div>
        </div>
      </div>

      {filteredMovies.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400 border border-slate-800 rounded-xl bg-slate-900/40">
          No movies match the current search or filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMovies.map((movie) => {
            const isToggling = isTogglingId === movie.id;
            const prereqMovies = (movie.prerequisites || [])
              .map((id) => movieMap.get(id))
              .filter((m): m is Movie => Boolean(m));

            return (
              <Card
                key={movie.id}
                className="group border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900/90 transition-all duration-200 flex flex-col justify-between"
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base font-bold text-white group-hover:text-red-400 transition-colors">
                      {movie.title}
                    </CardTitle>
                    <button
                      type="button"
                      disabled={isToggling}
                      onClick={() => onToggleWatched(movie.id, movie.watched)}
                      className={cn(
                        'shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150',
                        'focus:outline-none focus:ring-2 focus:ring-red-500/80',
                        isToggling
                          ? 'border-slate-700 bg-slate-800/80 text-slate-400 cursor-wait'
                          : movie.watched
                          ? 'border-emerald-800/60 bg-emerald-950/50 text-emerald-300 hover:bg-emerald-900/40 hover:border-emerald-700'
                          : 'border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:border-slate-600 hover:text-slate-200',
                      )}
                      title={movie.watched ? 'Click to mark as unwatched' : 'Click to mark as watched'}
                      aria-label={`Toggle watch status for ${movie.title}`}
                    >
                      {isToggling ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-red-400 shrink-0" />
                          <span>Updating...</span>
                        </>
                      ) : movie.watched ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span>Watched</span>
                        </>
                      ) : (
                        <>
                          <Circle className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          <span>Mark Watched</span>
                        </>
                      )}
                    </button>
                  </div>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        {movie.releaseYear}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                        {formatRuntime(movie.runtimeMinutes)}
                      </span>
                      <Badge variant={movie.watched ? 'success' : 'default'} size="sm">
                        {movie.watched ? 'Watched' : 'Unwatched'}
                      </Badge>
                    </div>

                    {/* Prerequisites preview */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                        Prerequisites ({prereqMovies.length}):
                      </span>
                      {prereqMovies.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">None (can watch directly)</p>
                      ) : (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {prereqMovies.map((prereq) => (
                            <span
                              key={prereq.id}
                              className="text-[11px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 truncate max-w-[200px]"
                              title={prereq.title}
                            >
                              {prereq.title}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onEditMovie(movie)}
                      className="gap-1.5 h-8 text-xs hover:border-slate-600"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                      Edit Movie
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
