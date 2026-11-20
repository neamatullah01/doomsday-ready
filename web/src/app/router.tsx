import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/app-layout';
import { MoviesPage } from '../pages/movies-page';
import { RewatchPlanPage } from '../pages/rewatch-plan-page';
import { BookingPage } from '../pages/booking-page';
import { NotFoundPage } from '../pages/not-found-page';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/movies" replace />,
      },
      {
        path: 'movies',
        element: <MoviesPage />,
      },
      {
        path: 'rewatch-plan',
        element: <RewatchPlanPage />,
      },
      {
        path: 'booking',
        element: <BookingPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
