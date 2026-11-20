import { z } from 'zod';

export const createCinemaSchema = z.object({
  name: z.string().trim().min(1, 'Cinema name is required and cannot be empty'),
  bundleSizes: z
    .array(
      z
        .number({ invalid_type_error: 'Bundle size must be a number' })
        .int('Bundle size must be an integer')
        .min(1, 'Bundle size must be at least 1')
        .max(500, 'Bundle size cannot exceed 500'),
    )
    .min(1, 'At least 1 bundle size is required')
    .max(10, 'Cannot exceed 10 bundle sizes')
    .refine((items) => new Set(items).size === items.length, {
      message: 'Bundle sizes must be unique',
    }),
});

export type CreateCinemaFormValues = z.infer<typeof createCinemaSchema>;

export const bookingQuoteSchema = z.object({
  cinemaId: z.string().uuid('Please select a valid cinema'),
  groupSize: z
    .coerce
    .number({ invalid_type_error: 'Group size must be a number' })
    .int('Group size must be an integer')
    .min(1, 'Group size must be at least 1')
    .max(10000, 'Group size cannot exceed 10,000'),
});

export type BookingQuoteFormValues = z.infer<typeof bookingQuoteSchema>;
