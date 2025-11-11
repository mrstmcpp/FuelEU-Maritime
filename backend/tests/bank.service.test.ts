/// <reference types="jest" />

import { BankService } from "../src/core/application/services/bank.service";
import type { IBankEntryRepository } from "../src/core/ports/bankEntry.repository.port";
import type { IShipComplianceRepository } from "../src/core/ports/shipCompliance.repository.port";
import type { BankEntry } from "../src/core/domain/bankEntry.entity";
import type { ShipCompliance } from "../src/core/domain/shipCompliance.entity";
import { CONSTANTS } from "../src/shared/config/constants";

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

// 🧩 Mock Repositories
class MockBankEntryRepository implements IBankEntryRepository {
  private entries: BankEntry[];

  constructor(initial: BankEntry[] = []) {
    this.entries = initial;
  }

  async findAll(): Promise<BankEntry[]> {
    return [...this.entries];
  }

  async findByShipId(shipId: number): Promise<BankEntry[]> {
    return this.entries.filter((e) => e.shipId === shipId);
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
describe("BankService", () => {
  let bankRepo: MockBankEntryRepository;
  let complianceRepo: MockShipComplianceRepository;
  let service: BankService;

  beforeEach(() => {
    bankRepo = new MockBankEntryRepository();
    complianceRepo = new MockShipComplianceRepository([
      makeShipCompliance({
        id: 1,
        shipId: 101,
        year: 2023,
        cbGco2eq: 1000,
      }),
      makeShipCompliance({
        id: 2,
        shipId: 101,
        year: 2024,
        cbGco2eq: -500,
      }),
      makeShipCompliance({
        id: 3,
        shipId: 202,
        year: 2024,
        cbGco2eq: 500,
      }),
    ]);
    service = new BankService(bankRepo, complianceRepo);
  });

  // 💰 bankSurplus - Create new bank entry
  it("should create new bank entry when banking positive CB", async () => {
    const banked = await service.bankSurplus(101, 2023);
    expect(banked.shipId).toBe(101);
    expect(banked.year).toBe(2023);
    expect(banked.amountGco2eq).toBe(1000);

    const found = await bankRepo.findByShipIdAndYear(101, 2023);
    expect(found?.amountGco2eq).toBe(1000);
  });

  // 💰 bankSurplus - Update existing bank entry
  it("should update existing bank entry when banking again", async () => {
    await bankRepo.create({
      shipId: 101,
      year: 2023,
      amountGco2eq: 200,
    });

    const banked = await service.bankSurplus(101, 2023);
    expect(banked.amountGco2eq).toBe(1200); // 200 + 1000
  });

  // ❌ bankSurplus - Error cases
  it("should throw error if compliance record not found", async () => {
    await expect(service.bankSurplus(999, 2025)).rejects.toThrow(
      "Compliance record not found."
    );
  });

  it("should throw error if CB is not positive (<= threshold)", async () => {
    await expect(service.bankSurplus(101, 2024)).rejects.toThrow(
      "Only positive CB can be banked."
    );
  });

  it("should throw error if CB equals threshold", async () => {
    complianceRepo = new MockShipComplianceRepository([
      makeShipCompliance({
        id: 1,
        shipId: 303,
        year: 2024,
        cbGco2eq: CONSTANTS.BANKING_MIN_SURPLUS_THRESHOLD,
      }),
    ]);
    service = new BankService(bankRepo, complianceRepo);

    await expect(service.bankSurplus(303, 2024)).rejects.toThrow(
      "Only positive CB can be banked."
    );
  });

  // 🔄 applyBanked - Apply banked amount to another year
  it("should apply banked amount from one year to another", async () => {
    // Setup: Bank entry exists for 2023
    await bankRepo.create({
      shipId: 101,
      year: 2023,
      amountGco2eq: 800,
    });

    const result = await service.applyBanked(101, 2023, 2024, 300);

    // Source bank entry should be reduced
    expect(result.updatedFrom.amountGco2eq).toBe(500); // 800 - 300

    // Target compliance should be increased
    expect(result.updatedTo.cbGco2eq).toBe(-200); // -500 + 300
  });

  it("should fully consume banked amount when applying all", async () => {
    await bankRepo.create({
      shipId: 101,
      year: 2023,
      amountGco2eq: 500,
    });

    const result = await service.applyBanked(101, 2023, 2024, 500);

    expect(result.updatedFrom.amountGco2eq).toBe(0);
    expect(result.updatedTo.cbGco2eq).toBe(0); // -500 + 500
  });

  // ❌ applyBanked - Error cases
  it("should throw error if amount is zero or negative", async () => {
    await bankRepo.create({
      shipId: 101,
      year: 2023,
      amountGco2eq: 500,
    });

    await expect(
      service.applyBanked(101, 2023, 2024, 0)
    ).rejects.toThrow("Amount must be positive.");

    await expect(
      service.applyBanked(101, 2023, 2024, -100)
    ).rejects.toThrow("Amount must be positive.");
  });

  it("should throw error if source bank entry not found", async () => {
    await expect(
      service.applyBanked(101, 2023, 2024, 300)
    ).rejects.toThrow("No banked amount found for source year.");
  });

  it("should throw error if trying to apply more than banked", async () => {
    await bankRepo.create({
      shipId: 101,
      year: 2023,
      amountGco2eq: 200,
    });

    await expect(
      service.applyBanked(101, 2023, 2024, 300)
    ).rejects.toThrow("Cannot apply more than banked amount.");
  });

  it("should throw error if target compliance record not found", async () => {
    await bankRepo.create({
      shipId: 101,
      year: 2023,
      amountGco2eq: 300,
    });

    await expect(
      service.applyBanked(101, 2023, 2025, 300)
    ).rejects.toThrow("Target compliance record not found.");
  });
});

