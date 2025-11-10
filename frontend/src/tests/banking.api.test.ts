import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getBankingRecords,
  bankPositiveCB,
  applyBanking,
} from '../adaptors/infrastructure/api/banking.api';

describe('Banking API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('getBankingRecords', () => {
    it('should fetch banking records for a ship', async () => {
      const mockRecords = [
        { id: 1, shipId: 101, year: 2023, amountGco2eq: 500 },
        { id: 2, shipId: 101, year: 2024, amountGco2eq: 300 },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockRecords }),
      });

      const result = await getBankingRecords(101);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/banking/records?shipId=101'
      );
      expect(result).toEqual(mockRecords);
      expect(result).toHaveLength(2);
    });

    it('should fetch banking records with year filter', async () => {
      const mockRecords = [{ id: 1, shipId: 101, year: 2024, amountGco2eq: 300 }];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockRecords }),
      });

      const result = await getBankingRecords(101, 2024);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/banking/records?shipId=101&year=2024'
      );
      expect(result).toEqual(mockRecords);
    });

    it('should throw error when response is not ok', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(getBankingRecords(101)).rejects.toThrow(
        'Failed to fetch banking records'
      );
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(getBankingRecords(101)).rejects.toThrow('Network error');
    });
  });

  describe('bankPositiveCB', () => {
    it('should bank positive CB', async () => {
      const mockResponse = {
        id: 1,
        shipId: 101,
        year: 2024,
        amountGco2eq: 500,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await bankPositiveCB(101, 2024, 500);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/banking/bank',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shipId: 101, year: 2024, amountGco2eq: 500 }),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when response is not ok', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      await expect(bankPositiveCB(101, 2024, 500)).rejects.toThrow('Failed to bank CB');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(bankPositiveCB(101, 2024, 500)).rejects.toThrow('Network error');
    });
  });

  describe('applyBanking', () => {
    it('should apply banked CB to offset deficit', async () => {
      const mockResponse = {
        applied: 300,
        remaining: 0,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await applyBanking(101, 300);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/banking/apply',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shipId: 101, applyAmount: 300 }),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when response is not ok', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      await expect(applyBanking(101, 300)).rejects.toThrow('Failed to apply banking');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(applyBanking(101, 300)).rejects.toThrow('Network error');
    });
  });
});

