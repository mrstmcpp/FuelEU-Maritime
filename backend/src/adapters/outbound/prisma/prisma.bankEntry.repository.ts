import prisma from "../../../infrastructure/db/prisma.js";
import { IBankEntryRepository } from "../../../core/ports/bankEntry.repository.port.js";
import { BankEntry } from "../../../core/domain/bankEntry.entity.js";
import { toNumberFields, toNumberFieldsArray } from "../../../shared/config/utils/decimal.utils.js";

/**
 * PrismaBankEntryRepository
 * Handles persistence of banked CO₂ surplus/deficit entries.
 * Ensures Decimal → number conversion at the ORM boundary.
 */
export class PrismaBankEntryRepository implements IBankEntryRepository {
  /**
   * 🔍 Fetch all bank entries across all ships.
   */
  async findAll(): Promise<BankEntry[]> {
    const entries = await prisma.bankEntry.findMany({ orderBy: { year: "asc" } });
    return toNumberFieldsArray(entries, ["amountGco2eq"]) as unknown as BankEntry[];
  }

  /**
   * 🔍 Find all bank entries for a specific ship.
   */
  async findByShipId(shipId: number): Promise<BankEntry[]> {
    const entries = await prisma.bankEntry.findMany({
      where: { shipId },
      orderBy: { year: "asc" },
    });
    return toNumberFieldsArray(entries, ["amountGco2eq"]) as unknown as BankEntry[];
  }

  /**
   * 🔍 Find a single bank entry by ship and year.
   */
  async findByShipIdAndYear(shipId: number, year: number): Promise<BankEntry | null> {
    const entry = await prisma.bankEntry.findFirst({
      where: { shipId, year },
    });
    return entry ? (toNumberFields(entry, ["amountGco2eq"]) as unknown as BankEntry) : null;
  }

  /**
   * ➕ Create a new bank entry record.
   */
  async create(
    data: Omit<BankEntry, "id" | "createdAt" | "updatedAt">
  ): Promise<BankEntry> {
    const created = await prisma.bankEntry.create({ data });
    return toNumberFields(created, ["amountGco2eq"]) as unknown as BankEntry;
  }

  /**
   * ✏️ Update the CO₂ amount for an existing ship/year entry.
   */
  async updateAmount(
    shipId: number,
    year: number,
    amountGco2eq: number
  ): Promise<BankEntry> {
    const updated = await prisma.bankEntry.update({
      where: { bank_shipId_year: { shipId, year } }, // ✅ composite unique key
      data: { amountGco2eq },
    });
    return toNumberFields(updated, ["amountGco2eq"]) as unknown as BankEntry;
  }

  /**
   * ❌ Delete all bank entries for a given ship.
   */
  async deleteByShipId(shipId: number): Promise<void> {
    await prisma.bankEntry.deleteMany({ where: { shipId } });
  }
}
