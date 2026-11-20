import { computeMinimumBundles } from './minimum-bundles';

describe('computeMinimumBundles', () => {
  describe('PRD Required Test Cases', () => {
    it('Case 1: [1, 3, 4] with groupSize 6 returns two bundles of size 3 (defeating greedy 4+1+1)', () => {
      const result = computeMinimumBundles([1, 3, 4], 6);

      expect(result.possible).toBe(true);
      expect(result.totalBundles).toBe(2);
      expect(result.totalSeats).toBe(6);
      expect(result.bundles).toEqual([{ size: 3, quantity: 2 }]);
    });

    it('Case 2: [2, 5] with groupSize 11 returns four bundles: one 5 and three 2', () => {
      const result = computeMinimumBundles([2, 5], 11);

      expect(result.possible).toBe(true);
      expect(result.totalBundles).toBe(4);
      expect(result.totalSeats).toBe(11);
      expect(result.bundles).toEqual([
        { size: 5, quantity: 1 },
        { size: 2, quantity: 3 },
      ]);
    });

    it('Case 3: [6, 9, 20] with groupSize 44 returns four bundles: one 20, two 9, one 6', () => {
      const result = computeMinimumBundles([6, 9, 20], 44);

      expect(result.possible).toBe(true);
      expect(result.totalBundles).toBe(4);
      expect(result.totalSeats).toBe(44);
      expect(result.bundles).toEqual([
        { size: 20, quantity: 1 },
        { size: 9, quantity: 2 },
        { size: 6, quantity: 1 },
      ]);
    });

    it('Case 4: [4, 6] with groupSize 7 returns possible: false with null bundles and seats', () => {
      const result = computeMinimumBundles([4, 6], 7);

      expect(result.possible).toBe(false);
      expect(result.totalBundles).toBeNull();
      expect(result.bundles).toEqual([]);
      expect(result.totalSeats).toBeNull();
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('returns 1 bundle when group size exactly equals an available bundle size', () => {
      const result = computeMinimumBundles([2, 5], 5);

      expect(result.possible).toBe(true);
      expect(result.totalBundles).toBe(1);
      expect(result.totalSeats).toBe(5);
      expect(result.bundles).toEqual([{ size: 5, quantity: 1 }]);
    });

    it('handles groupSize 1 with bundle size 1', () => {
      const result = computeMinimumBundles([1, 5, 10], 1);

      expect(result.possible).toBe(true);
      expect(result.totalBundles).toBe(1);
      expect(result.totalSeats).toBe(1);
      expect(result.bundles).toEqual([{ size: 1, quantity: 1 }]);
    });

    it('handles max constraint groupSize 10,000 efficiently', () => {
      const start = Date.now();
      const result = computeMinimumBundles([6, 9, 20], 10000);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(100); // Should run in well under 100ms
      expect(result.possible).toBe(true);
      expect(result.totalSeats).toBe(10000);

      // Verify that bundle quantities sum up to total seats
      const calculatedSeats = result.bundles.reduce(
        (sum, b) => sum + b.size * b.quantity,
        0,
      );
      expect(calculatedSeats).toBe(10000);

      const calculatedTotalBundles = result.bundles.reduce(
        (sum, b) => sum + b.quantity,
        0,
      );
      expect(result.totalBundles).toBe(calculatedTotalBundles);
    });

    it('returns impossible when group size is smaller than all bundle sizes', () => {
      const result = computeMinimumBundles([5, 10], 3);

      expect(result.possible).toBe(false);
      expect(result.totalBundles).toBeNull();
      expect(result.bundles).toEqual([]);
      expect(result.totalSeats).toBeNull();
    });

    it('handles duplicate bundle sizes gracefully in input', () => {
      const result = computeMinimumBundles([3, 3, 1, 4, 4], 6);

      expect(result.possible).toBe(true);
      expect(result.totalBundles).toBe(2);
      expect(result.bundles).toEqual([{ size: 3, quantity: 2 }]);
    });

    it('handles unsorted bundle sizes correctly', () => {
      const result = computeMinimumBundles([20, 6, 9], 44);

      expect(result.possible).toBe(true);
      expect(result.totalBundles).toBe(4);
      expect(result.bundles).toEqual([
        { size: 20, quantity: 1 },
        { size: 9, quantity: 2 },
        { size: 6, quantity: 1 },
      ]);
    });

    it('returns impossible for invalid group sizes (0, negative, non-integer)', () => {
      expect(computeMinimumBundles([2, 5], 0).possible).toBe(false);
      expect(computeMinimumBundles([2, 5], -5).possible).toBe(false);
      expect(computeMinimumBundles([2, 5], 4.5).possible).toBe(false);
      expect(computeMinimumBundles([2, 5], NaN).possible).toBe(false);
    });

    it('returns impossible for empty bundle sizes array', () => {
      expect(computeMinimumBundles([], 10).possible).toBe(false);
    });
  });
});
