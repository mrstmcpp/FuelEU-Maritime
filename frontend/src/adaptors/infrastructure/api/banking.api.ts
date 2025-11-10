import type { BankEntry } from "../../../core/domain/bankEntry.entity";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/** Get all banking records */
export async function getBankingRecords(shipId: number, year?: number): Promise<BankEntry[]> {
  const query = new URLSearchParams();
  query.append("shipId", shipId.toString());
  if (year) query.append("year", year.toString());

  const res = await fetch(`${BASE_URL}/banking/records?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch banking records");
  const json = await res.json();
  return json.data;
}

/** Bank a positive CB */
export async function bankPositiveCB(shipId: number, year: number, amountGco2eq: number) {
  const res = await fetch(`${BASE_URL}/banking/bank`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shipId, year, amountGco2eq }),
  });
  if (!res.ok) throw new Error("Failed to bank CB");
  return res.json();
}

/** Apply banked CB to offset deficit */
export async function applyBanking(shipId: number, applyAmount: number) {
  const res = await fetch(`${BASE_URL}/banking/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shipId, applyAmount }),
  });
  if (!res.ok) throw new Error("Failed to apply banking");
  return res.json();
}
