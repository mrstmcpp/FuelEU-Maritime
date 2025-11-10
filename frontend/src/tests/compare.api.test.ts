import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getRouteComparisons } from '../adaptors/infrastructure/api/compare.api';

describe('Compare API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('getRouteComparisons', () => {
    it('should fetch route comparisons', async () => {
      const mockComparisons = [
        {
          routeId: 'R001',
          ghgIntensity: 91.0,
          percentDiff: 3.41,
          compliant: false,
        },
        {
          routeId: 'R002',
          ghgIntensity: 88.0,
          percentDiff: 0,
          compliant: true,
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockComparisons }),
      });

      const result = await getRouteComparisons();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/routes/comparison'
      );
      expect(result).toEqual(mockComparisons);
      expect(result).toHaveLength(2);
    });

    it('should handle empty response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const result = await getRouteComparisons();

      expect(result).toHaveLength(0);
    });

    it('should throw error when response is not ok', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      await expect(getRouteComparisons()).rejects.toThrow(
        'Failed to fetch route comparisons'
      );
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(getRouteComparisons()).rejects.toThrow('Network error');
    });
  });
});

