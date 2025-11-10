import type { Pool } from "../../../core/domain/pool.entity";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Create a new emission pool.
 */
export async function createPool(
  year: number,
  members: { shipId: number; cbBefore: number }[]
): Promise<Pool> {
  const res = await fetch(`${BASE_URL}/pools`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ year, members }),
  });
  if (!res.ok) throw new Error("Failed to create pool");
  const json = await res.json();
  return json.data;
}

/**
 * Fetch all existing pools.
 */
export async function getPools(): Promise<Pool[]> {
  const res = await fetch(`${BASE_URL}/pools`);
  if (!res.ok) throw new Error("Failed to load pools");
  const json = await res.json();
  return json.data;
}
