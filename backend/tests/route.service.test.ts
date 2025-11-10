/// <reference types="jest" />

import { RouteService } from "../src/core/application/services/route.service";
import { CONSTANTS } from "../src/shared/config/constants";
import type { IRouteRepository } from "../src/core/ports/route.repository.port";
import type { Route } from "../src/core/domain/route.entity";

// 🧩 Helper to make test records easily
function makeRoute(partial: Partial<Route>): Route {
  return {
    id: partial.id ?? 0,
    routeId: partial.routeId ?? "R-UNKNOWN",
    vesselType: partial.vesselType ?? "Container",
    fuelType: partial.fuelType ?? "MGO",
    year: partial.year ?? 2024,
    ghgIntensity: partial.ghgIntensity ?? 0,
    fuelConsumption: partial.fuelConsumption ?? 0,
    distance: partial.distance ?? 0,
    totalEmissions: partial.totalEmissions ?? 0,
    isBaseline: partial.isBaseline ?? false,
    createdAt: partial.createdAt ?? new Date(),
    updatedAt: partial.updatedAt ?? new Date(),
  };
}

// 🧩 Mock Repository
class MockRouteRepository implements IRouteRepository {
  private routes: Route[];

  constructor(initialRoutes: Route[] = []) {
    this.routes = initialRoutes;
  }

  async findAll(filters?: {
    vesselType?: string;
    fuelType?: string;
    year?: number;
  }): Promise<Route[]> {
    let filtered = [...this.routes];
    if (filters?.vesselType) {
      filtered = filtered.filter((r) => r.vesselType === filters.vesselType);
    }
    if (filters?.fuelType) {
      filtered = filtered.filter((r) => r.fuelType === filters.fuelType);
    }
    if (filters?.year) {
      filtered = filtered.filter((r) => r.year === filters.year);
    }
    return filtered;
  }

  async findByYear(year: number): Promise<Route[]> {
    return this.routes.filter((r) => r.year === year);
  }

  async findById(id: number): Promise<Route | null> {
    return this.routes.find((r) => r.id === id) ?? null;
  }

  async findByRouteId(routeId: string): Promise<Route | null> {
    return this.routes.find((r) => r.routeId === routeId) ?? null;
  }

  async setBaseline(routeId: string): Promise<Route> {
    const idx = this.routes.findIndex((r) => r.routeId === routeId);
    if (idx === -1) throw new Error("Route not found");
    this.routes = this.routes.map((r) => ({ ...r, isBaseline: false }));
    this.routes[idx] = { ...this.routes[idx]!, isBaseline: true };
    return this.routes[idx]!;
  }

  async findBaselines(): Promise<Route[]> {
    return this.routes.filter((r) => r.isBaseline);
  }

  async create(
    data: Omit<Route, "id" | "createdAt" | "updatedAt">
  ): Promise<Route> {
    const created: Route = {
      ...data,
      id: (this.routes.at(-1)?.id ?? 0) + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.routes.push(created);
    return created;
  }
}

// 🧪 Tests
describe("RouteService", () => {
  let repo: MockRouteRepository;
  let service: RouteService;

  beforeEach(() => {
    const routes: Route[] = [
      makeRoute({
        id: 1,
        routeId: "R001",
        year: 2024,
        ghgIntensity: 91.0,
        isBaseline: true,
      }),
      makeRoute({
        id: 2,
        routeId: "R002",
        year: 2024,
        ghgIntensity: 88.0,
      }),
      makeRoute({
        id: 3,
        routeId: "R003",
        year: 2025,
        ghgIntensity: 93.5,
      }),
    ];
    repo = new MockRouteRepository(routes);
    service = new RouteService(repo);
  });

  // 📋 getAllRoutes
  it("should return all routes when no filters provided", async () => {
    const all = await service.getAllRoutes();
    expect(all).toHaveLength(3);
  });

  it("should filter routes by year", async () => {
    const routes2024 = await service.getAllRoutes({ year: 2024 });
    expect(routes2024).toHaveLength(2);
    expect(routes2024.every((r) => r.year === 2024)).toBe(true);
  });

  it("should filter routes by vesselType", async () => {
    await repo.create({
      routeId: "R004",
      vesselType: "Tanker",
      fuelType: "MGO",
      year: 2024,
      ghgIntensity: 90,
      fuelConsumption: 100,
      distance: 1000,
      totalEmissions: 9000,
      isBaseline: false,
    });

    const containerRoutes = await service.getAllRoutes({
      vesselType: "Container",
    });
    expect(containerRoutes).toHaveLength(3);
    expect(containerRoutes.every((r) => r.vesselType === "Container")).toBe(
      true
    );
  });

  it("should filter routes by fuelType", async () => {
    await repo.create({
      routeId: "R005",
      vesselType: "Container",
      fuelType: "LNG",
      year: 2024,
      ghgIntensity: 85,
      fuelConsumption: 100,
      distance: 1000,
      totalEmissions: 8500,
      isBaseline: false,
    });

    const mgoRoutes = await service.getAllRoutes({ fuelType: "MGO" });
    expect(mgoRoutes).toHaveLength(3);
    expect(mgoRoutes.every((r) => r.fuelType === "MGO")).toBe(true);
  });

  it("should filter routes by multiple criteria", async () => {
    await repo.create({
      routeId: "R006",
      vesselType: "Container",
      fuelType: "MGO",
      year: 2024,
      ghgIntensity: 87,
      fuelConsumption: 100,
      distance: 1000,
      totalEmissions: 8700,
      isBaseline: false,
    });

    const filtered = await service.getAllRoutes({
      year: 2024,
      vesselType: "Container",
    });
    expect(filtered).toHaveLength(3);
    expect(
      filtered.every(
        (r) => r.year === 2024 && r.vesselType === "Container"
      )
    ).toBe(true);
  });

  // 🔄 setBaseline
  it("should switch baseline route correctly", async () => {
    const updated = await service.setBaseline("R002");
    expect(updated.isBaseline).toBe(true);
    expect(updated.routeId).toBe("R002");

    const baselines = await repo.findBaselines();
    expect(baselines).toHaveLength(1);
    expect(baselines[0]?.routeId).toBe("R002");
  });

  it("should unset previous baseline when setting new one", async () => {
    const before = await repo.findBaselines();
    expect(before).toHaveLength(1);
    expect(before[0]?.routeId).toBe("R001");

    await service.setBaseline("R002");

    const after = await repo.findBaselines();
    expect(after).toHaveLength(1);
    expect(after[0]?.routeId).toBe("R002");

    const r001 = await repo.findByRouteId("R001");
    expect(r001?.isBaseline).toBe(false);
  });

  it("should throw error if route not found when setting baseline", async () => {
    await expect(service.setBaseline("NONEXISTENT")).rejects.toThrow(
      "Route not found"
    );
  });

  // 📊 compareRoutes
  it("should compute correct percentDiff and compliance", async () => {
    await service.setBaseline("R002");
    const result = await service.compareRoutes();

    const r001 = result.find((r) => r.routeId === "R001");
    const r002 = result.find((r) => r.routeId === "R002");
    const r003 = result.find((r) => r.routeId === "R003");

    // Baseline should have 0% difference
    expect(r002?.percentDiff).toBeCloseTo(0, 10);
    expect(r002?.compliant).toBe(
      88.0 <= CONSTANTS.TARGET_INTENSITY_GCO2E_PER_MJ
    );

    // R001 should have positive percentDiff (higher than baseline)
    expect(r001).toBeDefined();
    const expectedR001 = ((91.0 / 88.0) - 1) * 100;
    const expectedRoundedR001 = parseFloat(expectedR001.toFixed(3));
    expect(r001?.percentDiff).toBeCloseTo(expectedRoundedR001, 3);
    expect(r001?.compliant).toBe(
      91.0 <= CONSTANTS.TARGET_INTENSITY_GCO2E_PER_MJ
    );

    // R003 should also be compared
    expect(r003).toBeDefined();
    const expectedR003 = ((93.5 / 88.0) - 1) * 100;
    const expectedRoundedR003 = parseFloat(expectedR003.toFixed(3));
    expect(r003?.percentDiff).toBeCloseTo(expectedRoundedR003, 3);
  });

  it("should return compliant true for routes below target intensity", async () => {
    await repo.create({
      routeId: "R007",
      vesselType: "Container",
      fuelType: "MGO",
      year: 2024,
      ghgIntensity: 85.0, // Below target
      fuelConsumption: 100,
      distance: 1000,
      totalEmissions: 8500,
      isBaseline: false,
    });

    await service.setBaseline("R002");
    const result = await service.compareRoutes();

    const r007 = result.find((r) => r.routeId === "R007");
    expect(r007?.compliant).toBe(true);
  });

  it("should return compliant false for routes above target intensity", async () => {
    await repo.create({
      routeId: "R008",
      vesselType: "Container",
      fuelType: "MGO",
      year: 2024,
      ghgIntensity: 95.0, // Above target
      fuelConsumption: 100,
      distance: 1000,
      totalEmissions: 9500,
      isBaseline: false,
    });

    await service.setBaseline("R002");
    const result = await service.compareRoutes();

    const r008 = result.find((r) => r.routeId === "R008");
    expect(r008?.compliant).toBe(false);
  });

  it("should throw error when no baseline is set", async () => {
    const repoNoBaseline = new MockRouteRepository([
      makeRoute({ id: 10, routeId: "X1", ghgIntensity: 90 }),
      makeRoute({ id: 11, routeId: "X2", ghgIntensity: 91 }),
    ]);
    const svcNoBaseline = new RouteService(repoNoBaseline);

    await expect(svcNoBaseline.compareRoutes()).rejects.toThrow(
      "No baseline route set"
    );
  });

  it("should handle negative percentDiff when route is better than baseline", async () => {
    await repo.create({
      routeId: "R009",
      vesselType: "Container",
      fuelType: "MGO",
      year: 2024,
      ghgIntensity: 85.0, // Better than baseline (88.0)
      fuelConsumption: 100,
      distance: 1000,
      totalEmissions: 8500,
      isBaseline: false,
    });

    await service.setBaseline("R002");
    const result = await service.compareRoutes();

    const r009 = result.find((r) => r.routeId === "R009");
    const expected = ((85.0 / 88.0) - 1) * 100;
    expect(r009?.percentDiff).toBeCloseTo(expected, 3);
    expect(r009?.percentDiff).toBeLessThan(0);
  });
});
