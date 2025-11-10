import { Pool } from "../domain/pool.entity";

export interface IPoolRepository {
  findAll(): Promise<Pool[]>;
  findByYear(year: number): Promise<Pool | null>;
  create(year: number): Promise<Pool>;
  deleteByYear(year: number): Promise<void>;
}
