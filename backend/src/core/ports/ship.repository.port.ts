import { Ship } from "../domain/ship.entity";

export interface IShipRepository {
  findAll(): Promise<Ship[]>;
  findByShipId(shipId: number): Promise<Ship | null>;
  create(data: Omit<Ship, "id" | "createdAt" | "updatedAt">): Promise<Ship>;
  deleteByShipId(shipId: number): Promise<void>;
}
