import prisma from "../../../infrastructure/db/prisma.js";
import { IRouteRepository } from "../../../core/ports/route.repository.port.js";
import { Route } from "../../../core/domain/route.entity.js";

/**
 * PrismaRouteRepository
 * Implements IRouteRepository using Prisma ORM.
 * Handles all CRUD and query operations for the Route model.
 */
export class PrismaRouteRepository implements IRouteRepository {
  /**
   * Fetch all routes ordered by year (ascending), then routeId (asc).
   */
  async findAll(filters?: {
    vesselType?: string;
    fuelType?: string;
    year?: number;
  }): Promise<Route[]> {
    const where: any = {};
    if (filters?.vesselType) where.vesselType = filters.vesselType;
    if (filters?.fuelType) where.fuelType = filters.fuelType;
    if (filters?.year) where.year = filters.year;

    return prisma.route.findMany({
      where,
      orderBy: [{ year: "asc" }, { routeId: "asc" }],
    });
  }

  /**
   * Find all routes for a specific year.
   */
  async findByYear(year: number): Promise<Route[]> {
    const routes = await prisma.route.findMany({
      where: { year },
      orderBy: { routeId: "asc" },
    });
    return routes.map(this.mapNumericFields);
  }

  /**
   * Find a route by its numeric database ID.
   */
  async findById(id: number): Promise<Route | null> {
    const route = await prisma.route.findUnique({ where: { id } });
    return route ? this.mapNumericFields(route) : null;
  }

  /**
   * Find a route by its string routeId (external identifier).
   */
  async findByRouteId(routeId: string): Promise<Route | null> {
    const route = await prisma.route.findFirst({ where: { routeId } });
    return route ? this.mapNumericFields(route) : null;
  }

  /**
   * Mark a route as baseline and unset previous baseline for same year.
   */
  async setBaseline(routeId: string): Promise<Route> {
    return await prisma.$transaction(async (tx) => {
      // Find the route to update
      const route = await tx.route.findFirst({ where: { routeId } });
      if (!route) throw new Error("Route not found");

      // Unset all existing baselines (in one query)
      await tx.route.updateMany({
        where: { isBaseline: true },
        data: { isBaseline: false },
      });

      // Set the new one
      const updated = await tx.route.update({
        where: { id: route.id },
        data: { isBaseline: true },
      });

      return {
        ...updated,
        ghgIntensity: Number(updated.ghgIntensity),
      };
    });
  }

  /**
   * Fetch all baseline routes.
   */
  async findBaselines(): Promise<Route[]> {
    const routes = await prisma.route.findMany({ where: { isBaseline: true } });
    return routes.map(this.mapNumericFields);
  }

  /**
   * Create a new route.
   */
  async create(
    data: Omit<Route, "id" | "createdAt" | "updatedAt">
  ): Promise<Route> {
    const created = await prisma.route.create({ data });
    return this.mapNumericFields(created);
  }

  /**
   * Converts numeric/decimal fields from Prisma (Decimal) to JS numbers.
   */
  private mapNumericFields(route: any): Route {
    return {
      ...route,
      ghgIntensity: Number(route.ghgIntensity),
      fuelConsumption: Number(route.fuelConsumption),
      distance: Number(route.distance),
      totalEmissions: Number(route.totalEmissions),
    };
  }
}
