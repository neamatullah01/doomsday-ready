import React from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { AlertCircle } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <div className="rounded-full bg-red-950/40 p-4 border border-red-800/50">
        <AlertCircle className="h-10 w-10 text-red-500" />
      </div>
      <h1 className="text-3xl font-extrabold text-white">404 - Page Not Found</h1>
      <p className="text-sm text-slate-400 max-w-md">
        The page you are looking for does not exist in the Doomsday Ready planning portal.
      </p>
      <NavLink to="/movies">
        <Button variant="primary">Return to Movies</Button>
      </NavLink>
    </div>
  );
};
