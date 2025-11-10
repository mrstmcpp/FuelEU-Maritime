import { IShipComplianceRepository } from "../../ports/shipCompliance.repository.port";
import { ShipCompliance } from "../../domain/shipCompliance.entity";
import { CONSTANTS } from "../../../shared/config/constants";

/**
 * ComplianceService
 * Handles calculation, retrieval, and adjustment of Compliance Balances (CB)
 * for ships as per FuelEU Maritime.
 */
export class ComplianceService {
  private readonly repo: IShipComplianceRepository;

  constructor(repo: IShipComplianceRepository) {
    this.repo = repo;
  }

  /**
   * 🧮 Compute and store a new compliance balance (CB) record for a ship and year.
   * 
   * Formula:
   *   EnergyInScope = fuelConsumptionTons × ENERGY_FACTOR_MJ_PER_TON
   *   CB (gCO2e) = (TARGET_INTENSITY - actualIntensity) × EnergyInScope
   */
  async computeCB(
    shipId: number,
    year: number,
    fuelConsumptionTons: number,
    actualIntensity: number
  ): Promise<ShipCompliance> {
    if (fuelConsumptionTons <= 0)
      throw new Error("Fuel consumption must be greater than zero.");
    if (actualIntensity <= 0)
      throw new Error("Actual intensity must be greater than zero.");

    const energyInScope =
      fuelConsumptionTons * CONSTANTS.ENERGY_FACTOR_MJ_PER_TON;
    const cbGco2eq =
      (CONSTANTS.TARGET_INTENSITY_GCO2E_PER_MJ - actualIntensity) *
      energyInScope;

    return this.repo.create({
      shipId,
      year,
      cbGco2eq,
    });
  }

  /**
   * 📄 Fetch all compliance records for a specific ship.
   */
  async getComplianceHistory(shipId: number): Promise<ShipCompliance[]> {
    return this.repo.findByShipId(shipId);
  }

  /**
   * 🔍 Get a single compliance record for a specific ship and year.
   */
  async getComplianceByYear(
    shipId: number,
    year: number
  ): Promise<ShipCompliance | null> {
    return this.repo.findByShipIdAndYear(shipId, year);
  }


  async complianceByYear(
    year: number
  ): Promise<ShipCompliance | null> {
    const records = await this.repo.findByYear(year);
    return records.length > 0 ? records[0] as ShipCompliance : null;
  }

  /**
   * ✏️ Adjust compliance balance (CB) for a specific ship/year (e.g., after banking/pooling).
   */
  async adjustCB(
    shipId: number,
    year: number,
    adjustment: number
  ): Promise<ShipCompliance> {
    const record = await this.repo.findByShipIdAndYear(shipId, year);
    if (!record) throw new Error("Compliance record not found.");

    const updatedCB = Number(record.cbGco2eq) + adjustment;

    // Update rather than delete + recreate
    return this.repo.updateByShipIdAndYear(shipId, year, { cbGco2eq: updatedCB });
  }

  /**
   * 📊 Fetch all adjusted CB values for a given year (used by pooling).
   */
  async getAdjustedCBs(year: number): Promise<
    { shipId: number; year: number; adjustedCb: number }[]
  > {
    const records = await this.repo.findByYear(year);
    return records.map((r) => ({
      shipId: r.shipId,
      year: r.year,
      adjustedCb: Number(r.cbGco2eq),
    }));
  }
}
