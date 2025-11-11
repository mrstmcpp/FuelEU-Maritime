import { IBankEntryRepository } from "../../ports/bankEntry.repository.port.js";
import { IShipComplianceRepository } from "../../ports/shipCompliance.repository.port.js";
import { BankEntry } from "../../domain/bankEntry.entity.js";

/**
 * BankingService
 * Implements FuelEU Article 20 — Banking mechanism.
 * Allows ships to store surplus CB (positive) and apply it against deficits (negative).
 */
export class BankingService {
  constructor(
    private readonly bankRepo: IBankEntryRepository,
    private readonly complianceRepo: IShipComplianceRepository
  ) {}

  /**
   * ➕ Add or update a bank entry.
   * If an entry for (shipId, year) exists, it updates it instead of creating a duplicate.
   */
  async bankPositiveCB(shipId: number, year: number, amountGco2eq: number): Promise<BankEntry> {
    const existing = await this.bankRepo.findByShipIdAndYear(shipId, year);
    if (existing) {
      const newAmount = existing.amountGco2eq + amountGco2eq;
      return this.bankRepo.updateAmount(shipId, year, newAmount);
    }
    return this.bankRepo.create({ shipId, year, amountGco2eq } as any);
  }

  /**
   * ➕ Alias for bankPositiveCB for backward compatibility
   */
  async addBankEntry(shipId: number, year: number, amountGco2eq: number): Promise<BankEntry> {
    return this.bankPositiveCB(shipId, year, amountGco2eq);
  }

  /**
   * 💰 Apply banked surplus to cover a deficit.
   * - Deducts from the earliest available (FIFO style)
   * - Updates ShipCompliance with new CB
   * - Returns how much was applied and how much remains
   */
  async applyBankedSurplus(
    shipId: number,
    year: number,
    applyAmount: number
  ): Promise<{ applied: number; remaining: number }> {
    const entries = await this.bankRepo.findByShipId(shipId);
    let remaining = applyAmount;
    let applied = 0;

    // Sort oldest first
    const sorted = entries.sort((a, b) => a.year - b.year);

    for (const entry of sorted) {
      if (remaining <= 0) break;
      if (entry.amountGco2eq <= 0) continue;

      const deduct = Math.min(entry.amountGco2eq, remaining);
      const newAmount = entry.amountGco2eq - deduct;

      await this.bankRepo.updateAmount(entry.shipId, entry.year, newAmount);
      remaining -= deduct;
      applied += deduct;
    }

    // ✅ Update ShipCompliance for target year if something was applied
    if (applied > 0) {
      const compliance = await this.complianceRepo.findByShipIdAndYear(shipId, year);
      if (!compliance) throw new Error("Compliance record not found for this year.");

      const updatedCb = Number(compliance.cbGco2eq) + applied;
      await this.complianceRepo.updateCb(shipId, year, updatedCb);
    }

    return {
      applied,
      remaining,
    };
  }

  /**
   * 📜 Get all banking records for a ship.
   */
  async getShipBankEntries(shipId: number): Promise<BankEntry[]> {
    return this.bankRepo.findByShipId(shipId);
  }

  /**
   * 🧮 Compute total available (positive) surplus for a ship.
   */
  async computeTotalSurplus(shipId: number): Promise<number> {
    const entries = await this.bankRepo.findByShipId(shipId);
    return entries.reduce((acc, e) => acc + e.amountGco2eq, 0);
  }
}
