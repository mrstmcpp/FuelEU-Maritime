import prisma from "../../../infrastructure/db/prisma.js";
import { IPoolMemberRepository } from "../../../core/ports/poolMember.repository.port.js";
import { PoolMember } from "../../../core/domain/poolMember.entity.js";
import { toNumberFields, toNumberFieldsArray } from "../../../shared/config/utils/decimal.utils.js";

/**
 * PrismaPoolMemberRepository
 * Handles PoolMember persistence using Prisma ORM.
 * Provides CRUD + bulk insert methods.
 */
export class PrismaPoolMemberRepository implements IPoolMemberRepository {
  /**
   * 🔍 Find all members of a given pool
   */
  async findByPoolId(poolId: number): Promise<PoolMember[]> {
    const members = await prisma.poolMember.findMany({
      where: { poolId },
      orderBy: { cbBefore: "desc" },
    });
    return toNumberFieldsArray(members, ["cbBefore", "cbAfter"]) as unknown as PoolMember[];
  }

  /**
   * 🔍 Find all pools a given ship is part of
   */
  async findByShipId(shipId: number): Promise<PoolMember[]> {
    const members = await prisma.poolMember.findMany({
      where: { shipId },
      orderBy: { poolId: "asc" },
    });
    return toNumberFieldsArray(members, ["cbBefore", "cbAfter"]) as unknown as PoolMember[];
  }

  /**
   * ➕ Add a single member
   */
  async addMember(
    data: Omit<PoolMember, "createdAt" | "updatedAt">
  ): Promise<PoolMember> {
    const created = await prisma.poolMember.create({ data });
    return toNumberFields(created, ["cbBefore", "cbAfter"]) as unknown as PoolMember;
  }

  /**
   * 💥 Bulk insert multiple members (used during pool creation)
   */
  async bulkCreate(members: PoolMember[]): Promise<void> {
    if (!members.length) return;
    await prisma.poolMember.createMany({
      data: members.map((m) => ({
        poolId: m.poolId,
        shipId: m.shipId,
        cbBefore: m.cbBefore,
        cbAfter: m.cbAfter,
      })),
      skipDuplicates: true,
    });
  }

  /**
   * 🗑️ Delete a specific member from a pool
   */
  async deleteMember(poolId: number, shipId: number): Promise<void> {
    await prisma.poolMember.delete({
      where: { poolId_shipId: { poolId, shipId } },
    });
  }
}
