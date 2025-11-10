import prisma from "../../../infrastructure/db/prisma.js";
import { IPoolMemberRepository } from "../../../core/ports/poolMember.repository.port.js";
import { PoolMember } from "../../../core/domain/poolMember.entity.js";
import { toNumberFields, toNumberFieldsArray } from "../../../shared/config/utils/decimal.utils.js";

/**
 * PrismaPoolMemberRepository
 * Handles PoolMember persistence using Prisma ORM.
 * Provides CRUD methods and ensures Decimal precision handling.
 */
export class PrismaPoolMemberRepository implements IPoolMemberRepository {
  /**
   * 🔍 Find all members of a given pool, sorted by cbBefore (descending).
   */
  async findByPoolId(poolId: number): Promise<PoolMember[]> {
    const members = await prisma.poolMember.findMany({
      where: { poolId },
      orderBy: { cbBefore: "desc" },
    });
    return toNumberFieldsArray(members, ["cbBefore", "cbAfter"]) as unknown as PoolMember[];
  }

  /**
   * 🔍 Find all pool memberships for a given ship.
   */
  async findByShipId(shipId: number): Promise<PoolMember[]> {
    const members = await prisma.poolMember.findMany({
      where: { shipId },
      orderBy: { poolId: "asc" },
    });
    return toNumberFieldsArray(members, ["cbBefore", "cbAfter"]) as unknown as PoolMember[];
  }

  /**
   * ➕ Add a new member to a pool.
   */
  async addMember(
    data: Omit<PoolMember, "createdAt" | "updatedAt">
  ): Promise<PoolMember> {
    const created = await prisma.poolMember.create({ data });
    return toNumberFields(created, ["cbBefore", "cbAfter"]) as unknown as PoolMember;
  }

  /**
   * ✏️ Update the `cbAfter` value for a specific pool member.
   */
  async updateCbAfter(
    poolId: number,
    shipId: number,
    cbAfter: number
  ): Promise<PoolMember> {
    const updated = await prisma.poolMember.update({
      where: { poolId_shipId: { poolId, shipId } }, // ✅ works because of named composite key
      data: { cbAfter },
    });
    return toNumberFields(updated, ["cbBefore", "cbAfter"]) as unknown as PoolMember;
  }

  /**
   * ❌ Delete a member from a specific pool.
   */
  async deleteMember(poolId: number, shipId: number): Promise<void> {
    await prisma.poolMember.delete({
      where: { poolId_shipId: { poolId, shipId } }, // ✅ composite primary key
    });
  }
}
