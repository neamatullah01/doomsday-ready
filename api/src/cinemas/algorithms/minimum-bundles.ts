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

/**
 * Computes the minimum number of seat bundles required to seat exactly `groupSize` people
 * using an unbounded dynamic programming approach (minimum coin change).
 *
 * @param bundleSizes Array of available bundle sizes (e.g. [2, 5] or [6, 9, 20])
 * @param groupSize The exact group size needed (integer >= 1)
 * @returns MinimumBundlesResult detailing whether it is possible, total bundles, and breakdown
 */
export function computeMinimumBundles(
  bundleSizes: number[],
  groupSize: number,
): MinimumBundlesResult {
  // Validate basic parameters
  if (
    !Number.isInteger(groupSize) ||
    groupSize < 1 ||
    !Array.isArray(bundleSizes) ||
    bundleSizes.length === 0
  ) {
    return {
      possible: false,
      totalBundles: null,
      bundles: [],
      totalSeats: null,
    };
  }

  // Filter valid positive integer bundle sizes and deduplicate
  const validSizes = Array.from(
    new Set(
      bundleSizes.filter((s) => Number.isInteger(s) && s > 0 && s <= 500),
    ),
  );

  if (validSizes.length === 0) {
    return {
      possible: false,
      totalBundles: null,
      bundles: [],
      totalSeats: null,
    };
  }

  // Sort bundle sizes descending to naturally prefer larger bundles when tie-breaking
  validSizes.sort((a, b) => b - a);

  // dp[x] represents the minimum number of bundles needed to form exactly x seats
  // parentBundle[x] stores the bundle size used in the optimal transition to reach x
  const dp: number[] = Array.from({ length: groupSize + 1 }, () => Infinity);
  const parentBundle: number[] = Array.from({ length: groupSize + 1 }, () => -1);

  dp[0] = 0;

  for (let x = 1; x <= groupSize; x++) {
    for (const size of validSizes) {
      if (x >= size && dp[x - size] !== Infinity) {
        const candidateBundles = dp[x - size] + 1;
        if (candidateBundles < dp[x]) {
          dp[x] = candidateBundles;
          parentBundle[x] = size;
        }
      }
    }
  }

  // If the target groupSize state is unreachable, no exact combination exists
  if (dp[groupSize] === Infinity) {
    return {
      possible: false,
      totalBundles: null,
      bundles: [],
      totalSeats: null,
    };
  }

  // Backtrack to count the quantity of each bundle size used
  const bundleCounts = new Map<number, number>();
  let current = groupSize;

  while (current > 0) {
    const size = parentBundle[current];
    if (size <= 0) {
      // Defensive fallback in case of corrupted backtrack state
      return {
        possible: false,
        totalBundles: null,
        bundles: [],
        totalSeats: null,
      };
    }
    bundleCounts.set(size, (bundleCounts.get(size) || 0) + 1);
    current -= size;
  }

  // Format bundle breakdown sorted descending by size
  const bundles: BundleAllocation[] = Array.from(bundleCounts.entries())
    .map(([size, quantity]) => ({ size, quantity }))
    .sort((a, b) => b.size - a.size);

  return {
    possible: true,
    totalBundles: dp[groupSize],
    bundles,
    totalSeats: groupSize,
  };
}
