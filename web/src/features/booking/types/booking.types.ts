export interface Cinema {
  id: string;
  name: string;
  bundleSizes: number[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCinemaPayload {
  name: string;
  bundleSizes: number[];
}

export interface BundleItem {
  size: number;
  quantity: number;
}

export interface BookingQuoteResponse {
  cinema: {
    id: string;
    name: string;
    bundleSizes: number[];
  };
  groupSize: number;
  possible: boolean;
  totalBundles: number | null;
  bundles: BundleItem[];
  totalSeats: number | null;
}
