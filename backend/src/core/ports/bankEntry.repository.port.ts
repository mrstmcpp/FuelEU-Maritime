import { BankEntry } from "../domain/bankEntry.entity";

export interface IBankEntryRepository {
  findAll(): Promise<BankEntry[]>;
  findByShipId(shipId: number): Promise<BankEntry[]>;
  findByShipIdAndYear(shipId: number, year: number): Promise<BankEntry | null>;
  create(data: Omit<BankEntry, "id" | "createdAt" | "updatedAt">): Promise<BankEntry>;
  updateAmount(shipId: number, year: number, amountGco2eq: number): Promise<BankEntry>;
  deleteByShipId(shipId: number): Promise<void>;
}
