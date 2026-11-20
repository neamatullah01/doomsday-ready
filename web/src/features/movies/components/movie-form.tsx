import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { movieFormSchema, type MovieFormValues } from '../schemas/movie-form.schema';
import type { Movie } from '../types/movie.types';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { PrerequisiteSelect } from './prerequisite-select';
import { ErrorMessage } from '../../../components/feedback/ErrorMessage';

export interface MovieFormProps {
  initialData?: Movie | null;
  availableMovies: Movie[];
  onSubmit: (data: MovieFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const MovieForm: React.FC<MovieFormProps> = ({
  initialData,
  availableMovies,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [serverError, setServerError] = useState<unknown>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<MovieFormValues>({
    resolver: zodResolver(movieFormSchema),
    defaultValues: {
      title: initialData?.title ?? '',
      releaseYear: initialData?.releaseYear ?? ('' as unknown as number),
      runtimeMinutes: initialData?.runtimeMinutes ?? ('' as unknown as number),
      prerequisiteIds: initialData?.prerequisites ?? [],
    },
  });

  const handleFormSubmit = async (values: MovieFormValues) => {
    try {
      setServerError(null);
      await onSubmit(values);
    } catch (err) {
      setServerError(err);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {Boolean(serverError) && <ErrorMessage error={serverError} />}

      <Input
        label="Movie Title"
        required
        placeholder="e.g. Captain America: Civil War"
        error={errors.title?.message}
        disabled={isLoading}
        {...register('title')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Release Year"
          type="number"
          required
          min="1"
          placeholder="2016"
          error={errors.releaseYear?.message}
          disabled={isLoading}
          {...register('releaseYear')}
        />

        <Input
          label="Runtime (Minutes)"
          type="number"
          required
          min="1"
          max="300"
          placeholder="147"
          helperText="Between 1 and 300 minutes"
          error={errors.runtimeMinutes?.message}
          disabled={isLoading}
          {...register('runtimeMinutes')}
        />
      </div>

      <Controller
        name="prerequisiteIds"
        control={control}
        render={({ field }) => (
          <PrerequisiteSelect
            movies={availableMovies}
            currentMovieId={initialData?.id}
            selectedIds={field.value ?? []}
            onChange={field.onChange}
            disabled={isLoading}
          />
        )}
      />

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
        >
          {initialData ? 'Save Changes' : 'Create Movie'}
        </Button>
      </div>
    </form>
  );
};
