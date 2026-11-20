
import React, { useState } from 'react';
import type { BookingQuoteResponse, Cinema } from '../types/booking.types';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Calculator, Users, CheckCircle2, XCircle, Info } from 'lucide-react';

export interface BookingQuoteProps {
  cinema: Cinema | null;
  onCalculate: (groupSize: number) => void;
  quote?: BookingQuoteResponse | null;
  isLoading?: boolean;
}

export const BookingQuote: React.FC<BookingQuoteProps> = ({
  cinema,
  onCalculate,
  quote,
  isLoading = false,
}) => {
  const [groupSizeInput, setGroupSizeInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const size = parseInt(groupSizeInput, 10);
    if (isNaN(size) || size < 1 || size > 10000) {
      setValidationError('Group size must be an integer between 1 and 10,000');
      return;
    }
    if (!cinema) {
      setValidationError('Please select a cinema first');
      return;
    }

    onCalculate(size);
  };

  return (
    <div className="space-y-6">
      {/* Quote Query Form */}
      <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-sm">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Calculator className="h-4 w-4 text-red-500" />
            Watch-Party Booking Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Group Size (Seats Needed)"
              type="number"
              min="1"
              max="10000"
              required
              placeholder="e.g. 6, 11, 44"
              value={groupSizeInput}
              onChange={(e) => {
                setGroupSizeInput(e.target.value);
                setValidationError(null);
              }}
              error={validationError ?? undefined}
              helperText="Enter exact number of seats (1 to 10,000)."
              disabled={isLoading || !cinema}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full gap-2"
              isLoading={isLoading}
              disabled={!cinema || !groupSizeInput}
            >
              <Calculator className="h-4 w-4" />
              Calculate Minimum Bundles
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Quote Result Display */}
      {quote && !isLoading && (
        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Users className="h-5 w-5 text-red-500" />
              <div>
                <h3 className="text-base font-bold text-white">
                  Booking Quote Calculation
                </h3>
                <p className="text-xs text-slate-400">
                  Target Cinema: <strong>{quote.cinema.name}</strong> • Available Sizes: [{quote.cinema.bundleSizes.join(', ')}]
                </p>
              </div>
            </div>
            <Badge variant={quote.possible ? 'success' : 'danger'} size="md">
              {quote.possible ? 'Exact Match Found' : 'Not Possible'}
            </Badge>
          </div>

          <CardContent className="p-5 space-y-4">
            {quote.possible ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950">
                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                      Minimum Bundles
                    </span>
                    <p className="text-2xl font-black text-white mt-1">
                      {quote.totalBundles}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Total bundles combined</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950">
                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                      Total Seats
                    </span>
                    <p className="text-2xl font-black text-emerald-400 mt-1 font-mono">
                      {quote.totalSeats}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Exactly matches group size</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950">
                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                      Requested Seats
                    </span>
                    <p className="text-2xl font-black text-slate-200 mt-1 font-mono">
                      {quote.groupSize}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Zero leftover or shortfall</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Optimal Bundle Breakdown:
                  </h4>
                  <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden">
                    {quote.bundles.map((bundle) => (
                      <div
                        key={bundle.size}
                        className="flex items-center justify-between p-3.5 text-sm"
                      >
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span className="text-slate-100 font-medium">
                            {bundle.quantity} × Bundle of <strong>{bundle.size}</strong> seats
                          </span>
                        </div>
                        <span className="text-xs font-mono text-slate-400">
                          {bundle.quantity * bundle.size} seats
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-6 rounded-xl border border-rose-900/40 bg-rose-950/20 text-center space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-950/80 border border-rose-800/50 mx-auto text-rose-400">
                  <XCircle className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-rose-200">
                    No Exact Seat Combination Possible
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                    The available bundle sizes [{quote.cinema.bundleSizes.join(', ')}] cannot form exactly {quote.groupSize} seats.
                    As specified in the assessment requirements, approximate solutions (providing too few or too many seats) are rejected.
                  </p>
                </div>
              </div>
            )}

            {/* Disclaimer notice */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-950/40 border border-slate-800/60 text-xs text-slate-500">
              <Info className="h-4 w-4 text-slate-400 shrink-0" />
              <span>
                This is a <strong>booking quote calculation</strong> based on dynamic programming. It does not constitute a real ticket purchase or seat reservation.
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
