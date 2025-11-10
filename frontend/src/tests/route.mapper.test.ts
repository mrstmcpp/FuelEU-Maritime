import { describe, it, expect } from 'vitest';
import { mapRouteResponse } from '../adaptors/infrastructure/mappers/route.mapper';

describe('mapRouteResponse', () => {
  it('should map route response with snake_case properties', () => {
    const input = {
      id: 1,
      route_id: 'R001',
      vessel_type: 'Container',
      fuel_type: 'MGO',
      year: 2024,
      ghg_intensity: 91.5,
      fuel_consumption: 100,
      distance: 1000,
      total_emissions: 9150,
      is_baseline: true,
    };

    const result = mapRouteResponse(input);

    expect(result).toEqual({
      id: 1,
      routeId: 'R001',
      vesselType: 'Container',
      fuelType: 'MGO',
      year: 2024,
      ghgIntensity: 91.5,
      fuelConsumption: 100,
      distance: 1000,
      totalEmissions: 9150,
      isBaseline: true,
    });
  });

  it('should map route response with camelCase properties', () => {
    const input = {
      id: 2,
      routeId: 'R002',
      vesselType: 'Tanker',
      fuelType: 'LNG',
      year: 2024,
      ghgIntensity: 88.0,
      fuelConsumption: 150,
      distance: 2000,
      totalEmissions: 13200,
      isBaseline: false,
    };

    const result = mapRouteResponse(input);

    expect(result).toEqual({
      id: 2,
      routeId: 'R002',
      vesselType: 'Tanker',
      fuelType: 'LNG',
      year: 2024,
      ghgIntensity: 88.0,
      fuelConsumption: 150,
      distance: 2000,
      totalEmissions: 13200,
      isBaseline: false,
    });
  });

  it('should handle missing optional fields with defaults', () => {
    const input = {
      id: 3,
      route_id: 'R003',
      year: 2024,
      ghg_intensity: 90.0,
    };

    const result = mapRouteResponse(input);

    expect(result).toEqual({
      id: 3,
      routeId: 'R003',
      vesselType: 'N/A',
      fuelType: 'N/A',
      year: 2024,
      ghgIntensity: 90.0,
      fuelConsumption: 0,
      distance: 0,
      totalEmissions: 0,
      isBaseline: false,
    });
  });

  it('should convert string numbers to numbers', () => {
    const input = {
      id: 4,
      route_id: 'R004',
      year: 2024,
      ghg_intensity: '85.5',
      fuel_consumption: '200',
      distance: '3000',
      total_emissions: '25650',
    };

    const result = mapRouteResponse(input);

    expect(result.ghgIntensity).toBe(85.5);
    expect(result.fuelConsumption).toBe(200);
    expect(result.distance).toBe(3000);
    expect(result.totalEmissions).toBe(25650);
  });

  it('should handle boolean values correctly', () => {
    const input1 = {
      id: 5,
      route_id: 'R005',
      year: 2024,
      ghg_intensity: 90,
      is_baseline: true,
    };

    const input2 = {
      id: 6,
      route_id: 'R006',
      year: 2024,
      ghg_intensity: 90,
      is_baseline: false,
    };

    expect(mapRouteResponse(input1).isBaseline).toBe(true);
    expect(mapRouteResponse(input2).isBaseline).toBe(false);
  });

  it('should handle null/undefined values gracefully', () => {
    const input = {
      id: 7,
      route_id: 'R007',
      year: 2024,
      ghg_intensity: null,
      fuel_consumption: undefined,
    };

    const result = mapRouteResponse(input);

    // Number(null) = 0, Number(undefined) = NaN, so we check for NaN or 0
    expect(result.ghgIntensity).toBeNaN();
    expect(result.fuelConsumption).toBe(0); // undefined falls back to default 0
  });
});

