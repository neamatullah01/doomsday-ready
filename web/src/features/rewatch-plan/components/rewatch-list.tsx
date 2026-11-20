import React from 'react';
import type { RewatchMovie } from '../types/rewatch.types';
import { Card } from '../../../components/ui/Card';
import { formatRuntime } from '../../../lib/format-runtime';
import { ListOrdered, CheckCircle2, Circle, Clock, Calendar, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface RewatchListProps {
  movies: RewatchMovie[];
  targetTitle: string;
  onToggleWatched: (movieId: string, currentWatched: boolean) => Promise<void>;
  isTogglingId?: string | null;
}

export const RewatchList: React.FC<RewatchListProps> = ({
  movies,
  targetTitle,
  onToggleWatched,
  isTogglingId,
}) => {
  if (movies.length === 0) {
    return (
      <Card className="p-8 border-slate-800 bg-slate-900/40 text-center space-y-2">
        <div className="rounded-full bg-slate-800/60 w-10 h-10 flex items-center justify-center mx-auto text-slate-400">
          <ListOrdered className="h-5 w-5" />
        </div>
        <h4 className="text-base font-semibold text-slate-200">
          No Prerequisites Required
        </h4>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          <strong>{targetTitle}</strong> has no prerequisite dependencies. You can watch it directly without needing to see any prior movie!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <ListOrdered className="h-5 w-5 text-red-500" />
          Recommended Rewatch Order for {targetTitle}
        </h3>
        <span className="text-xs text-slate-400 font-mono">
          {movies.length} {movies.length === 1 ? 'Prerequisite' : 'Prerequisites'}
        </span>
      </div>

      <div className="space-y-2.5">
        {movies.map((movie, index) => {
          const isToggling = isTogglingId === movie.id;

          return (
            <div
              key={movie.id}
              className={cn(
                'flex items-center justify-between p-4 rounded-xl border transition-all duration-150',
                movie.watched
                  ? 'border-slate-800/80 bg-slate-950/40 opacity-90'
                  : 'border-slate-800 bg-slate-900/70 hover:bg-slate-900 hover:border-slate-700',
              )}
            >
              <div className="flex items-center gap-3.5 min-w-0 pr-3">
                {/* Step / Order Badge */}
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-mono font-bold text-slate-300 ring-1 ring-slate-700">
                  {index + 1}
                </div>

                <div className="min-w-0">
                  <h4
                    className={cn(
                      'text-sm font-semibold truncate',
                      movie.watched ? 'text-slate-300 line-through decoration-slate-600' : 'text-white',
                    )}
                  >
                    {movie.title}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="h-3 w-3 text-slate-500" />
                      {movie.releaseYear}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="h-3 w-3 text-slate-500" />
                      {formatRuntime(movie.runtimeMinutes)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  disabled={isToggling}
                  onClick={() => onToggleWatched(movie.id, movie.watched)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150',
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
            </div>
          );
        })}
      </div>
    </div>
  );
};
