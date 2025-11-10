import type { ComplianceRecord } from "../../../core/domain/compliance.entity";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Fetch adjusted compliance balance (CB) for each ship in a given year.
 */
export async function getAdjustedCompliance(year: number): Promise<
  { shipId: number; adjustedCb: number }[]
> {
  const res = await fetch(`${BASE_URL}/compliance/adjusted-cb?year=${year}`);
  if (!res.ok) throw new Error("Failed to fetch adjusted compliance data");
  const json = await res.json();
  return json.data;
}
