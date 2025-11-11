import { ShipCompliance } from "../domain/shipCompliance.entity";

export interface IShipComplianceRepository {
  /** Fetch all compliance records */
  findAll(): Promise<ShipCompliance[]>;

  /** Fetch all compliance records for a specific ship */
  findByShipId(shipId: number): Promise<ShipCompliance[]>;

  /** Fetch a specific compliance record for a ship and year */
  findByShipIdAndYear(
    shipId: number,
    year: number
  ): Promise<ShipCompliance | null>;


  /** Create a new compliance record */
  create(
    data: Omit<ShipCompliance, "id" | "createdAt" | "updatedAt">
  ): Promise<ShipCompliance>;

  /** Delete all compliance records for a specific ship */
  deleteByShipId(shipId: number): Promise<void>;

  /** ✅ NEW: Fetch all compliance records for a given year */
  findByYear(year: number): Promise<ShipCompliance[]>;

  /** ✅ NEW: Update a specific ship’s compliance record by shipId + year */
  updateByShipIdAndYear(
    shipId: number,
    year: number,
    data: Partial<ShipCompliance>
  ): Promise<ShipCompliance>;

  updateCb(shipId: number, year: number, newCb: number): Promise<ShipCompliance>;
}
