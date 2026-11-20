import React from 'react';
import type { Cinema } from '../types/booking.types';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Ticket } from 'lucide-react';

export interface CinemaSelectProps {
  cinemas: Cinema[];
  selectedCinemaId: string;
  onSelectCinema: (id: string) => void;
  disabled?: boolean;
}

export const CinemaSelect: React.FC<CinemaSelectProps> = ({
  cinemas,
  selectedCinemaId,
  onSelectCinema,
  disabled = false,
}) => {
  const selectedCinema = cinemas.find((c) => c.id === selectedCinemaId);

  return (
    <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-sm">
      <CardHeader className="p-5 pb-3">
        <CardTitle className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <Ticket className="h-4 w-4 text-red-500" />
          Choose Cinema
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0 space-y-3">
        <div className="space-y-1.5">
          <label htmlFor="cinema-dropdown" className="sr-only">
            Cinema
          </label>
          <select
            id="cinema-dropdown"
            value={selectedCinemaId}
            onChange={(e) => onSelectCinema(e.target.value)}
            disabled={disabled}
            className="flex h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/80 focus:border-red-500/80"
          >
            <option value="">-- Select a Cinema --</option>
            {cinemas.map((cinema) => (
              <option key={cinema.id} value={cinema.id}>
                {cinema.name} (Bundles: [{cinema.bundleSizes.join(', ')}])
              </option>
            ))}
          </select>
        </div>

        {selectedCinema && (
          <div className="p-3.5 rounded-lg border border-slate-800/80 bg-slate-950/60 space-y-1.5">
            <span className="text-xs text-slate-400 font-medium">Available Seat Bundles:</span>
            <div className="flex flex-wrap gap-1.5">
              {selectedCinema.bundleSizes.map((size) => (
                <Badge
                  key={size}
                  variant="cyan"
                  size="sm"
                  className="font-mono text-xs bg-slate-900 text-slate-200 border-slate-700"
                >
                  {size} seats
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
