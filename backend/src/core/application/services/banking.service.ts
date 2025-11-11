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
   * 💰 Apply banked surplus to cover a deficit.
   * - Deducts from the earliest available (FIFO style)
   * - Updates ShipCompliance with new CB
   */
  async applyBankedSurplus(
    shipId: number,
    year: number,
    applyAmount: number
  ): Promise<{ success: boolean; message: string }> {
    const entries = await this.bankRepo.findByShipId(shipId);
    let remaining = applyAmount;

    // Sort oldest first
    const sorted = entries.sort((a, b) => a.year - b.year);

    for (const entry of sorted) {
      if (remaining <= 0) break;
      if (entry.amountGco2eq <= 0) continue;

      const deduct = Math.min(entry.amountGco2eq, remaining);
      const newAmount = entry.amountGco2eq - deduct;

      await this.bankRepo.updateAmount(entry.shipId, entry.year, newAmount);
      remaining -= deduct;
    }

    if (remaining > 0) {
      throw new Error("Not enough banked surplus to cover the requested amount.");
    }

    // ✅ Update ShipCompliance for target year
    const compliance = await this.complianceRepo.findByShipIdAndYear(shipId, year);
    if (!compliance) throw new Error("Compliance record not found for this year.");

    const updatedCb = Number(compliance.cbGco2eq) + applyAmount;
    await this.complianceRepo.updateCb(shipId, year, updatedCb);

    return {
      success: true,
      message: `Applied ${applyAmount} gCO₂eq to Ship ${shipId} for year ${year}.`,
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
