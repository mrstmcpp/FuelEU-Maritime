import { IPoolRepository } from "../../ports/pool.repository.port.js";
import { IPoolMemberRepository } from "../../ports/poolMember.repository.port.js";
import { Pool } from "../../domain/pool.entity.js";
import { PoolMember } from "../../domain/poolMember.entity.js";

export class PoolingService {
  constructor(
    private readonly poolRepo: IPoolRepository,
    private readonly poolMemberRepo: IPoolMemberRepository
  ) {}

  /**
   * Create a new pool with redistribution logic
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

    const surplus = updatedMembers.filter((m) => m.cbBefore > 0).sort((a, b) => b.cbBefore - a.cbBefore);
    const deficits = updatedMembers.filter((m) => m.cbBefore < 0).sort((a, b) => a.cbBefore - b.cbBefore);

    for (const deficit of deficits) {
      for (const donor of surplus) {
        if (deficit.cbAfter >= 0) break;
        if (donor.cbAfter <= 0) continue;

        const transfer = Math.min(donor.cbAfter, Math.abs(deficit.cbAfter));
        donor.cbAfter -= transfer;
        deficit.cbAfter += transfer;
      }
    }

    // ✅ Validation after redistribution
    const totalAfter = updatedMembers.reduce((acc, m) => acc + m.cbAfter, 0);
    if (Math.abs(totalAfter) > 0.0001) {
      throw new Error("Redistribution error: pool does not balance to zero");
    }

    await this.poolMemberRepo.bulkCreate(updatedMembers);
    return { pool, members: updatedMembers };
  }

  /**
   * List all pools with members for a given year
   */
  async listPools(year?: number): Promise<Pool[]> {
    return this.poolRepo.findAll(year);
  }
}
