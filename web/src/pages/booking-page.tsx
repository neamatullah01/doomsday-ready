import React, { useState } from 'react';
import { PageHeader } from '../components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LoadingSpinner } from '../components/feedback/LoadingSpinner';
import { ErrorMessage } from '../components/feedback/ErrorMessage';
import { EmptyState } from '../components/feedback/EmptyState';
import { useCinemas, useBookingQuote } from '../features/booking/hooks/use-booking-quote';
import { Ticket, Plus, Calculator, XCircle, Users } from 'lucide-react';

export const BookingPage: React.FC = () => {
  const { cinemas, isLoading: isLoadingCinemas, isError: isErrorCinemas, error: cinemasError, refetch } =
    useCinemas();

  const [selectedCinemaId, setSelectedCinemaId] = useState<string>('');
  const [groupSizeInput, setGroupSizeInput] = useState<string>('');
  const [activeQuery, setActiveQuery] = useState<{ cinemaId: string; groupSize: number } | null>(
    null,
  );

  const {
    data: quote,
    isLoading: isLoadingQuote,
    isError: isErrorQuote,
    error: quoteError,
  } = useBookingQuote(activeQuery?.cinemaId ?? null, activeQuery?.groupSize ?? null);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const size = parseInt(groupSizeInput, 10);
    if (!selectedCinemaId || isNaN(size) || size < 1 || size > 10000) return;
    setActiveQuery({ cinemaId: selectedCinemaId, groupSize: size });
  };

  const selectedCinema = cinemas.find((c) => c.id === selectedCinemaId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Watch-Party Booking"
        description="Calculate the exact minimum seat-bundle combination for your group using dynamic programming."
        badge={
          <Badge variant="cyan" size="md">
            {cinemas.length} {cinemas.length === 1 ? 'Cinema' : 'Cinemas'}
          </Badge>
        }
      >
        <Button variant="primary" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Cinema
        </Button>
      </PageHeader>

      {isLoadingCinemas && <LoadingSpinner label="Loading cinemas..." size="lg" />}
      {isErrorCinemas && <ErrorMessage error={cinemasError} onRetry={() => refetch()} />}

      {!isLoadingCinemas && !isErrorCinemas && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quote Calculator Form */}
          <Card className="lg:col-span-1 border-slate-800 bg-slate-900/60">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                <Calculator className="h-4 w-4 text-red-500" />
                Booking Quote Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <form onSubmit={handleCalculate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-300">
                    Cinema <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedCinemaId}
                    onChange={(e) => setSelectedCinemaId(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  >
                    <option value="">-- Select a Cinema --</option>
                    {cinemas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Bundles: {c.bundleSizes.join(', ')})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCinema && (
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1">
                    <p className="font-medium text-slate-300">Available Bundles:</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedCinema.bundleSizes.map((size) => (
                        <Badge key={size} variant="cyan" size="sm">
                          {size} seats
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Input
                  label="Group Size (seats)"
                  type="number"
                  min="1"
                  max="10000"
                  placeholder="e.g. 11, 44"
                  value={groupSizeInput}
                  onChange={(e) => setGroupSizeInput(e.target.value)}
                  required
                  helperText="Enter between 1 and 10,000 seats."
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full gap-2"
                  disabled={!selectedCinemaId || !groupSizeInput}
                  isLoading={isLoadingQuote}
                >
                  <Calculator className="h-4 w-4" />
                  Calculate Optimal Bundles
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quote Results / Display */}
          <div className="lg:col-span-2 space-y-4">
            {isErrorQuote && <ErrorMessage error={quoteError} />}

            {isLoadingQuote && (
              <LoadingSpinner label="Calculating fewest bundle combination via dynamic programming..." size="lg" />
            )}

            {!activeQuery && !isLoadingQuote && (
              <EmptyState
                icon={Ticket}
                title="No calculation requested"
                description="Select a cinema and enter your party size to calculate the exact fewest bundles required."
              />
            )}

            {quote && !isLoadingQuote && !isErrorQuote && (
              <Card className="border-slate-800 bg-slate-900/60">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                      <Users className="h-4 w-4 text-red-500" />
                      Calculation Result for {quote.cinema.name}
                    </CardTitle>
                    <Badge variant={quote.possible ? 'success' : 'danger'}>
                      {quote.possible ? 'Exact Match Found' : 'Not Possible'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-4">
                  {quote.possible ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                          <span className="text-xs text-slate-400">Total Bundles</span>
                          <p className="text-xl font-bold text-white mt-1">
                            {quote.totalBundles}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                          <span className="text-xs text-slate-400">Total Seats</span>
                          <p className="text-xl font-bold text-emerald-400 mt-1">
                            {quote.totalSeats}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                          <span className="text-xs text-slate-400">Requested Group Size</span>
                          <p className="text-xl font-bold text-slate-200 mt-1">
                            {quote.groupSize}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Bundle Allocation Breakdown:
                        </h4>
                        <div className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-950/80">
                          {quote.bundles.map((bundle) => (
                            <div
                              key={bundle.size}
                              className="flex items-center justify-between p-3 text-sm"
                            >
                              <span className="text-slate-200">
                                {bundle.quantity} × Bundle of <strong>{bundle.size}</strong> seats
                              </span>
                              <span className="text-xs text-slate-400">
                                = {bundle.quantity * bundle.size} seats
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 rounded-lg bg-rose-950/20 border border-rose-800/40 text-center space-y-2">
                      <XCircle className="h-8 w-8 text-rose-400 mx-auto" />
                      <h4 className="font-semibold text-rose-300">No Exact Combination Possible</h4>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        Cinema bundle sizes [{quote.cinema.bundleSizes.join(', ')}] cannot form exactly {quote.groupSize} seats.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
