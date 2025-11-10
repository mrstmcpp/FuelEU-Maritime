export interface PoolMember {
  shipId: number;
  cbBefore: number;
  cbAfter: number;
}

export interface Pool {
  id: number;
  year: number;
  members: {
    shipId: number;
    cbBefore: number;
    cbAfter: number;
  }[];
  createdAt: Date;
  updatedAt?: Date;
}
