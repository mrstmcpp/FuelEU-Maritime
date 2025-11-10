import prisma from "../../../infrastructure/db/prisma";
import { IPoolRepository } from "../../../core/ports/pool.repository.port";
import { Pool } from "../../../core/domain/pool.entity";

export class PrismaPoolRepository implements IPoolRepository {
  async findAll(): Promise<Pool[]> {
    return prisma.pool.findMany({ orderBy: { year: "asc" } });
  }

  async findByYear(year: number): Promise<Pool | null> {
    return prisma.pool.findFirst({ where: { year } });
  }

  async create(year: number): Promise<Pool> {
    return prisma.pool.create({ data: { year } });
  }

  async deleteByYear(year: number): Promise<void> {
    await prisma.pool.deleteMany({ where: { year } });
  }
}
