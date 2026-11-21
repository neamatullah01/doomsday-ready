export interface BundleAllocation {
  size: number;
  quantity: number;
}

export interface MinimumBundlesResult {
  possible: boolean;
  totalBundles: number | null;
  bundles: BundleAllocation[];
  totalSeats: number | null;
}

const notPossible = (): MinimumBundlesResult => ({
  possible: false,
  totalBundles: null,
  bundles: [],
  totalSeats: null,
});

export function computeMinimumBundles(
  bundleSizes: number[],
  groupSize: number,
): MinimumBundlesResult {
  const sizes = [...new Set(bundleSizes)].sort((a, b) => b - a);

  const dp = new Array<number>(groupSize + 1).fill(Infinity);
  const lastBundle = new Array<number>(groupSize + 1).fill(0);
  dp[0] = 0;

  for (let seats = 1; seats <= groupSize; seats++) {
    for (const size of sizes) {
      if (size <= seats && dp[seats - size] + 1 < dp[seats]) {
        dp[seats] = dp[seats - size] + 1;
        lastBundle[seats] = size;
      }
    }
  }

  if (dp[groupSize] === Infinity) return notPossible();

  const counts = new Map<number, number>();
  for (let seats = groupSize; seats > 0; seats -= lastBundle[seats]) {
    counts.set(lastBundle[seats], (counts.get(lastBundle[seats]) ?? 0) + 1);
  }

  const bundles = [...counts]
    .map(([size, quantity]) => ({ size, quantity }))
    .sort((a, b) => b.size - a.size);

  return {
    possible: true,
    totalBundles: dp[groupSize],
    bundles,
    totalSeats: groupSize,
  };
}
