import { apiClient } from '../../../lib/api-client';
import type { Cinema, CreateCinemaPayload, BookingQuoteResponse } from '../types/booking.types';

export const bookingApi = {
  getCinemas: () => apiClient.get<Cinema[]>('/cinemas'),
  getCinemaById: (id: string) => apiClient.get<Cinema>(`/cinemas/${id}`),
  createCinema: (payload: CreateCinemaPayload) => apiClient.post<Cinema>('/cinemas', payload),
  getBookingQuote: (cinemaId: string, groupSize: number) =>
    apiClient.get<BookingQuoteResponse>(`/cinemas/${cinemaId}/booking?groupSize=${groupSize}`),
};
