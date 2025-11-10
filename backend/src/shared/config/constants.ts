
export const CONSTANTS = {
  // ⚙️ FuelEU Maritime Parameters
  TARGET_INTENSITY_GCO2E_PER_MJ: 89.3368,  // 2025 target (gCO2e/MJ)
  DEFAULT_TARGET_YEAR: 2025,

  // 🧮 Physical Constants
  ENERGY_FACTOR_MJ_PER_TON: 41000, // 1 ton fuel = 41,000 MJ
  CARBON_INTENSITY_UNIT: "gCO2e/MJ",

  // 💰 Banking Rules
  BANKING_MAX_YEARS_FORWARD: 2, // Can bank surplus up to 2 years ahead
  BANKING_MIN_SURPLUS_THRESHOLD: 0, // only positive CBs can be banked

  // 🧾 Pooling Rules
  POOL_MIN_TOTAL_CB_REQUIRED: 0, // Σ CB must be >= 0 to form a valid pool
} as const;
