import React, { useState } from 'react';
import { PageHeader } from '../components/shared/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/feedback/LoadingSpinner';
import { ErrorMessage } from '../components/feedback/ErrorMessage';
import { EmptyState } from '../components/feedback/EmptyState';
import { MovieList } from '../features/movies/components/movie-list';
import { MovieForm } from '../features/movies/components/movie-form';
import { useMovies } from '../features/movies/hooks/use-movies';
import type { Movie } from '../features/movies/types/movie.types';
import type { MovieFormValues } from '../features/movies/schemas/movie-form.schema';
import { Film, Plus } from 'lucide-react';

export const MoviesPage: React.FC = () => {
  const {
    movies,
    isLoading,
    isError,
    error,
    refetch,
    createMovie,
    isCreating,
    updateMovie,
    isUpdating,
    toggleWatched,
  } = useMovies();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleCreateMovie = async (values: MovieFormValues) => {
    await createMovie({
      title: values.title,
      releaseYear: values.releaseYear,
      runtimeMinutes: values.runtimeMinutes,
      prerequisiteIds: values.prerequisiteIds,
    });
    setIsAddModalOpen(false);
  };

  const handleUpdateMovie = async (values: MovieFormValues) => {
    if (!editingMovie) return;
    await updateMovie({
      id: editingMovie.id,
      payload: {
        title: values.title,
        releaseYear: values.releaseYear,
        runtimeMinutes: values.runtimeMinutes,
        prerequisiteIds: values.prerequisiteIds,
      },
    });
    setEditingMovie(null);
  };

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
        description="Manage Marvel Cinematic Universe movies, configure prerequisite watch dependencies, and track your progress."
        badge={
          <Badge variant="cyan" size="md">
            {movies.length} {movies.length === 1 ? 'Movie' : 'Movies'}
          </Badge>
        }
      >
        <Button
          variant="primary"
          onClick={() => setIsAddModalOpen(true)}
          className="gap-2 shadow-lg shadow-red-900/20"
        >
          <Plus className="h-4 w-4" />
          Add Movie
        </Button>
      </PageHeader>

      {isLoading && <LoadingSpinner label="Loading MCU movies from API..." size="lg" />}

      {isError && <ErrorMessage error={error} onRetry={() => refetch()} />}

      {!isLoading && !isError && movies.length === 0 && (
        <EmptyState
          icon={Film}
          title="No movies found"
          description="Your MCU library is empty. Click below to add a movie or run the database seed."
          actionLabel="Add Movie"
          onAction={() => setIsAddModalOpen(true)}
        />
      )}

      {!isLoading && !isError && movies.length > 0 && (
        <MovieList
          movies={movies}
          onEditMovie={(movie) => setEditingMovie(movie)}
          onToggleWatched={handleToggleWatched}
          isTogglingId={togglingId}
        />
      )}

      {/* Add Movie Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add MCU Movie"
        description="Add a new movie and define any movies that must be watched prior."
        icon={<Film className="h-5 w-5 text-red-500" />}
        maxWidth="lg"
      >
        <MovieForm
          availableMovies={movies}
          onSubmit={handleCreateMovie}
          onCancel={() => setIsAddModalOpen(false)}
          isLoading={isCreating}
        />
      </Modal>

      {/* Edit Movie Modal */}
      <Modal
        isOpen={Boolean(editingMovie)}
        onClose={() => setEditingMovie(null)}
        title={editingMovie ? `Edit "${editingMovie.title}"` : 'Edit Movie'}
        description="Update movie details or reconfigure prerequisite watch dependencies."
        icon={<Film className="h-5 w-5 text-red-500" />}
        maxWidth="lg"
      >
        {editingMovie && (
          <MovieForm
            initialData={editingMovie}
            availableMovies={movies}
            onSubmit={handleUpdateMovie}
            onCancel={() => setEditingMovie(null)}
            isLoading={isUpdating}
          />
        )}
      </Modal>
    </div>
  );
};
