import type { RouteComparison } from "../../../core/domain/comparison.entity";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function getRouteComparisons(): Promise<RouteComparison[]> {
  const res = await fetch(`${BASE_URL}/routes/comparison`);
  if (!res.ok) throw new Error("Failed to fetch route comparisons");
  const json = await res.json();
  return json.data;
}
