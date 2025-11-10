import type { BankEntry } from "../../../core/domain/bankEntry.entity";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/** Get all banking records */
export async function getBankingRecords(): Promise<BankEntry[]> {
  const res = await fetch(`${BASE_URL}/banking/records`);
  if (!res.ok) throw new Error("Failed to fetch banking records");
  const json = await res.json();
  return json.data;
}

/** Apply banking logic */
export async function applyBanking(): Promise<{
  success: boolean;
  message: string;
  data?: BankEntry[];
}> {
  const res = await fetch(`${BASE_URL}/banking/apply`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to apply banking logic");
  const json = await res.json();
  return json;
}
