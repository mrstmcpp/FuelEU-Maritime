import prisma from "../../../infrastructure/db/prisma";
import { IShipRepository } from "../../../core/ports/ship.repository.port";
import { Ship } from "../../../core/domain/ship.entity";

export class PrismaShipRepository implements IShipRepository {
  async findAll(): Promise<Ship[]> {
    return prisma.ship.findMany({ orderBy: { id: "asc" } });
  }

  async findByShipId(shipId: number): Promise<Ship | null> {
    return prisma.ship.findUnique({ where: { shipId } });
  }

  async create(data: Omit<Ship, "id" | "createdAt" | "updatedAt">): Promise<Ship> {
    return prisma.ship.create({ data });
  }

  async deleteByShipId(shipId: number): Promise<void> {
    await prisma.ship.delete({ where: { shipId } });
  }
}
