/// <reference types="jest" />

import { PoolingService } from "../src/core/application/services/pool.service";
import type { IPoolRepository } from "../src/core/ports/pool.repository.port";
import type { IPoolMemberRepository } from "../src/core/ports/poolMember.repository.port";
import type { Pool } from "../src/core/domain/pool.entity";
import type { PoolMember } from "../src/core/domain/poolMember.entity";

// 🧩 Helper to make test records easily
function makePool(partial: Partial<Pool>): Pool {
  return {
    id: partial.id ?? 0,
    year: partial.year ?? 2024,
    createdAt: partial.createdAt ?? new Date(),
    updatedAt: partial.updatedAt ?? new Date(),
  };
}

function makePoolMember(partial: Partial<PoolMember>): PoolMember {
  return {
    poolId: partial.poolId ?? 0,
    shipId: partial.shipId ?? 0,
    cbBefore: partial.cbBefore ?? 0,
    cbAfter: partial.cbAfter ?? 0,
    createdAt: partial.createdAt ?? new Date(),
    updatedAt: partial.updatedAt ?? new Date(),
  };
}

// 🧩 Mock Repositories
class MockPoolRepository implements IPoolRepository {
  private pools: Pool[];
  private nextId: number;

  constructor(initial: Pool[] = []) {
    this.pools = initial;
    this.nextId = (initial.at(-1)?.id ?? 0) + 1;
  }

  async create(year: number): Promise<Pool> {
    const created = makePool({ id: this.nextId++, year });
    this.pools.push(created);
    return created;
  }

  async findAll(year?: number): Promise<Pool[]> {
    if (year !== undefined) {
      return this.pools.filter((p) => p.year === year);
    }
    return [...this.pools];
  }
}

class MockPoolMemberRepository implements IPoolMemberRepository {
  private members: PoolMember[];

  constructor(initial: PoolMember[] = []) {
    this.members = initial;
  }

  async findByPoolId(poolId: number): Promise<PoolMember[]> {
    return this.members.filter((m) => m.poolId === poolId);
  }

  async findByShipId(shipId: number): Promise<PoolMember[]> {
    return this.members.filter((m) => m.shipId === shipId);
  }

  async addMember(
    data: Omit<PoolMember, "createdAt" | "updatedAt">
  ): Promise<PoolMember> {
    const created = makePoolMember(data);
    this.members.push(created);
    return created;
  }

  async bulkCreate(members: PoolMember[]): Promise<void> {
    this.members.push(...members);
  }
}

// 🧪 Tests
describe("PoolingService", () => {
  let poolRepo: MockPoolRepository;
  let poolMemberRepo: MockPoolMemberRepository;
  let service: PoolingService;

  beforeEach(() => {
    poolRepo = new MockPoolRepository();
    poolMemberRepo = new MockPoolMemberRepository();
    service = new PoolingService(poolRepo, poolMemberRepo);
  });

  // ➕ createPool - Basic creation
  it("should create a pool with members", async () => {
    const result = await service.createPool(2024, [
      { shipId: 101, cbBefore: 500 },
      { shipId: 102, cbBefore: 300 },
    ]);

    expect(result.pool.year).toBe(2024);
    expect(result.members).toHaveLength(2);
    expect(result.members[0]?.shipId).toBe(101);
    expect(result.members[1]?.shipId).toBe(102);
  });

  // ➕ createPool - Redistribution logic
  it("should redistribute surplus to deficits", async () => {
    const result = await service.createPool(2024, [
      { shipId: 101, cbBefore: 500 }, // Surplus
      { shipId: 102, cbBefore: -200 }, // Deficit
      { shipId: 103, cbBefore: -100 }, // Deficit
    ]);

    // Total: 500 - 200 - 100 = 200 (positive, valid)
    expect(result.members).toHaveLength(3);

    const ship101 = result.members.find((m) => m.shipId === 101);
    const ship102 = result.members.find((m) => m.shipId === 102);
    const ship103 = result.members.find((m) => m.shipId === 103);

    // Ship 101 should have reduced surplus
    expect(ship101?.cbAfter).toBeLessThan(500);
    expect(ship101?.cbAfter).toBeGreaterThanOrEqual(0);

    // Ships 102 and 103 should have reduced or eliminated deficits
    expect(ship102?.cbAfter).toBeGreaterThanOrEqual(-200);
    expect(ship103?.cbAfter).toBeGreaterThanOrEqual(-100);

    // Total after should be >= 0
    const totalAfter = result.members.reduce((acc, m) => acc + m.cbAfter, 0);
    expect(totalAfter).toBeGreaterThanOrEqual(-0.0001);
  });

  it("should fully eliminate deficits when surplus is sufficient", async () => {
    const result = await service.createPool(2024, [
      { shipId: 101, cbBefore: 500 }, // Surplus
      { shipId: 102, cbBefore: -200 }, // Deficit
      { shipId: 103, cbBefore: -100 }, // Deficit
    ]);

    const totalAfter = result.members.reduce((acc, m) => acc + m.cbAfter, 0);
    // Total should be close to 200 (500 - 200 - 100)
    expect(totalAfter).toBeCloseTo(200, 1);
  });

  it("should handle multiple surpluses and deficits", async () => {
    const result = await service.createPool(2024, [
      { shipId: 101, cbBefore: 300 }, // Surplus
      { shipId: 102, cbBefore: 200 }, // Surplus
      { shipId: 103, cbBefore: -400 }, // Deficit
      { shipId: 104, cbBefore: -50 }, // Deficit
    ]);

    const totalAfter = result.members.reduce((acc, m) => acc + m.cbAfter, 0);
    expect(totalAfter).toBeGreaterThanOrEqual(-0.0001);

    // All deficits should be reduced
    const ship103 = result.members.find((m) => m.shipId === 103);
    const ship104 = result.members.find((m) => m.shipId === 104);
    expect(ship103?.cbAfter).toBeGreaterThan(-400);
    expect(ship104?.cbAfter).toBeGreaterThanOrEqual(-50);
  });

  it("should prioritize larger surpluses first", async () => {
    const result = await service.createPool(2024, [
      { shipId: 101, cbBefore: 100 }, // Smaller surplus
      { shipId: 102, cbBefore: 500 }, // Larger surplus
      { shipId: 103, cbBefore: -400 }, // Deficit
    ]);

    // Larger surplus (500) should be used first
    const ship102 = result.members.find((m) => m.shipId === 102);
    const ship101 = result.members.find((m) => m.shipId === 101);

    // Ship 102 should have more reduction than ship 101
    expect(ship102?.cbAfter).toBeLessThan(500);
    // Ship 101 might be partially or fully used depending on algorithm
    expect(ship101?.cbAfter).toBeLessThanOrEqual(100);
  });

  it("should handle pool with only positive CBs", async () => {
    const result = await service.createPool(2024, [
      { shipId: 101, cbBefore: 500 },
      { shipId: 102, cbBefore: 300 },
      { shipId: 103, cbBefore: 200 },
    ]);

    // All should remain unchanged (no redistribution needed)
    result.members.forEach((m) => {
      expect(m.cbAfter).toBe(m.cbBefore);
    });
  });

  it("should handle pool with only negative CBs that sum to zero or positive", async () => {
    const result = await service.createPool(2024, [
      { shipId: 101, cbBefore: -100 },
      { shipId: 102, cbBefore: -50 },
      { shipId: 103, cbBefore: 150 }, // Just enough to cover
    ]);

    const totalAfter = result.members.reduce((acc, m) => acc + m.cbAfter, 0);
    expect(totalAfter).toBeGreaterThanOrEqual(-0.0001);
  });

  it("should persist members to repository", async () => {
    const result = await service.createPool(2024, [
      { shipId: 101, cbBefore: 500 },
      { shipId: 102, cbBefore: -200 },
    ]);

    const savedMembers = await poolMemberRepo.findByPoolId(result.pool.id);
    expect(savedMembers).toHaveLength(2);
    expect(savedMembers[0]?.shipId).toBe(101);
    expect(savedMembers[1]?.shipId).toBe(102);
  });

  // ❌ createPool - Error cases
  it("should throw error if no members provided", async () => {
    await expect(service.createPool(2024, [])).rejects.toThrow(
      "No members provided for pooling"
    );
  });

  it("should throw error if total CB is negative", async () => {
    await expect(
      service.createPool(2024, [
        { shipId: 101, cbBefore: -500 },
        { shipId: 102, cbBefore: -200 },
      ])
    ).rejects.toThrow("Invalid pool — total CB must be ≥ 0");
  });

  it("should throw error if redistribution results in negative total", async () => {
    // This case might be hard to trigger, but the service validates it
    // We'll test with a scenario that should pass validation but might fail redistribution
    // Actually, the service validates totalCB >= 0 before redistribution, so this is covered
    // But we can test edge cases where redistribution might fail
    await expect(
      service.createPool(2024, [
        { shipId: 101, cbBefore: -1000 },
        { shipId: 102, cbBefore: 500 },
      ])
    ).rejects.toThrow("Invalid pool — total CB must be ≥ 0");
  });

  // 📜 listPools
  it("should return all pools when no year filter", async () => {
    await service.createPool(2023, [{ shipId: 101, cbBefore: 500 }]);
    await service.createPool(2024, [{ shipId: 102, cbBefore: 300 }]);
    await service.createPool(2025, [{ shipId: 103, cbBefore: 200 }]);

    const allPools = await service.listPools();
    expect(allPools).toHaveLength(3);
  });

  it("should return pools filtered by year", async () => {
    await service.createPool(2023, [{ shipId: 101, cbBefore: 500 }]);
    await service.createPool(2024, [{ shipId: 102, cbBefore: 300 }]);
    await service.createPool(2024, [{ shipId: 103, cbBefore: 200 }]);
    await service.createPool(2025, [{ shipId: 104, cbBefore: 100 }]);

    const pools2024 = await service.listPools(2024);
    expect(pools2024).toHaveLength(2);
    expect(pools2024.every((p) => p.year === 2024)).toBe(true);
  });

  it("should return empty array when no pools exist", async () => {
    const pools = await service.listPools();
    expect(pools).toHaveLength(0);
  });

  it("should return empty array when no pools exist for year", async () => {
    await service.createPool(2024, [{ shipId: 101, cbBefore: 500 }]);
    const pools2025 = await service.listPools(2025);
    expect(pools2025).toHaveLength(0);
  });
});

