import { IPoolRepository } from "../../ports/pool.repository.port";
import { IPoolMemberRepository } from "../../ports/poolMember.repository.port";
import { Pool } from "../../domain/pool.entity";
import { PoolMember } from "../../domain/poolMember.entity";
import { CONSTANTS } from "../../../shared/config/constants.js";

type PoolMemberInput = {
  shipId: number;
  cbBefore: number;
};

export class PoolService {
  private readonly poolRepo: IPoolRepository;
  private readonly memberRepo: IPoolMemberRepository;

  constructor(poolRepo: IPoolRepository, memberRepo: IPoolMemberRepository) {
    this.poolRepo = poolRepo;
    this.memberRepo = memberRepo;
  }

  /**
   * Create a pool for a given year with initial members.
   * Each member starts with cbAfter = cbBefore.
   * Sum of cbBefore must be >= POOL_MIN_TOTAL_CB_REQUIRED.
   */
  async createPool(year: number, members: PoolMemberInput[]): Promise<{ pool: Pool; members: PoolMember[] }> {
    const total = members.reduce((sum, m) => sum + m.cbBefore, 0);
    if (total < CONSTANTS.POOL_MIN_TOTAL_CB_REQUIRED) {
      throw new Error("Invalid pool: total CB must be >= 0.");
    }

    const existing = await this.poolRepo.findByYear(year);
    if (existing) {
      await this.memberRepo.findByPoolId(existing.id).then(async (ms) => {
        for (const m of ms) await this.memberRepo.deleteMember(existing.id, m.shipId);
      });
      await this.poolRepo.deleteByYear(year);
    }

    const pool = await this.poolRepo.create(year);
    const createdMembers: PoolMember[] = [];
    for (const m of members) {
      const created = await this.memberRepo.addMember({
        poolId: pool.id,
        shipId: m.shipId,
        cbBefore: m.cbBefore,
        cbAfter: m.cbBefore,
      });
      createdMembers.push(created);
    }

    return { pool, members: createdMembers };
  }
}


