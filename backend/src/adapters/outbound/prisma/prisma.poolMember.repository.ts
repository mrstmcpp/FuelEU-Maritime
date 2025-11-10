import prisma from "../../../infrastructure/db/prisma";
import { IPoolMemberRepository } from "../../../core/ports/poolMember.repository.port";
import { PoolMember } from "../../../core/domain/poolMember.entity";

export class PrismaPoolMemberRepository implements IPoolMemberRepository {
  async findByPoolId(poolId: number): Promise<PoolMember[]> {
    return prisma.poolMember.findMany({ where: { poolId } });
  }

  async findByShipId(shipId: number): Promise<PoolMember[]> {
    return prisma.poolMember.findMany({ where: { shipId } });
  }

  async addMember(data: Omit<PoolMember, "createdAt" | "updatedAt">): Promise<PoolMember> {
    return prisma.poolMember.create({ data });
  }

  async updateCbAfter(poolId: number, shipId: number, cbAfter: number): Promise<PoolMember> {
    return prisma.poolMember.update({
      where: { poolId_shipId: { poolId, shipId } },
      data: { cbAfter },
    });
  }

  async deleteMember(poolId: number, shipId: number): Promise<void> {
    await prisma.poolMember.delete({
      where: { poolId_shipId: { poolId, shipId } },
    });
  }
}
