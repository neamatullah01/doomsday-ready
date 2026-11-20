import React, { useState } from 'react';
import { PageHeader } from '../components/shared/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/feedback/LoadingSpinner';
import { ErrorMessage } from '../components/feedback/ErrorMessage';
import { EmptyState } from '../components/feedback/EmptyState';
import { CinemaSelect } from '../features/booking/components/cinema-select';
import { CinemaForm } from '../features/booking/components/cinema-form';
import { BookingQuote } from '../features/booking/components/booking-quote';
import { useCinemas, useBookingQuote } from '../features/booking/hooks/use-booking-quote';
import type { CreateCinemaFormValues } from '../features/booking/schemas/booking-form.schema';
import { Ticket, Plus } from 'lucide-react';

export const BookingPage: React.FC = () => {
  const {
    cinemas,
    isLoading: isLoadingCinemas,
    isError: isErrorCinemas,
    error: cinemasError,
    refetch,
    createCinema,
    isCreating,
  } = useCinemas();

  const [isAddCinemaModalOpen, setIsAddCinemaModalOpen] = useState(false);
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>('');
  const [activeCalculation, setActiveCalculation] = useState<{
    cinemaId: string;
    groupSize: number;
  } | null>(null);

  const {
    data: quote,
    isLoading: isLoadingQuote,
    isError: isErrorQuote,
    error: quoteError,
  } = useBookingQuote(
    activeCalculation?.cinemaId ?? null,
    activeCalculation?.groupSize ?? null,
  );

  const handleCreateCinema = async (values: CreateCinemaFormValues) => {
    const created = await createCinema({
      name: values.name,
      bundleSizes: values.bundleSizes,
    });
    setIsAddCinemaModalOpen(false);
    if (created?.id) {
      setSelectedCinemaId(created.id);
    }
  };

  const handleCalculateQuote = (groupSize: number) => {
    if (!selectedCinemaId) return;
    setActiveCalculation({ cinemaId: selectedCinemaId, groupSize });
  };

  const selectedCinema = cinemas.find((c) => c.id === selectedCinemaId) || null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Watch-Party Booking"
        description="Calculate the exact minimum seat-bundle combination for your group using unbounded dynamic programming."
        badge={
          <Badge variant="cyan" size="md">
            {cinemas.length} {cinemas.length === 1 ? 'Cinema' : 'Cinemas'}
          </Badge>
        }
      >
        <Button
          variant="primary"
          onClick={() => setIsAddCinemaModalOpen(true)}
          className="gap-2 shadow-lg shadow-red-900/20"
        >
          <Plus className="h-4 w-4" />
          Add Cinema
        </Button>
      </PageHeader>

      {isLoadingCinemas && <LoadingSpinner label="Loading cinemas from API..." size="lg" />}

      {isErrorCinemas && <ErrorMessage error={cinemasError} onRetry={() => refetch()} />}

      {!isLoadingCinemas && !isErrorCinemas && cinemas.length === 0 && (
        <EmptyState
          icon={Ticket}
          title="No cinemas available"
          description="Create your first cinema with its available seat-bundle sizes to begin calculating watch-party bookings."
          actionLabel="Add Cinema"
          onAction={() => setIsAddCinemaModalOpen(true)}
        />
      )}

      {!isLoadingCinemas && !isErrorCinemas && cinemas.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Cinema Selector */}
          <div className="lg:col-span-1 space-y-4">
            <CinemaSelect
              cinemas={cinemas}
              selectedCinemaId={selectedCinemaId}
              onSelectCinema={(id) => {
                setSelectedCinemaId(id);
                // Clear active calculation if switching cinema
                if (activeCalculation?.cinemaId !== id) {
                  setActiveCalculation(null);
                }
              }}
            />
          </div>

          {/* Right Column: Booking Calculator & Quote Results */}
          <div className="lg:col-span-2 space-y-4">
            {isErrorQuote && <ErrorMessage error={quoteError} />}

            {isLoadingQuote && (
              <LoadingSpinner
                label="Solving unbounded minimum-bundle dynamic programming algorithm..."
                size="lg"
              />
            )}

            <BookingQuote
              cinema={selectedCinema}
              onCalculate={handleCalculateQuote}
              quote={quote}
              isLoading={isLoadingQuote}
            />
          </div>
        </div>
      )}

      {/* Add Cinema Modal */}
      <Modal
        isOpen={isAddCinemaModalOpen}
        onClose={() => setIsAddCinemaModalOpen(false)}
        title="Add Cinema & Seat Bundles"
        description="Register a new cinema and specify its available bundle sizes (1–500 seats each)."
        icon={<Ticket className="h-5 w-5 text-red-500" />}
        maxWidth="md"
      >
        <CinemaForm
          onSubmit={handleCreateCinema}
          onCancel={() => setIsAddCinemaModalOpen(false)}
          isLoading={isCreating}
        />
      </Modal>
    </div>
  );
};
