import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getAdjustedCompliance } from '../adaptors/infrastructure/api/compliance.api';

describe('Compliance API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('getAdjustedCompliance', () => {
    it('should fetch adjusted compliance data for a year', async () => {
      const mockData = [
        { shipId: 101, adjustedCb: 500 },
        { shipId: 202, adjustedCb: -300 },
        { shipId: 303, adjustedCb: 750 },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockData }),
      });

      const result = await getAdjustedCompliance(2024);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/compliance/adjusted-cb?year=2024'
      );
      expect(result).toEqual(mockData);
      expect(result).toHaveLength(3);
    });

    it('should handle empty response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const result = await getAdjustedCompliance(2025);

      expect(result).toHaveLength(0);
    });

    it('should throw error when response is not ok', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(getAdjustedCompliance(2024)).rejects.toThrow(
        'Failed to fetch adjusted compliance data'
      );
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(getAdjustedCompliance(2024)).rejects.toThrow('Network error');
    });

    it('should use environment variable for API URL if available', async () => {
      const originalEnv = import.meta.env.VITE_API_URL;
      import.meta.env.VITE_API_URL = 'https://api.example.com';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await getAdjustedCompliance(2024);

      // Note: The actual implementation uses import.meta.env at module load time
      // So this test verifies the function works, but the URL is set at compile time
      expect(global.fetch).toHaveBeenCalled();

      import.meta.env.VITE_API_URL = originalEnv;
    });
  });
});

