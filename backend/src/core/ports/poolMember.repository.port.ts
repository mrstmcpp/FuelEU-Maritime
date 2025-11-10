import { PoolMember } from "../domain/poolMember.entity";


export interface IPoolMemberRepository {
  findByPoolId(poolId: number): Promise<PoolMember[]>;
  findByShipId(shipId: number): Promise<PoolMember[]>;
  addMember(data: Omit<PoolMember, "createdAt" | "updatedAt">): Promise<PoolMember>;
  bulkCreate(members: PoolMember[]): Promise<void>;
}
