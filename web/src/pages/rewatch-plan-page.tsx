import React, { useState } from 'react';
import { PageHeader } from '../components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { LoadingSpinner } from '../components/feedback/LoadingSpinner';
import { ErrorMessage } from '../components/feedback/ErrorMessage';
import { EmptyState } from '../components/feedback/EmptyState';
import { useMovies } from '../features/movies/hooks/use-movies';
import { useRewatchPlan } from '../features/rewatch-plan/hooks/use-rewatch-plan';
import { formatRuntime } from '../lib/format-runtime';
import { ListOrdered, Clock, CheckCircle2, Circle, Film } from 'lucide-react';

export const RewatchPlanPage: React.FC = () => {
  const { movies, isLoading: isLoadingMovies } = useMovies();
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');

  const {
    data: plan,
    isLoading: isLoadingPlan,
    isError,
    error,
    refetch,
  } = useRewatchPlan(selectedTargetId || null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rewatch Plan"
        description="Select a target MCU movie to calculate all transitive prerequisites in valid watch order, track progress, and view remaining runtime."
      />

      {/* Target Movie Selector */}
      <Card className="border-slate-800 bg-slate-900/80">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-base text-slate-200 flex items-center gap-2">
            <Film className="h-4 w-4 text-red-500" />
            Select Target Movie
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              disabled={isLoadingMovies}
              className="flex h-10 w-full sm:max-w-md rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Target movie selector"
            >
              <option value="">-- Choose a target movie (e.g. Avengers: Doomsday) --</option>
              {movies.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.releaseYear})
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Loading & Error States */}
      {isLoadingPlan && <LoadingSpinner label="Calculating prerequisite rewatch order..." size="lg" />}
      {isError && <ErrorMessage error={error} onRetry={() => refetch()} />}

      {/* No selection state */}
      {!selectedTargetId && !isLoadingPlan && (
        <EmptyState
          icon={ListOrdered}
          title="No target movie selected"
          description="Choose an MCU movie above to see its prerequisite-first roadmap and watch progress."
        />
      )}

      {/* Plan Details */}
      {plan && !isLoadingPlan && !isError && (
        <div className="space-y-6">
          {/* Summary Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 border-slate-800">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                Watched Progress
              </span>
              <p className="text-2xl font-bold text-white mt-1">
                {plan.watchedCount} / {plan.totalCount}
              </p>
              <p className="text-xs text-slate-500 mt-1">Prerequisites completed</p>
            </Card>

            <Card className="p-4 border-slate-800">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                Unwatched
              </span>
              <p className="text-2xl font-bold text-amber-400 mt-1">
                {plan.unwatchedCount}
              </p>
              <p className="text-xs text-slate-500 mt-1">Movies remaining</p>
            </Card>

            <Card className="p-4 border-slate-800">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                Remaining Runtime
              </span>
              <p className="text-2xl font-bold text-red-400 mt-1 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {formatRuntime(plan.remainingRuntimeMinutes)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Total unwatched minutes</p>
            </Card>
          </div>

          {/* Progress Bar */}
          <Card className="p-5 border-slate-800">
            <ProgressBar
              value={plan.watchedCount}
              max={plan.totalCount}
              label={`${plan.watchedCount} of ${plan.totalCount} watched`}
            />
          </Card>

          {/* Prerequisite List */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <ListOrdered className="h-5 w-5 text-red-500" />
              Prerequisite Order for {plan.targetMovie.title}
            </h3>

            {plan.movies.length === 0 ? (
              <Card className="p-6 border-slate-800 text-center">
                <p className="text-sm text-slate-400">
                  {plan.targetMovie.title} has no prerequisites. You can watch it directly!
                </p>
              </Card>
            ) : (
              <div className="space-y-2">
                {plan.movies.map((movie, index) => (
                  <div
                    key={movie.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-xs font-mono text-slate-400 font-semibold">
                        {index + 1}
                      </span>
                      <div>
                        <h4 className="text-sm font-semibold text-white">{movie.title}</h4>
                        <span className="text-xs text-slate-400">
                          {movie.releaseYear} • {formatRuntime(movie.runtimeMinutes)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={movie.watched ? 'success' : 'default'} size="sm">
                        {movie.watched ? 'Watched' : 'Unwatched'}
                      </Badge>
                      {movie.watched ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Circle className="h-4 w-4 text-slate-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
