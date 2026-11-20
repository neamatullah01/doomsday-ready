import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCinemaSchema, type CreateCinemaFormValues } from '../schemas/booking-form.schema';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { ErrorMessage } from '../../../components/feedback/ErrorMessage';
import { Plus, X } from 'lucide-react';

export interface CinemaFormProps {
  onSubmit: (values: CreateCinemaFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const CinemaForm: React.FC<CinemaFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [serverError, setServerError] = useState<unknown>(null);
  const [sizeInput, setSizeInput] = useState('');
  const [sizeInputError, setSizeInputError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateCinemaFormValues>({
    resolver: zodResolver(createCinemaSchema),
    defaultValues: {
      name: '',
      bundleSizes: [],
    },
  });

  const bundleSizes = watch('bundleSizes') || [];

  const handleAddBundleSize = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSizeInputError(null);

    const parsed = parseInt(sizeInput.trim(), 10);
    if (isNaN(parsed)) {
      setSizeInputError('Please enter a valid number');
      return;
    }
    if (parsed < 1 || parsed > 500) {
      setSizeInputError('Bundle size must be between 1 and 500');
      return;
    }
    if (bundleSizes.includes(parsed)) {
      setSizeInputError(`Bundle size ${parsed} already added`);
      return;
    }
    if (bundleSizes.length >= 10) {
      setSizeInputError('Maximum of 10 bundle sizes allowed');
      return;
    }

    const nextSizes = [...bundleSizes, parsed].sort((a, b) => a - b);
    setValue('bundleSizes', nextSizes, { shouldValidate: true });
    setSizeInput('');
  };

  const handleRemoveBundleSize = (sizeToRemove: number) => {
    const nextSizes = bundleSizes.filter((s) => s !== sizeToRemove);
    setValue('bundleSizes', nextSizes, { shouldValidate: true });
  };

  const handleFormSubmit = async (values: CreateCinemaFormValues) => {
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
        label="Cinema Name"
        required
        placeholder="e.g. IMAX Metropolis"
        error={errors.name?.message}
        disabled={isLoading}
        {...register('name')}
      />

      {/* Bundle Sizes Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">
          Seat Bundle Sizes <span className="text-red-500">*</span>
          <span className="text-xs text-slate-500 font-normal ml-2">
            (1 to 10 sizes, each 1–500)
          </span>
        </label>

        <div className="flex gap-2">
          <Input
            type="number"
            min="1"
            max="500"
            value={sizeInput}
            onChange={(e) => {
              setSizeInput(e.target.value);
              setSizeInputError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddBundleSize();
              }
            }}
            placeholder="Enter bundle size (e.g. 5)"
            disabled={isLoading || bundleSizes.length >= 10}
            className="flex-1"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleAddBundleSize}
            disabled={isLoading || !sizeInput || bundleSizes.length >= 10}
            className="shrink-0 gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Size
          </Button>
        </div>

        {sizeInputError && (
          <p className="text-xs font-medium text-rose-400">{sizeInputError}</p>
        )}
        {errors.bundleSizes && (
          <p className="text-xs font-medium text-rose-400">
            {errors.bundleSizes.message}
          </p>
        )}

        {/* Added bundle sizes list */}
        <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/80 min-h-[50px] flex flex-wrap items-center gap-1.5">
          {bundleSizes.length === 0 ? (
            <span className="text-xs text-slate-500 italic">
              No bundle sizes added yet. Add at least 1 size above.
            </span>
          ) : (
            bundleSizes.map((size) => (
              <Badge
                key={size}
                variant="cyan"
                size="sm"
                className="gap-1.5 py-1 px-2.5 text-xs bg-slate-900 border-slate-700 text-slate-200"
              >
                <span>{size} seats</span>
                <button
                  type="button"
                  onClick={() => handleRemoveBundleSize(size)}
                  disabled={isLoading}
                  className="rounded p-0.5 hover:bg-slate-800 text-slate-400 hover:text-white"
                  aria-label={`Remove bundle size ${size}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
      </div>

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
          disabled={bundleSizes.length === 0}
        >
          Create Cinema
        </Button>
      </div>
    </form>
  );
};
