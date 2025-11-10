import type { Pool } from "../../../core/domain/pool.entity";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Create a new emission pool.
 * 
 * @param year - Pool year
 * @param members - Ships with cbBefore/cbAfter values
 * @returns The created Pool object (with redistributed cbAfter)
 */
export async function createPool(
  year: number,
  members: { shipId: number; cbBefore: number; cbAfter?: number }[]
): Promise<Pool> {
  try {
    const res = await fetch(`${BASE_URL}/pools`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, members }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || "Failed to create pool");
    }

    // Backend returns { success, data: { pool, members } }
    return json.data?.pool
      ? { ...json.data.pool, members: json.data.members || [] }
      : json.data;
  } catch (err: any) {
    console.error("Error creating pool:", err);
    throw new Error(err.message || "Failed to create pool");
  }
}

/**
 * Fetch adjusted CB values per ship for a given year.
 * Used for populating Pooling tab.
 */
export async function fetchAdjustedCBs(year: number): Promise<
  { shipId: number; adjustedCb: number }[]
> {
  try {
    const res = await fetch(`${BASE_URL}/compliance/adjusted-cb?year=${year}`);
    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.message || "Failed to fetch adjusted CBs");
    }

    return json.data.map((d: any) => ({
      shipId: d.shipId,
      adjustedCb: Number(d.adjustedCb || d.cbGco2eq || 0),
    }));
  } catch (err: any) {
    console.error("Error fetching adjusted CBs:", err);
    throw new Error(err.message || "Error fetching adjusted CBs");
  }
}

/**
 * Fetch all created pools (optional, for history display).
 */
export async function fetchAllPools(year?: number): Promise<Pool[]> {
  try {
    const query = year ? `?year=${year}` : "";
    const res = await fetch(`${BASE_URL}/pools${query}`);
    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.message || "Failed to fetch pools");
    }

    return json.data || [];
  } catch (err: any) {
    console.error("Error fetching pools:", err);
    throw new Error(err.message || "Error fetching pools");
  }
}
