/**
 * Represents a ship's compliance balance (CB) record
 * for a specific reporting year, including adjusted CB
 * after banking or pooling effects.
 */
export interface ComplianceRecord {
  id?: number; // optional, if stored in DB
  shipId: number; // ship unique identifier
  year: number; // reporting year
  adjustedCb: number; // adjusted carbon balance (gCO₂e)
  createdAt?: Date;
  updatedAt?: Date;
}
