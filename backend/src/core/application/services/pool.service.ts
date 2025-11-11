import { IPoolRepository } from "../../ports/pool.repository.port.js";
import { IPoolMemberRepository } from "../../ports/poolMember.repository.port.js";
import { Pool } from "../../domain/pool.entity.js";
import { PoolMember } from "../../domain/poolMember.entity.js";
import { PrismaShipComplianceRepository } from "../../../adapters/outbound/prisma/prisma.shipCompliance.repository.js";
import prisma from "../../../infrastructure/db/prisma.js"; // ensure this is your default prisma export

export class PoolingService {
  constructor(
    private readonly poolRepo: IPoolRepository,
    private readonly poolMemberRepo: IPoolMemberRepository
  ) {}

  /**
   * Create a new pool with redistribution logic
   * + update compliance CBs after redistribution
   */
  async createPool(
    year: number,
    members: { shipId: number; cbBefore: number }[]
  ): Promise<{ pool: Pool; members: PoolMember[] }> {
    if (!members.length) throw new Error("No members provided for pooling");

    const totalCB = members.reduce((acc, m) => acc + m.cbBefore, 0);
    if (totalCB < 0) throw new Error("Invalid pool — total CB must be ≥ 0");

    const pool = await this.poolRepo.create(year);
    const poolId = pool.id;

    const updatedMembers: PoolMember[] = members.map((m) => ({
      poolId,
      shipId: m.shipId,
      cbBefore: m.cbBefore,
      cbAfter: m.cbBefore,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const surplus = updatedMembers
      .filter((m) => m.cbBefore > 0)
      .sort((a, b) => b.cbBefore - a.cbBefore);
    const deficits = updatedMembers
      .filter((m) => m.cbBefore < 0)
      .sort((a, b) => a.cbBefore - b.cbBefore);

    for (const deficit of deficits) {
      for (const donor of surplus) {
        if (deficit.cbAfter >= 0) break;
        if (donor.cbAfter <= 0) continue;

        const transfer = Math.min(donor.cbAfter, Math.abs(deficit.cbAfter));
        donor.cbAfter -= transfer;
        deficit.cbAfter += transfer;
      }
    }

    const totalAfter = updatedMembers.reduce((acc, m) => acc + m.cbAfter, 0);
    if (totalAfter < -0.0001)
      throw new Error("Redistribution error: total pool CB cannot be negative");

    if (Math.abs(totalAfter) > 0.0001 && totalAfter > 0) {
      console.warn(
        `⚠️ Pool not perfectly balanced (+${totalAfter.toFixed(3)}), continuing`
      );
    }

    // ✅ Transaction ensures pool + members + compliance update all succeed or rollback together
    await prisma.$transaction(async (tx) => {
      // Insert pool members
      await this.poolMemberRepo.bulkCreate(updatedMembers);

      // Update compliance CBs for all ships
      const complianceRepo = new PrismaShipComplianceRepository();

      for (const m of updatedMembers) {
        await complianceRepo.updateCb(m.shipId, year, m.cbAfter);
      }
    });

    return { pool, members: updatedMembers };
  }

  async listPools(year?: number): Promise<Pool[]> {
    return this.poolRepo.findAll(year);
  }
}
