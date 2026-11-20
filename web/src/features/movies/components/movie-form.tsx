import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { movieFormSchema, type MovieFormValues } from '../schemas/movie-form.schema';
import type { Movie } from '../types/movie.types';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { PrerequisiteSelect } from './prerequisite-select';
import { ErrorMessage } from '../../../components/feedback/ErrorMessage';
import { Save, Plus } from 'lucide-react';

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
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col">
      {/* Scrollable Form Content */}
      <div className="space-y-4">
        {Boolean(serverError) && (
          <div className="animate-in fade-in duration-200">
            <ErrorMessage error={serverError} />
          </div>
        )}

        <div className="space-y-1">
          <Input
            label="Movie Title"
            required
            placeholder="e.g. Captain America: Civil War"
            error={errors.title?.message}
            disabled={isLoading}
            className="bg-slate-950/80 border-slate-700/80 focus:border-red-500 focus:ring-red-500/30"
            {...register('title')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Release Year"
            type="number"
            required
            min="1"
            placeholder="e.g. 2016"
            error={errors.releaseYear?.message}
            disabled={isLoading}
            className="bg-slate-950/80 border-slate-700/80 focus:border-red-500 focus:ring-red-500/30"
            {...register('releaseYear')}
          />

          <Input
            label="Runtime (Minutes)"
            type="number"
            required
            min="1"
            max="300"
            placeholder="e.g. 147"
            helperText="Constraint: 1 to 300 minutes"
            error={errors.runtimeMinutes?.message}
            disabled={isLoading}
            className="bg-slate-950/80 border-slate-700/80 focus:border-red-500 focus:ring-red-500/30"
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
      </div>

      {/* Sticky Action Footer (Always pinned visible at the bottom) */}
      <div className="sticky -bottom-5 -mx-5 sm:-mx-6 -mb-5 px-5 sm:px-6 py-4 mt-6 border-t border-slate-800/90 bg-slate-950/95 backdrop-blur-md flex items-center justify-end gap-3 z-20 shadow-xl shadow-black/80">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="border-slate-700 hover:bg-slate-800 text-slate-300"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="shadow-lg shadow-red-950/60 font-semibold gap-1.5"
        >
          {initialData ? (
            <>
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>Create Movie</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
