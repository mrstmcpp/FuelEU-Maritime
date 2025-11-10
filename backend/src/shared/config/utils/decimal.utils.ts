/**
 * Utility functions for safely converting Prisma Decimal fields
 * to JavaScript numbers while keeping type safety.
 */

type AnyObject = Record<string, unknown>;

/**
 * Converts all specified fields of an object from Decimal (or string) to number.
 */
export function toNumberFields<T extends AnyObject>(
  obj: T,
  keys: (keyof T)[]
): T {
  const clone = { ...obj };

  for (const key of keys) {
    const val = clone[key];

    if (val != null && typeof val === "object" && "toNumber" in (val as any)) {
      // Prisma.Decimal object → call .toNumber()
      (clone as any)[key] = (val as any).toNumber();
    } else if (typeof val === "string" || typeof val === "number") {
      (clone as any)[key] = Number(val);
    }
  }

  return clone;
}

/**
 * Converts Decimal fields for every object in an array.
 */
export function toNumberFieldsArray<T extends AnyObject>(
  arr: T[],
  keys: (keyof T)[]
): T[] {
  return arr.map((obj) => toNumberFields(obj, keys));
}
