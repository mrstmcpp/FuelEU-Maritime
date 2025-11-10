import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getAllRoutes, setBaseline, compareRoutes } from '../adaptors/infrastructure/api/route.api';
import { mapRouteResponse } from '../adaptors/infrastructure/mappers/route.mapper';

// Mock the mapper
vi.mock('../adaptors/infrastructure/mappers/route.mapper', () => ({
  mapRouteResponse: vi.fn((r) => ({
    id: r.id,
    routeId: r.route_id || r.routeId,
    vesselType: r.vesselType || r.vessel_type || 'N/A',
    fuelType: r.fuelType || r.fuel_type || 'N/A',
    year: r.year,
    ghgIntensity: Number(r.ghg_intensity ?? r.ghgIntensity),
    fuelConsumption: Number(r.fuelConsumption ?? r.fuel_consumption ?? 0),
    distance: Number(r.distance ?? 0),
    totalEmissions: Number(r.totalEmissions ?? r.total_emissions ?? 0),
    isBaseline: Boolean(r.is_baseline ?? r.isBaseline),
  })),
}));

describe('Route API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('getAllRoutes', () => {
    it('should fetch all routes without query', async () => {
      const mockRoutes = [
        { id: 1, route_id: 'R001', year: 2024, ghg_intensity: 91.0 },
        { id: 2, route_id: 'R002', year: 2024, ghg_intensity: 88.0 },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        json: async () => ({ data: mockRoutes }),
      });

      const result = await getAllRoutes();

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/routes');
      expect(mapRouteResponse).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });

    it('should fetch routes with query parameters', async () => {
      const mockRoutes = [{ id: 1, route_id: 'R001', year: 2024, ghg_intensity: 91.0 }];

      (global.fetch as any).mockResolvedValueOnce({
        json: async () => ({ data: mockRoutes }),
      });

      const result = await getAllRoutes('year=2024&vesselType=Container');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/routes?year=2024&vesselType=Container'
      );
      expect(result).toHaveLength(1);
    });

    it('should handle empty response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        json: async () => ({ data: [] }),
      });

      const result = await getAllRoutes();

      expect(result).toHaveLength(0);
    });

    it('should handle fetch errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(getAllRoutes()).rejects.toThrow('Network error');
    });
  });

  describe('setBaseline', () => {
    it('should set baseline route', async () => {
      const mockRoute = {
        id: 1,
        route_id: 'R001',
        year: 2024,
        ghg_intensity: 91.0,
        is_baseline: true,
      };

      (global.fetch as any).mockResolvedValueOnce({
        json: async () => ({ data: mockRoute }),
      });

      const result = await setBaseline('R001');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/routes/R001/baseline',
        { method: 'POST' }
      );
      expect(mapRouteResponse).toHaveBeenCalledWith(mockRoute);
      expect(result).toBeDefined();
    });

    it('should handle errors when setting baseline', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Route not found'));

      await expect(setBaseline('INVALID')).rejects.toThrow('Route not found');
    });
  });

  describe('compareRoutes', () => {
    it('should fetch route comparison data', async () => {
      const mockComparison = [
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
        json: async () => ({ data: mockComparison }),
      });

      const result = await compareRoutes();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/routes/comparison'
      );
      expect(result).toEqual(mockComparison);
      expect(result).toHaveLength(2);
    });

    it('should handle empty comparison result', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        json: async () => ({ data: [] }),
      });

      const result = await compareRoutes();

      expect(result).toHaveLength(0);
    });

    it('should handle fetch errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('No baseline set'));

      await expect(compareRoutes()).rejects.toThrow('No baseline set');
    });
  });
});

