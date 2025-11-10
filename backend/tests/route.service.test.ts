import { RouteService } from "../src/core/application/services/route.service";
import { CONSTANTS } from "../src/shared/config/constants";
import type { IRouteRepository } from "../src/core/ports/route.repository.port";
import type { Route } from "../src/core/domain/route.entity";

function makeRoute(partial: Partial<Route>): Route {
  return {
    id: partial.id ?? 0,
    routeId: partial.routeId ?? "R-UNKNOWN",
    year: partial.year ?? 2024,
    ghgIntensity: partial.ghgIntensity ?? 0,
    isBaseline: partial.isBaseline ?? false,
    createdAt: partial.createdAt ?? new Date(),
    updatedAt: partial.updatedAt ?? new Date(),
  };
}

class MockRouteRepository implements IRouteRepository {
  private routes: Route[];
  constructor(initialRoutes: Route[]) {
    this.routes = initialRoutes;
  }
  async findAll(): Promise<Route[]> {
    return this.routes;
  }
  async findByYear(year: number): Promise<Route[]> {
    return this.routes.filter(r => r.year === year);
  }
  async findById(id: number): Promise<Route | null> {
    return this.routes.find(r => r.id === id) ?? null;
  }
  async findByRouteId(routeId: string): Promise<Route | null> {
    return this.routes.find(r => r.routeId === routeId) ?? null;
  }
  async setBaseline(routeId: string): Promise<Route> {
    const idx = this.routes.findIndex(r => r.routeId === routeId);
    if (idx === -1) throw new Error("Route not found");
    this.routes = this.routes.map(r => ({ ...r, isBaseline: false }));
    this.routes[idx] = { ...this.routes[idx]!, isBaseline: true };
    return this.routes[idx]!;
  }
  async findBaselines(): Promise<Route[]> {
    return this.routes.filter(r => r.isBaseline);
  }
  async create(data: Omit<Route, "id" | "createdAt" | "updatedAt">): Promise<Route> {
    const created: Route = {
      ...data,
      id: this.routes.length + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.routes.push(created);
    return created;
  }
}

describe("RouteService", () => {
  let repo: MockRouteRepository;
  let service: RouteService;

  beforeEach(() => {
    const routes: Route[] = [
      makeRoute({ id: 1, routeId: "R001", year: 2024, ghgIntensity: 91.0, isBaseline: true }),
      makeRoute({ id: 2, routeId: "R002", year: 2024, ghgIntensity: 88.0 }),
      makeRoute({ id: 3, routeId: "R003", year: 2025, ghgIntensity: 93.5 }),
    ];
    repo = new MockRouteRepository(routes);
    service = new RouteService(repo);
  });

  it("should return all routes", async () => {
    const all = await service.getAllRoutes();
    expect(all.length).toBe(3);
  });

  it("should switch baseline route correctly", async () => {
    const updated = await service.setBaseline("R002");
    expect(updated.isBaseline).toBe(true);
    const baselines = await repo.findBaselines();
    expect(baselines).toHaveLength(1);
    expect(baselines[0]?.routeId).toBe("R002");
  });

  it("should compute correct percentDiff and compliance", async () => {
    await service.setBaseline("R002");
    const result = await service.compareRoutes();

    const r001 = result.find(r => r.routeId === "R001");
    const r002 = result.find(r => r.routeId === "R002");

    expect(r002?.percentDiff).toBeCloseTo(0, 10);
    expect(r001).toBeDefined();

    const expected = ((91.0 / 88.0) - 1) * 100;
    const expectedRounded = parseFloat(expected.toFixed(3));
    expect(r001?.percentDiff).toBeCloseTo(expectedRounded, 3);

    expect(r002?.compliant).toBe(88.0 <= CONSTANTS.TARGET_INTENSITY_GCO2E_PER_MJ);
  });

  it("should throw when no baseline is set", async () => {
    const repoNoBaseline = new MockRouteRepository([
      makeRoute({ id: 10, routeId: "X1", ghgIntensity: 90 }),
      makeRoute({ id: 11, routeId: "X2", ghgIntensity: 91 }),
    ]);
    const svcNoBaseline = new RouteService(repoNoBaseline);
    await expect(svcNoBaseline.compareRoutes()).rejects.toThrow("No baseline route set");
  });
});
