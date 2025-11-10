import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RouteTable } from '../adaptors/ui/components/RouteTable';
import type { Route } from '../core/domain/route.entity';

describe('RouteTable', () => {
  const mockRoutes: Route[] = [
    {
      id: 1,
      routeId: 'R001',
      vesselType: 'Container',
      fuelType: 'MGO',
      year: 2024,
      ghgIntensity: 91.0,
      fuelConsumption: 100,
      distance: 1000,
      totalEmissions: 9100,
      isBaseline: true,
    },
    {
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
    },
  ];

  it('should render table headers', () => {
    const mockOnSetBaseline = vi.fn();
    render(<RouteTable routes={[]} onSetBaseline={mockOnSetBaseline} />);

    expect(screen.getByText('Route ID')).toBeInTheDocument();
    expect(screen.getByText('Vessel Type')).toBeInTheDocument();
    expect(screen.getByText('Fuel Type')).toBeInTheDocument();
    expect(screen.getByText('Year')).toBeInTheDocument();
    expect(screen.getByText('GHG Intensity (gCO₂e/MJ)')).toBeInTheDocument();
    expect(screen.getByText('Baseline')).toBeInTheDocument();
  });

  it('should render empty state when no routes', () => {
    const mockOnSetBaseline = vi.fn();
    render(<RouteTable routes={[]} onSetBaseline={mockOnSetBaseline} />);

    expect(screen.getByText('No routes found.')).toBeInTheDocument();
  });

  it('should render route data', () => {
    const mockOnSetBaseline = vi.fn();
    render(<RouteTable routes={mockRoutes} onSetBaseline={mockOnSetBaseline} />);

    expect(screen.getByText('R001')).toBeInTheDocument();
    expect(screen.getByText('R002')).toBeInTheDocument();
    expect(screen.getByText('Container')).toBeInTheDocument();
    expect(screen.getByText('Tanker')).toBeInTheDocument();
    expect(screen.getByText('MGO')).toBeInTheDocument();
    expect(screen.getByText('LNG')).toBeInTheDocument();
    // Multiple routes have year 2024, so use getAllByText
    const yearElements = screen.getAllByText('2024');
    expect(yearElements.length).toBe(2);
  });

  it('should display baseline indicator for baseline route', () => {
    const mockOnSetBaseline = vi.fn();
    render(<RouteTable routes={mockRoutes} onSetBaseline={mockOnSetBaseline} />);

    const baselineTexts = screen.getAllByText('Yes');
    expect(baselineTexts.length).toBeGreaterThan(0);
  });

  it('should display "No" for non-baseline routes', () => {
    const mockOnSetBaseline = vi.fn();
    render(<RouteTable routes={mockRoutes} onSetBaseline={mockOnSetBaseline} />);

    const noTexts = screen.getAllByText('No');
    expect(noTexts.length).toBeGreaterThan(0);
  });

  it('should call onSetBaseline when "Set Baseline" button is clicked', () => {
    const mockOnSetBaseline = vi.fn();
    render(<RouteTable routes={mockRoutes} onSetBaseline={mockOnSetBaseline} />);

    const setBaselineButtons = screen.getAllByText('Set Baseline');
    expect(setBaselineButtons.length).toBeGreaterThan(0);

    fireEvent.click(setBaselineButtons[0]);

    expect(mockOnSetBaseline).toHaveBeenCalledWith('R002');
  });

  it('should show "Active" button for baseline route', () => {
    const mockOnSetBaseline = vi.fn();
    render(<RouteTable routes={mockRoutes} onSetBaseline={mockOnSetBaseline} />);

    const activeButtons = screen.getAllByText('Active');
    expect(activeButtons.length).toBeGreaterThan(0);
  });

  it('should format GHG intensity to 2 decimal places', () => {
    const mockOnSetBaseline = vi.fn();
    render(<RouteTable routes={mockRoutes} onSetBaseline={mockOnSetBaseline} />);

    expect(screen.getByText('91.00')).toBeInTheDocument();
    expect(screen.getByText('88.00')).toBeInTheDocument();
  });

  it('should display all route properties correctly', () => {
    const mockOnSetBaseline = vi.fn();
    render(<RouteTable routes={mockRoutes} onSetBaseline={mockOnSetBaseline} />);

    // Check fuel consumption
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();

    // Check distance
    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByText('2000')).toBeInTheDocument();

    // Check total emissions
    expect(screen.getByText('9100')).toBeInTheDocument();
    expect(screen.getByText('13200')).toBeInTheDocument();
  });

  it('should handle multiple routes', () => {
    const multipleRoutes: Route[] = [
      ...mockRoutes,
      {
        id: 3,
        routeId: 'R003',
        vesselType: 'Bulk',
        fuelType: 'MGO',
        year: 2024,
        ghgIntensity: 85.5,
        fuelConsumption: 200,
        distance: 3000,
        totalEmissions: 17100,
        isBaseline: false,
      },
    ];

    const mockOnSetBaseline = vi.fn();
    render(<RouteTable routes={multipleRoutes} onSetBaseline={mockOnSetBaseline} />);

    expect(screen.getByText('R001')).toBeInTheDocument();
    expect(screen.getByText('R002')).toBeInTheDocument();
    expect(screen.getByText('R003')).toBeInTheDocument();
  });
});

