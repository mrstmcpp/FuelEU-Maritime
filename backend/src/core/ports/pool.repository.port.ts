import { Pool } from "../domain/pool.entity";

export interface IPoolRepository {
  create(year: number): Promise<Pool>;
  findAll(year?: number): Promise<Pool[]>;
}
