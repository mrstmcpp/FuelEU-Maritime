import prisma from "../../../infrastructure/db/prisma.js";
import { IShipComplianceRepository } from "../../../core/ports/shipCompliance.repository.port.js";
import { ShipCompliance } from "../../../core/domain/shipCompliance.entity.js";

/**
 * PrismaShipComplianceRepository
 * Handles persistence and retrieval of ship compliance data (CB records)
 * using Prisma ORM with consistent Decimal → number conversion.
 */
export class PrismaShipComplianceRepository
  implements IShipComplianceRepository
{
  /**
   * 📄 Get all compliance records (sorted by year).
   */
  async findAll(): Promise<ShipCompliance[]> {
    const records = await prisma.shipCompliance.findMany({
      orderBy: { year: "asc" },
    });
    return records.map(this.mapDecimalFields);
  }

  /**
   * 📊 Get all compliance records for a given ship.
   */
  async findByShipId(shipId: number): Promise<ShipCompliance[]> {
    const records = await prisma.shipCompliance.findMany({
      where: { shipId },
      orderBy: { year: "asc" },
    });
    return records.map(this.mapDecimalFields);
  }

  /**
   * 🔍 Find a specific record by shipId and year.
   */
  async findByShipIdAndYear(
    shipId: number,
    year: number
  ): Promise<ShipCompliance | null> {
    const record = await prisma.shipCompliance.findUnique({
      where: { shipId_year: { shipId, year } },
    });
    return record ? this.mapDecimalFields(record) : null;
  }

  /**
   * 📅 Find all compliance records for a specific year.
   */
  async findByYear(year: number): Promise<ShipCompliance[]> {
    const records = await prisma.shipCompliance.findMany({
      where: { year },
      orderBy: { shipId: "asc" },
    });
    return records.map(this.mapDecimalFields);
  }

  /**
   * ➕ Create a new compliance record.
   */
  async create(
    data: Omit<ShipCompliance, "id" | "createdAt" | "updatedAt">
  ): Promise<ShipCompliance> {
    const created = await prisma.shipCompliance.create({ data });
    return this.mapDecimalFields(created);
  }

  /**
   * ✏️ Update a compliance record by shipId + year.
   */
  async updateByShipIdAndYear(
    shipId: number,
    year: number,
    data: Partial<ShipCompliance>
  ): Promise<ShipCompliance> {
    const updated = await prisma.shipCompliance.update({
      where: { shipId_year: { shipId, year } },
      data,
    });
    return this.mapDecimalFields(updated);
  }

  /**
   * ❌ Delete all compliance records for a specific ship.
   */
  async deleteByShipId(shipId: number): Promise<void> {
    await prisma.shipCompliance.deleteMany({ where: { shipId } });
  }

  async updateCb(shipId: number, year: number, newCb: number): Promise<ShipCompliance> {
    const updated = await prisma.shipCompliance.update({
      where: { shipId_year: { shipId, year } },
      data: { cbGco2eq: newCb },
    });
    return this.mapDecimalFields(updated);
  }

  /**
   * 🧮 Utility — Convert Prisma Decimal to number.
   */
  private mapDecimalFields(record: any): ShipCompliance {
    return {
      ...record,
      cbGco2eq: Number(record.cbGco2eq),
    };
  }
}
