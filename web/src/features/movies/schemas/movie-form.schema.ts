import { z } from 'zod';

export const movieFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required and cannot be empty'),
  releaseYear: z
    .coerce
    .number({ invalid_type_error: 'Release year must be a number' })
    .int('Release year must be an integer')
    .positive('Release year must be a positive integer'),
  runtimeMinutes: z
    .coerce
    .number({ invalid_type_error: 'Runtime must be a number' })
    .int('Runtime must be an integer')
    .min(1, 'Runtime must be at least 1 minute')
    .max(300, 'Runtime must be between 1 and 300 minutes'),
  prerequisiteIds: z.array(z.string().uuid()).default([]),
});

export type MovieFormValues = z.infer<typeof movieFormSchema>;
