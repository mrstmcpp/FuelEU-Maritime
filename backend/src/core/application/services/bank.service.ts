import { IBankEntryRepository } from "../../ports/bankEntry.repository.port";
import { IShipComplianceRepository } from "../../ports/shipCompliance.repository.port";
import { BankEntry } from "../../domain/bankEntry.entity";
import { ShipCompliance } from "../../domain/shipCompliance.entity";
import { CONSTANTS } from "../../../shared/config/constants";

export class BankService {
  private readonly bankRepo: IBankEntryRepository;
  private readonly complianceRepo: IShipComplianceRepository;

  constructor(bankRepo: IBankEntryRepository, complianceRepo: IShipComplianceRepository) {
    this.bankRepo = bankRepo;
    this.complianceRepo = complianceRepo;
  }

  /**
   * Move a positive compliance balance to bank for a given ship and year.
   * Throws if CB <= BANKING_MIN_SURPLUS_THRESHOLD.
   */
  async bankSurplus(shipId: number, year: number): Promise<BankEntry> {
    const record = await this.complianceRepo.findByShipIdAndYear(shipId, year);
    if (!record) throw new Error("Compliance record not found.");

    if (record.cbGco2eq <= CONSTANTS.BANKING_MIN_SURPLUS_THRESHOLD) {
      throw new Error("Only positive CB can be banked.");
    }

    // Create or update bank entry for the same year
    const existing = await this.bankRepo.findByShipIdAndYear(shipId, year);
    if (existing) {
      return this.bankRepo.updateAmount(shipId, year, existing.amountGco2eq + record.cbGco2eq);
    }
    return this.bankRepo.create({ shipId, year, amountGco2eq: record.cbGco2eq });
  }

  /**
   * Apply previously banked CB from one year towards another year.
   * Throws on over-application or if no banked amount exists.
   */
  async applyBanked(shipId: number, fromYear: number, toYear: number, amountGco2eq: number): Promise<{
    updatedFrom: BankEntry;
    updatedTo: ShipCompliance;
  }> {
    if (amountGco2eq <= 0) throw new Error("Amount must be positive.");

    const from = await this.bankRepo.findByShipIdAndYear(shipId, fromYear);
    if (!from) throw new Error("No banked amount found for source year.");
    if (amountGco2eq > from.amountGco2eq) throw new Error("Cannot apply more than banked amount.");

    const to = await this.complianceRepo.findByShipIdAndYear(shipId, toYear);
    if (!to) throw new Error("Target compliance record not found.");

    const newFromAmount = from.amountGco2eq - amountGco2eq;
    const updatedFrom = await this.bankRepo.updateAmount(shipId, fromYear, newFromAmount);

    // Apply against target year's CB
    const adjusted = { ...to, cbGco2eq: to.cbGco2eq + amountGco2eq };
    await this.complianceRepo.deleteByShipId(shipId);
    const updatedTo = await this.complianceRepo.create({
      shipId,
      year: toYear,
      cbGco2eq: adjusted.cbGco2eq,
    });

    return { updatedFrom, updatedTo };
  }
}


