/// <reference types="jest" />

import { BankingService } from "../src/core/application/services/banking.service";
import type { IBankEntryRepository } from "../src/core/ports/bankEntry.repository.port";
import type { IShipComplianceRepository } from "../src/core/ports/shipCompliance.repository.port";
import type { BankEntry } from "../src/core/domain/bankEntry.entity";
import type { ShipCompliance } from "../src/core/domain/shipCompliance.entity";

// 🧩 Helper to make test records easily
function makeBankEntry(partial: Partial<BankEntry>): BankEntry {
  return {
    id: partial.id ?? 0,
    shipId: partial.shipId ?? 0,
    year: partial.year ?? 2024,
    amountGco2eq: partial.amountGco2eq ?? 0,
    createdAt: partial.createdAt ?? new Date(),
    updatedAt: partial.updatedAt ?? new Date(),
  };
}

function makeShipCompliance(partial: Partial<ShipCompliance>): ShipCompliance {
  return {
    id: partial.id ?? 0,
    shipId: partial.shipId ?? 0,
    year: partial.year ?? 2024,
    cbGco2eq: partial.cbGco2eq ?? 0,
    createdAt: partial.createdAt ?? new Date(),
    updatedAt: partial.updatedAt ?? new Date(),
  };
}

// 🧩 Mock Repository
class MockBankEntryRepository implements IBankEntryRepository {
  private entries: BankEntry[];

  constructor(initial: BankEntry[] = []) {
    this.entries = initial;
  }

  async findAll(): Promise<BankEntry[]> {
    return [...this.entries];
  }

  async findByShipId(shipId: number): Promise<BankEntry[]> {
    return this.entries
      .filter((e) => e.shipId === shipId)
      .sort((a, b) => a.year - b.year);
  }

  async findByShipIdAndYear(
    shipId: number,
    year: number
  ): Promise<BankEntry | null> {
    return (
      this.entries.find((e) => e.shipId === shipId && e.year === year) ?? null
    );
  }

  async create(
    data: Omit<BankEntry, "id" | "createdAt" | "updatedAt">
  ): Promise<BankEntry> {
    const created = makeBankEntry({
      ...data,
      id: (this.entries.at(-1)?.id ?? 0) + 1,
    });
    this.entries.push(created);
    return created;
  }

  async updateAmount(
    shipId: number,
    year: number,
    amountGco2eq: number
  ): Promise<BankEntry> {
    const idx = this.entries.findIndex(
      (e) => e.shipId === shipId && e.year === year
    );
    if (idx === -1) throw new Error("Entry not found");
    this.entries[idx] = {
      ...this.entries[idx]!,
      amountGco2eq,
      updatedAt: new Date(),
    };
    return this.entries[idx]!;
  }

  async deleteByShipId(shipId: number): Promise<void> {
    this.entries = this.entries.filter((e) => e.shipId !== shipId);
  }
}

class MockShipComplianceRepository implements IShipComplianceRepository {
  private records: ShipCompliance[];

  constructor(initial: ShipCompliance[] = []) {
    this.records = initial;
  }

  async findAll(): Promise<ShipCompliance[]> {
    return [...this.records];
  }

  async findByShipId(shipId: number): Promise<ShipCompliance[]> {
    return this.records.filter((r) => r.shipId === shipId);
  }

  async findByShipIdAndYear(
    shipId: number,
    year: number
  ): Promise<ShipCompliance | null> {
    return (
      this.records.find((r) => r.shipId === shipId && r.year === year) ?? null
    );
  }

  async create(
    data: Omit<ShipCompliance, "id" | "createdAt" | "updatedAt">
  ): Promise<ShipCompliance> {
    const created = makeShipCompliance({
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
    this.records[idx] = { ...this.records[idx]!, ...data };
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
describe("BankingService", () => {
  let repo: MockBankEntryRepository;
  let complianceRepo: MockShipComplianceRepository;
  let service: BankingService;

  beforeEach(() => {
    repo = new MockBankEntryRepository([
      makeBankEntry({ id: 1, shipId: 101, year: 2023, amountGco2eq: 500 }),
      makeBankEntry({ id: 2, shipId: 101, year: 2024, amountGco2eq: 300 }),
      makeBankEntry({ id: 3, shipId: 202, year: 2024, amountGco2eq: 1000 }),
    ]);
    complianceRepo = new MockShipComplianceRepository([
      makeShipCompliance({ id: 1, shipId: 101, year: 2025, cbGco2eq: -400 }),
      makeShipCompliance({ id: 2, shipId: 101, year: 2026, cbGco2eq: -600 }),
      makeShipCompliance({ id: 3, shipId: 101, year: 2027, cbGco2eq: -1000 }),
      makeShipCompliance({ id: 4, shipId: 101, year: 2028, cbGco2eq: 0 }),
      makeShipCompliance({ id: 5, shipId: 999, year: 2024, cbGco2eq: -50 }),
    ]);
    service = new BankingService(repo, complianceRepo);
  });

  // ➕ addBankEntry - Create new entry
  it("should create a new bank entry when none exists", async () => {
    const created = await service.addBankEntry(303, 2025, 750);
    expect(created.shipId).toBe(303);
    expect(created.year).toBe(2025);
    expect(created.amountGco2eq).toBe(750);

    const found = await repo.findByShipIdAndYear(303, 2025);
    expect(found?.amountGco2eq).toBe(750);
  });

  // ➕ addBankEntry - Update existing entry
  it("should update existing entry by adding amount", async () => {
    const before = await repo.findByShipIdAndYear(101, 2023);
    expect(before?.amountGco2eq).toBe(500);

    const updated = await service.addBankEntry(101, 2023, 200);
    expect(updated.amountGco2eq).toBe(700);

    const after = await repo.findByShipIdAndYear(101, 2023);
    expect(after?.amountGco2eq).toBe(700);
  });

  it("should handle negative amounts in addBankEntry", async () => {
    const updated = await service.addBankEntry(101, 2023, -200);
    expect(updated.amountGco2eq).toBe(300);
  });

  // 📜 getShipBankEntries
  it("should return all bank entries for a ship sorted by year", async () => {
    const entries = await service.getShipBankEntries(101);
    expect(entries).toHaveLength(2);
    expect(entries[0]?.year).toBe(2023);
    expect(entries[1]?.year).toBe(2024);
  });

  it("should return empty array for ship with no entries", async () => {
    const entries = await service.getShipBankEntries(999);
    expect(entries).toHaveLength(0);
  });

  // 🧮 computeTotalSurplus
  it("should compute total surplus correctly", async () => {
    const total = await service.computeTotalSurplus(101);
    expect(total).toBe(800); // 500 + 300
  });

  it("should handle negative amounts in total surplus", async () => {
    await service.addBankEntry(101, 2025, -100);
    const total = await service.computeTotalSurplus(101);
    expect(total).toBe(700); // 500 + 300 - 100
  });

  it("should return zero for ship with no entries", async () => {
    const total = await service.computeTotalSurplus(999);
    expect(total).toBe(0);
  });

  // 💰 applyBankedSurplus - FIFO logic
  it("should apply banked surplus using FIFO (oldest first)", async () => {
    const result = await service.applyBankedSurplus(101, 2025, 400);
    expect(result.applied).toBe(400);
    expect(result.remaining).toBe(0);

    const entry2023 = await repo.findByShipIdAndYear(101, 2023);
    const entry2024 = await repo.findByShipIdAndYear(101, 2024);

    // FIFO: 400 from 2023 (500 -> 100), then 0 from 2024
    expect(entry2023?.amountGco2eq).toBe(100);
    expect(entry2024?.amountGco2eq).toBe(300); // Unchanged
  });

  it("should apply surplus across multiple entries in FIFO order", async () => {
    const result = await service.applyBankedSurplus(101, 2026, 600);
    expect(result.applied).toBe(600);
    expect(result.remaining).toBe(0);

    const entry2023 = await repo.findByShipIdAndYear(101, 2023);
    const entry2024 = await repo.findByShipIdAndYear(101, 2024);

    // 2023 entry fully consumed: 500 - 500 = 0
    expect(entry2023?.amountGco2eq).toBe(0);
    // 2024 entry partially consumed: 300 - 100 = 200
    expect(entry2024?.amountGco2eq).toBe(200);
  });

  it("should handle applying more than available surplus", async () => {
    const result = await service.applyBankedSurplus(101, 2027, 1000);
    expect(result.applied).toBe(800); // Only 800 available (500 + 300)
    expect(result.remaining).toBe(200);

    const entry2023 = await repo.findByShipIdAndYear(101, 2023);
    const entry2024 = await repo.findByShipIdAndYear(101, 2024);

    // Both entries should be fully consumed
    expect(entry2023?.amountGco2eq).toBe(0);
    expect(entry2024?.amountGco2eq).toBe(0);
  });

  it("should skip entries with zero or negative amounts", async () => {
    await service.addBankEntry(101, 2025, -50); // Add negative entry
    const result = await service.applyBankedSurplus(101, 2028, 100);
    expect(result.applied).toBe(100);
    expect(result.remaining).toBe(0);

    // Should have consumed from 2023 or 2024, not from 2025
    const entry2025 = await repo.findByShipIdAndYear(101, 2025);
    expect(entry2025?.amountGco2eq).toBe(-50); // Unchanged
  });

  it("should return zero applied when no positive entries exist", async () => {
    const emptyRepo = new MockBankEntryRepository([
      makeBankEntry({ id: 1, shipId: 999, year: 2024, amountGco2eq: -100 }),
    ]);
    const emptyComplianceRepo = new MockShipComplianceRepository([
      makeShipCompliance({ id: 1, shipId: 999, year: 2024, cbGco2eq: -50 }),
    ]);
    const emptyService = new BankingService(emptyRepo, emptyComplianceRepo);

    const result = await emptyService.applyBankedSurplus(999, 2024, 50);
    expect(result.applied).toBe(0);
    expect(result.remaining).toBe(50);
  });

  it("should handle zero apply amount", async () => {
    const result = await service.applyBankedSurplus(101, 2028, 0);
    expect(result.applied).toBe(0);
    expect(result.remaining).toBe(0);

    // Entries should be unchanged
    const entry2023 = await repo.findByShipIdAndYear(101, 2023);
    expect(entry2023?.amountGco2eq).toBe(500);
  });
});

