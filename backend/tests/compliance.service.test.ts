import { ComplianceService } from "../src/core/application/services/compliance.service";
import type { IShipComplianceRepository } from "../src/core/ports/shipCompliance.repository.port";
import type { ShipCompliance } from "../src/core/domain/shipCompliance.entity";
import { CONSTANTS } from "../src/shared/config/constants";

// 🧩 Helper to make test records easily
function makeRecord(partial: Partial<ShipCompliance>): ShipCompliance {
  return {
    id: partial.id ?? 0,
    shipId: partial.shipId ?? 0,
    year: partial.year ?? 2025,
    cbGco2eq: partial.cbGco2eq ?? 0,
    createdAt: partial.createdAt ?? new Date(),
    updatedAt: partial.updatedAt ?? new Date(),
  };
}

// 🧩 Mock Repository
class MockShipComplianceRepository implements IShipComplianceRepository {
  private records: ShipCompliance[];
  constructor(initial: ShipCompliance[] = []) {
    this.records = initial;
  }

  async findAll(): Promise<ShipCompliance[]> {
    return [...this.records];
  }

  async findByShipId(shipId: number): Promise<ShipCompliance[]> {
    return this.records
      .filter((r) => r.shipId === shipId)
      .sort((a, b) => a.year - b.year);
  }

  async findByShipIdAndYear(
    shipId: number,
    year: number
  ): Promise<ShipCompliance | null> {
    return this.records.find(
      (r) => r.shipId === shipId && r.year === year
    ) ?? null;
  }

  async create(
    data: Omit<ShipCompliance, "id" | "createdAt" | "updatedAt">
  ): Promise<ShipCompliance> {
    const created = makeRecord({
      ...data,
      id: (this.records.at(-1)?.id ?? 0) + 1,
    });
    this.records.push(created);
    return created;
  }

  async deleteByShipId(shipId: number): Promise<void> {
    this.records = this.records.filter((r) => r.shipId !== shipId);
  }
}

// 🧪 Tests
describe("ComplianceService", () => {
  let repo: MockShipComplianceRepository;
  let service: ComplianceService;

  beforeEach(() => {
    repo = new MockShipComplianceRepository([
      makeRecord({ id: 1, shipId: 101, year: 2023, cbGco2eq: 1000 }),
      makeRecord({ id: 2, shipId: 101, year: 2024, cbGco2eq: -500 }),
      makeRecord({ id: 3, shipId: 202, year: 2024, cbGco2eq: 250 }),
    ]);
    service = new ComplianceService(repo);
  });

  // 🧮 computeCB (happy path)
  it("should compute CB correctly based on formula", async () => {
    const shipId = 303;
    const year = 2025;
    const fuelTons = 10;
    const actualIntensity = 80;

    const energyInScope =
      fuelTons * CONSTANTS.ENERGY_FACTOR_MJ_PER_TON;
    const expectedCb =
      (CONSTANTS.TARGET_INTENSITY_GCO2E_PER_MJ - actualIntensity) *
      energyInScope;

    const created = await service.computeCB(shipId, year, fuelTons, actualIntensity);

    expect(created.shipId).toBe(shipId);
    expect(created.year).toBe(year);
    expect(created.cbGco2eq).toBeCloseTo(expectedCb, 5);
  });

  // ❌ Invalid inputs
  it("should throw error if fuelConsumptionTons <= 0", async () => {
    await expect(service.computeCB(1, 2025, 0, 80)).rejects.toThrow(
      "Fuel consumption must be greater than zero."
    );
  });

  it("should throw error if actualIntensity <= 0", async () => {
    await expect(service.computeCB(1, 2025, 10, 0)).rejects.toThrow(
      "Actual intensity must be greater than zero."
    );
  });

  // 📜 getComplianceHistory
  it("should return sorted compliance history by year", async () => {
    const history = await service.getComplianceHistory(101);
    expect(history).toHaveLength(2);
    expect(history[0]?.year).toBe(2023);
    expect(history[1]?.year).toBe(2024);
  });

  // 🔍 getComplianceByYear
  it("should return correct compliance record for ship and year", async () => {
    const rec = await service.getComplianceByYear(101, 2024);
    expect(rec?.cbGco2eq).toBe(-500);
  });

  it("should return null if no compliance record found", async () => {
    const rec = await service.getComplianceByYear(101, 1999);
    expect(rec).toBeNull();
  });

  // ✏️ adjustCB logic
  it("should adjust CB by deleting and recreating record", async () => {
    const before = await repo.findByShipId(202);
    expect(before).toHaveLength(1);
    expect(before[0]?.cbGco2eq).toBe(250);

    const updated = await service.adjustCB(202, 2024, +100);
    expect(updated.cbGco2eq).toBeCloseTo(350, 5);

    const after = await repo.findByShipId(202);
    expect(after).toHaveLength(1);
    expect(after[0]?.cbGco2eq).toBeCloseTo(350, 5);
  });

  it("should throw error if adjustCB target record not found", async () => {
    await expect(service.adjustCB(999, 2025, 100)).rejects.toThrow(
      "Compliance record not found."
    );
  });
});
