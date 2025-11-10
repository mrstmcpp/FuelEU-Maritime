export interface PoolMember {
  shipId: number;
  cbBefore: number;
  cbAfter: number;
}

export interface Pool {
  id: number;
  year: number;
  members: PoolMember[];
  createdAt: Date;
}
