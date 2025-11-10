import prisma from "../../../infrastructure/db/prisma";
import { IBankEntryRepository } from "../../../core/ports/bankEntry.repository.port";
import { BankEntry } from "../../../core/domain/bankEntry.entity";

export class PrismaBankEntryRepository implements IBankEntryRepository {
  async findAll(): Promise<BankEntry[]> {
    return prisma.bankEntry.findMany();
  }

  async findByShipId(shipId: number): Promise<BankEntry[]> {
    return prisma.bankEntry.findMany({ where: { shipId } });
  }

  async findByShipIdAndYear(shipId: number, year: number): Promise<BankEntry | null> {
    return prisma.bankEntry.findUnique({ where: { shipId_year: { shipId, year } } });
  }

  async create(data: Omit<BankEntry, "id" | "createdAt" | "updatedAt">): Promise<BankEntry> {
    return prisma.bankEntry.create({ data });
  }

  async updateAmount(shipId: number, year: number, amountGco2eq: number): Promise<BankEntry> {
    return prisma.bankEntry.update({
      where: { shipId_year: { shipId, year } },
      data: { amountGco2eq },
    });
  }

  async deleteByShipId(shipId: number): Promise<void> {
    await prisma.bankEntry.deleteMany({ where: { shipId } });
  }
}
