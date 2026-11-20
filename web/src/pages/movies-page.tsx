import React, { useState } from 'react';
import { PageHeader } from '../components/shared/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { LoadingSpinner } from '../components/feedback/LoadingSpinner';
import { ErrorMessage } from '../components/feedback/ErrorMessage';
import { EmptyState } from '../components/feedback/EmptyState';
import { useMovies } from '../features/movies/hooks/use-movies';
import { formatRuntime } from '../lib/format-runtime';
import { Film, Plus, CheckCircle2, Circle, Clock, Calendar } from 'lucide-react';

export const MoviesPage: React.FC = () => {
  const { movies, isLoading, isError, error, refetch, toggleWatched, isTogglingWatched } =
    useMovies();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggleWatched = async (id: string, currentWatched: boolean) => {
    try {
      setTogglingId(id);
      await toggleWatched({ id, watched: !currentWatched });
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="MCU Movies"
        description="Manage Marvel Cinematic Universe movies, configure prerequisite watch chains, and track your progress."
        badge={
          <Badge variant="cyan" size="md">
            {movies.length} {movies.length === 1 ? 'Movie' : 'Movies'}
          </Badge>
        }
      >
        <Button variant="primary" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Movie
        </Button>
      </PageHeader>

      {isLoading && <LoadingSpinner label="Loading movies from database..." size="lg" />}

      {isError && <ErrorMessage error={error} onRetry={() => refetch()} />}

      {!isLoading && !isError && movies.length === 0 && (
        <EmptyState
          icon={Film}
          title="No movies found"
          description="Your MCU library is empty. Start by adding your first movie or run the backend database seed."
          actionLabel="Add First Movie"
          onAction={() => {}}
        />
      )}

      {!isLoading && !isError && movies.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {movies.map((movie) => {
            const isToggling = isTogglingWatched && togglingId === movie.id;

            return (
              <Card
                key={movie.id}
                className="group border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 transition-all duration-200"
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base font-bold text-white group-hover:text-red-400 transition-colors">
                      {movie.title}
                    </CardTitle>
                    <button
                      type="button"
                      disabled={isToggling}
                      onClick={() => handleToggleWatched(movie.id, movie.watched)}
                      className="shrink-0 p-1 text-slate-400 hover:text-white transition-colors focus:outline-none"
                      title={movie.watched ? 'Mark as unwatched' : 'Mark as watched'}
                      aria-label={`Toggle watch status for ${movie.title}`}
                    >
                      {movie.watched ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400 hover:text-emerald-300" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-500 hover:text-slate-300" />
                      )}
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-3">
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      {movie.releaseYear}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      {formatRuntime(movie.runtimeMinutes)}
                    </span>
                    <Badge variant={movie.watched ? 'success' : 'default'} size="sm">
                      {movie.watched ? 'Watched' : 'Unwatched'}
                    </Badge>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span>
                      Prerequisites:{' '}
                      <strong className="text-slate-200">
                        {movie.prerequisites?.length || 0}
                      </strong>
                    </span>
                    <Button variant="ghost" size="sm" className="h-7 text-xs px-2">
                      Edit
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
