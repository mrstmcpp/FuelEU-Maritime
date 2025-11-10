// src/core/application/services/banking.service.ts
import { IBankEntryRepository } from "../../ports/bankEntry.repository.port.js";
import { BankEntry } from "../../domain/bankEntry.entity.js";

/**
 * BankingService
 * Implements FuelEU Article 20 — Banking mechanism.
 * Allows ships to store surplus CB (positive) and apply it against deficits (negative).
 */
export class BankingService {
  constructor(private readonly bankRepo: IBankEntryRepository) {}

  /**
   * ➕ Add or update a bank entry.
   * If an entry for (shipId, year) exists, it updates it instead of creating a duplicate.
   */
  async addBankEntry(
    shipId: number,
    year: number,
    amountGco2eq: number
  ): Promise<BankEntry> {
    const existing = await this.bankRepo.findByShipIdAndYear(shipId, year);
    if (existing) {
      const newAmount = existing.amountGco2eq + amountGco2eq;
      return this.bankRepo.updateAmount(shipId, year, newAmount);
    }
    return this.bankRepo.create({ shipId, year, amountGco2eq } as any);
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

  /**
   * 💰 Apply banked surplus to cover a deficit.
   * - Deducts from the earliest available (FIFO style)
   * - Ensures no negative balance
   */
  async applyBankedSurplus(
    shipId: number,
    applyAmount: number
  ): Promise<{ applied: number; remaining: number }> {
    const entries = await this.bankRepo.findByShipId(shipId);
    let remainingToApply = applyAmount;

    // Sort oldest first (FIFO)
    const sortedEntries = entries.sort((a, b) => a.year - b.year);

    for (const entry of sortedEntries) {
      if (remainingToApply <= 0) break;
      if (entry.amountGco2eq <= 0) continue;

      const deduction = Math.min(entry.amountGco2eq, remainingToApply);
      const newAmount = entry.amountGco2eq - deduction;

      await this.bankRepo.updateAmount(entry.shipId, entry.year, newAmount);

      remainingToApply -= deduction;
    }

    return {
      applied: applyAmount - remainingToApply,
      remaining: remainingToApply,
    };
  }
}
