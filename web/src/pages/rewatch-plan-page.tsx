import React, { useState } from 'react';
import { PageHeader } from '../components/shared/PageHeader';
import { LoadingSpinner } from '../components/feedback/LoadingSpinner';
import { ErrorMessage } from '../components/feedback/ErrorMessage';
import { EmptyState } from '../components/feedback/EmptyState';
import { TargetMovieSelect } from '../features/rewatch-plan/components/target-movie-select';
import { WatchProgress } from '../features/rewatch-plan/components/watch-progress';
import { RewatchList } from '../features/rewatch-plan/components/rewatch-list';
import { useMovies } from '../features/movies/hooks/use-movies';
import { useRewatchPlan } from '../features/rewatch-plan/hooks/use-rewatch-plan';
import { ListOrdered } from 'lucide-react';

export const RewatchPlanPage: React.FC = () => {
  const { movies, isLoading: isLoadingMovies, toggleWatched } = useMovies();
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const {
    data: plan,
    isLoading: isLoadingPlan,
    isError,
    error,
    refetch,
  } = useRewatchPlan(selectedTargetId || null);

  const handleToggleWatched = async (movieId: string, currentWatched: boolean) => {
    try {
      setTogglingId(movieId);
      await toggleWatched({ id: movieId, watched: !currentWatched });
      // useMovies automatically invalidates both 'movies' and 'rewatch-plan'
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rewatch Plan"
        description="Select a target MCU movie to calculate all transitive prerequisites in prerequisite-first order, track watched progress, and calculate remaining runtime."
      />

      {/* Target Movie Selector */}
      <TargetMovieSelect
        movies={movies}
        selectedTargetId={selectedTargetId}
        onSelectTarget={(id) => setSelectedTargetId(id)}
        isLoading={isLoadingMovies}
      />

      {/* Loading state for Plan */}
      {isLoadingPlan && (
        <LoadingSpinner
          label="Calculating prerequisite dependency graph and topological watch order..."
          size="lg"
        />
      )}

      {/* Error state */}
      {isError && <ErrorMessage error={error} onRetry={() => refetch()} />}

      {/* Empty State when no movie selected */}
      {!selectedTargetId && !isLoadingPlan && (
        <EmptyState
          icon={ListOrdered}
          title="No target movie selected"
          description="Choose a movie above (such as Avengers: Doomsday or Captain America: Civil War) to view its prerequisite roadmap."
        />
      )}

      {/* Plan Details (when movie is selected & plan loaded) */}
      {plan && !isLoadingPlan && !isError && (
        <div className="space-y-6">
          <WatchProgress plan={plan} />

          <RewatchList
            movies={plan.movies}
            targetTitle={plan.targetMovie.title}
            onToggleWatched={handleToggleWatched}
            isTogglingId={togglingId}
          />
        </div>
      )}
    </div>
  );
};
