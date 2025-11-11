/// <reference types="jest" />

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
    return (
      this.records.find(
        (r) => r.shipId === shipId && r.year === year
      ) ?? null
    );
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

  async findByYear(year: number): Promise<ShipCompliance[]> {
    return this.records.filter((r) => r.year === year);
  }

  async updateByShipIdAndYear(
    shipId: number,
    year: number,
    data: Partial<ShipCompliance>
  ): Promise<ShipCompliance> {
    const idx = this.records.findIndex(
      (r) => r.shipId === shipId && r.year === year
    );
    if (idx === -1) throw new Error("Record not found");
    this.records[idx] = {
      ...this.records[idx]!,
      ...data,
      updatedAt: new Date(),
    };
    return this.records[idx]!;
  }

  async updateCb(shipId: number, year: number, newCb: number): Promise<ShipCompliance> {
    const idx = this.records.findIndex(
      (r) => r.shipId === shipId && r.year === year
    );
    if (idx === -1) throw new Error("Record not found");
    this.records[idx] = {
      ...this.records[idx]!,
      cbGco2eq: newCb,
      updatedAt: new Date(),
    };
    return this.records[idx]!;
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

  // 🧮 computeCB - Happy path
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

    const created = await service.computeCB(
      shipId,
      year,
      fuelTons,
      actualIntensity
    );

    expect(created.shipId).toBe(shipId);
    expect(created.year).toBe(year);
    expect(created.cbGco2eq).toBeCloseTo(expectedCb, 5);
  });

  it("should compute positive CB when intensity is below target", async () => {
    const created = await service.computeCB(1, 2025, 10, 85);
    expect(created.cbGco2eq).toBeGreaterThan(0);
  });

  it("should compute negative CB when intensity is above target", async () => {
    const created = await service.computeCB(1, 2025, 10, 95);
    expect(created.cbGco2eq).toBeLessThan(0);
  });

  it("should compute zero CB when intensity equals target", async () => {
    const created = await service.computeCB(
      1,
      2025,
      10,
      CONSTANTS.TARGET_INTENSITY_GCO2E_PER_MJ
    );
    expect(created.cbGco2eq).toBeCloseTo(0, 5);
  });

  // ❌ computeCB - Invalid inputs
  it("should throw error if fuelConsumptionTons <= 0", async () => {
    await expect(service.computeCB(1, 2025, 0, 80)).rejects.toThrow(
      "Fuel consumption must be greater than zero."
    );
  });

  it("should throw error if fuelConsumptionTons is negative", async () => {
    await expect(service.computeCB(1, 2025, -10, 80)).rejects.toThrow(
      "Fuel consumption must be greater than zero."
    );
  });

  it("should throw error if actualIntensity <= 0", async () => {
    await expect(service.computeCB(1, 2025, 10, 0)).rejects.toThrow(
      "Actual intensity must be greater than zero."
    );
  });

  it("should throw error if actualIntensity is negative", async () => {
    await expect(service.computeCB(1, 2025, 10, -5)).rejects.toThrow(
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

  it("should return empty array for ship with no compliance records", async () => {
    const history = await service.getComplianceHistory(999);
    expect(history).toHaveLength(0);
  });

  it("should return all records for ship across multiple years", async () => {
    await repo.create({ shipId: 101, year: 2025, cbGco2eq: 300 });
    const history = await service.getComplianceHistory(101);
    expect(history).toHaveLength(3);
    expect(history[0]?.year).toBe(2023);
    expect(history[1]?.year).toBe(2024);
    expect(history[2]?.year).toBe(2025);
  });

  // 🔍 getComplianceByYear
  it("should return correct compliance record for ship and year", async () => {
    const rec = await service.getComplianceByYear(101, 2024);
    expect(rec).not.toBeNull();
    expect(rec?.shipId).toBe(101);
    expect(rec?.year).toBe(2024);
    expect(rec?.cbGco2eq).toBe(-500);
  });

  it("should return null if no compliance record found", async () => {
    const rec = await service.getComplianceByYear(101, 1999);
    expect(rec).toBeNull();
  });

  it("should return null for non-existent ship", async () => {
    const rec = await service.getComplianceByYear(999, 2024);
    expect(rec).toBeNull();
  });

  // 📅 complianceByYear
  it("should return first compliance record for a given year", async () => {
    await repo.create({ shipId: 303, year: 2024, cbGco2eq: 500 });
    const rec = await service.complianceByYear(2024);
    expect(rec).not.toBeNull();
    expect(rec?.year).toBe(2024);
  });

  it("should return null if no records exist for year", async () => {
    const rec = await service.complianceByYear(1999);
    expect(rec).toBeNull();
  });

  // 📊 getAdjustedCBs
  it("should return all adjusted CBs for a given year", async () => {
    await repo.create({ shipId: 303, year: 2024, cbGco2eq: 750 });
    const adjustedCBs = await service.getAdjustedCBs(2024);

    expect(adjustedCBs).toHaveLength(3);
    expect(adjustedCBs.find((r) => r.shipId === 101)?.adjustedCb).toBe(-500);
    expect(adjustedCBs.find((r) => r.shipId === 202)?.adjustedCb).toBe(250);
    expect(adjustedCBs.find((r) => r.shipId === 303)?.adjustedCb).toBe(750);
  });

  it("should return empty array if no records exist for year", async () => {
    const adjustedCBs = await service.getAdjustedCBs(1999);
    expect(adjustedCBs).toHaveLength(0);
  });

  // ✏️ adjustCB
  it("should adjust CB by updating existing record", async () => {
    const before = await repo.findByShipId(202);
    expect(before).toHaveLength(1);
    expect(before[0]?.cbGco2eq).toBe(250);

    const updated = await service.adjustCB(202, 2024, +100);
    expect(updated.cbGco2eq).toBeCloseTo(350, 5);

    const after = await repo.findByShipId(202);
    expect(after).toHaveLength(1);
    expect(after[0]?.cbGco2eq).toBeCloseTo(350, 5);
  });

  it("should handle negative adjustments", async () => {
    const updated = await service.adjustCB(202, 2024, -50);
    expect(updated.cbGco2eq).toBeCloseTo(200, 5);
  });

  it("should handle large adjustments", async () => {
    const updated = await service.adjustCB(101, 2024, +1000);
    expect(updated.cbGco2eq).toBeCloseTo(500, 5); // -500 + 1000 = 500
  });

  it("should throw error if adjustCB target record not found", async () => {
    await expect(service.adjustCB(999, 2025, 100)).rejects.toThrow(
      "Compliance record not found."
    );
  });

  it("should throw error if adjusting non-existent ship", async () => {
    await expect(service.adjustCB(999, 2024, 100)).rejects.toThrow(
      "Compliance record not found."
    );
  });
});
