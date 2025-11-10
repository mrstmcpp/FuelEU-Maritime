"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const route_service_1 = require("../src/core/application/services/route.service");
const constants_1 = require("../src/shared/config/constants");
function makeRoute(partial) {
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
class MockRouteRepository {
    constructor(initialRoutes) {
        this.routes = initialRoutes;
    }
    async findAll() {
        return this.routes;
    }
    async findByYear(year) {
        return this.routes.filter(r => r.year === year);
    }
    async findById(id) {
        return this.routes.find(r => r.id === id) ?? null;
    }
    async findByRouteId(routeId) {
        return this.routes.find(r => r.routeId === routeId) ?? null;
    }
    async setBaseline(routeId) {
        const idx = this.routes.findIndex(r => r.routeId === routeId);
        if (idx === -1)
            throw new Error("Route not found");
        this.routes = this.routes.map(r => ({ ...r, isBaseline: false }));
        this.routes[idx] = { ...this.routes[idx], isBaseline: true };
        return this.routes[idx];
    }
    async findBaselines() {
        return this.routes.filter(r => r.isBaseline);
    }
    async create(data) {
        const created = {
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
    let repo;
    let service;
    beforeEach(() => {
        const routes = [
            makeRoute({ id: 1, routeId: "R001", year: 2024, ghgIntensity: 91.0, isBaseline: true }),
            makeRoute({ id: 2, routeId: "R002", year: 2024, ghgIntensity: 88.0 }),
            makeRoute({ id: 3, routeId: "R003", year: 2025, ghgIntensity: 93.5 }),
        ];
        repo = new MockRouteRepository(routes);
        service = new route_service_1.RouteService(repo);
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
        expect(r002?.compliant).toBe(88.0 <= constants_1.CONSTANTS.TARGET_INTENSITY_GCO2E_PER_MJ);
    });
    it("should throw when no baseline is set", async () => {
        const repoNoBaseline = new MockRouteRepository([
            makeRoute({ id: 10, routeId: "X1", ghgIntensity: 90 }),
            makeRoute({ id: 11, routeId: "X2", ghgIntensity: 91 }),
        ]);
        const svcNoBaseline = new route_service_1.RouteService(repoNoBaseline);
        await expect(svcNoBaseline.compareRoutes()).rejects.toThrow("No baseline route set");
    });
});
//# sourceMappingURL=route.service.test.js.map