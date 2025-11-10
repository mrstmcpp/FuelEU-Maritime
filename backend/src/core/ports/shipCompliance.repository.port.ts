import { ShipCompliance } from "../domain/shipCompliance.entity";

export interface IShipComplianceRepository {
  findAll(): Promise<ShipCompliance[]>;
  findByShipId(shipId: number): Promise<ShipCompliance[]>;
  findByShipIdAndYear(shipId: number, year: number): Promise<ShipCompliance | null>;
  create(data: Omit<ShipCompliance, "id" | "createdAt" | "updatedAt">): Promise<ShipCompliance>;
  deleteByShipId(shipId: number): Promise<void>;
}
