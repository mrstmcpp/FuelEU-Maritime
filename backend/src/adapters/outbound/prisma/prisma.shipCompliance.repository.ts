import prisma from "../../../infrastructure/db/prisma";
import { IShipComplianceRepository } from "../../../core/ports/shipCompliance.repository.port";
import { ShipCompliance } from "../../../core/domain/shipCompliance.entity";

export class PrismaShipComplianceRepository implements IShipComplianceRepository {
  async findAll(): Promise<ShipCompliance[]> {
    return prisma.shipCompliance.findMany();
  }

  async findByShipId(shipId: number): Promise<ShipCompliance[]> {
    return prisma.shipCompliance.findMany({
      where: { shipId },
      orderBy: { year: "asc" },
    });
  }

  async findByShipIdAndYear(shipId: number, year: number): Promise<ShipCompliance | null> {
    return prisma.shipCompliance.findUnique({
      where: { shipId_year: { shipId, year } },
    });
  }

  async create(data: Omit<ShipCompliance, "id" | "createdAt" | "updatedAt">): Promise<ShipCompliance> {
    return prisma.shipCompliance.create({ data });
  }

  async deleteByShipId(shipId: number): Promise<void> {
    await prisma.shipCompliance.deleteMany({ where: { shipId } });
  }
}
