import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createPool,
  fetchAdjustedCBs,
  fetchAllPools,
} from '../adaptors/infrastructure/api/pool.api';

describe('Pool API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('createPool', () => {
    it('should create a pool with members', async () => {
      const mockPool = {
        id: 1,
        year: 2024,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      const mockMembers = [
        { shipId: 101, cbBefore: 500, cbAfter: 300 },
        { shipId: 202, cbBefore: -200, cbAfter: 0 },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { pool: mockPool, members: mockMembers },
        }),
      });

      const result = await createPool(2024, [
        { shipId: 101, cbBefore: 500 },
        { shipId: 202, cbBefore: -200 },
      ]);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/pools',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            year: 2024,
            members: [
              { shipId: 101, cbBefore: 500 },
              { shipId: 202, cbBefore: -200 },
            ],
          }),
        }
      );
      expect(result).toEqual({ ...mockPool, members: mockMembers });
    });

    it('should handle error response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid pool members' }),
      });

      await expect(
        createPool(2024, [{ shipId: 101, cbBefore: -1000 }])
      ).rejects.toThrow('Invalid pool members');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        createPool(2024, [{ shipId: 101, cbBefore: 500 }])
      ).rejects.toThrow('Network error');
    });
  });

  describe('fetchAdjustedCBs', () => {
    it('should fetch adjusted CBs for a year', async () => {
      const mockData = [
        { shipId: 101, adjustedCb: 500 },
        { shipId: 202, adjustedCb: -300 },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockData }),
      });

      const result = await fetchAdjustedCBs(2024);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/compliance/adjusted-cb?year=2024'
      );
      expect(result).toEqual(mockData);
    });

    it('should convert cbGco2eq to adjustedCb if needed', async () => {
      const mockData = [
        { shipId: 101, cbGco2eq: 500 },
        { shipId: 202, cbGco2eq: -300 },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockData }),
      });

      const result = await fetchAdjustedCBs(2024);

      expect(result[0].adjustedCb).toBe(500);
      expect(result[1].adjustedCb).toBe(-300);
    });

    it('should handle error response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Year not found' }),
      });

      await expect(fetchAdjustedCBs(2024)).rejects.toThrow('Year not found');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchAdjustedCBs(2024)).rejects.toThrow('Network error');
    });
  });

  describe('fetchAllPools', () => {
    it('should fetch all pools without year filter', async () => {
      const mockPools = [
        { id: 1, year: 2023 },
        { id: 2, year: 2024 },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockPools }),
      });

      const result = await fetchAllPools();

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/pools');
      expect(result).toEqual(mockPools);
    });

    it('should fetch pools filtered by year', async () => {
      const mockPools = [{ id: 2, year: 2024 }];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockPools }),
      });

      const result = await fetchAllPools(2024);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/pools?year=2024'
      );
      expect(result).toEqual(mockPools);
    });

    it('should handle empty response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const result = await fetchAllPools();

      expect(result).toHaveLength(0);
    });

    it('should handle error response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Failed to fetch' }),
      });

      await expect(fetchAllPools()).rejects.toThrow('Failed to fetch');
    });
  });
});

