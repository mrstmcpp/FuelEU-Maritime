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
   * Fetch all routes ordered by year (ascending).
   */
  async findAll(): Promise<Route[]> {
    const routes = await prisma.route.findMany({
      orderBy: { year: "asc" },
    });
    return routes.map(this.mapDecimalFields);
  }

  /**
   * Find all routes for a specific year.
   */
  async findByYear(year: number): Promise<Route[]> {
    const routes = await prisma.route.findMany({
      where: { year },
      orderBy: { routeId: "asc" },
    });
    return routes.map(this.mapDecimalFields);
  }

  /**
   * Find a route by its numeric database ID.
   */
  async findById(id: number): Promise<Route | null> {
    const route = await prisma.route.findUnique({ where: { id } });
    return route ? this.mapDecimalFields(route) : null;
  }

  /**
   * Find a route by its string routeId (external identifier).
   */
  async findByRouteId(routeId: string): Promise<Route | null> {
    const route = await prisma.route.findFirst({ where: { routeId } });
    return route ? this.mapDecimalFields(route) : null;
  }

  /**
   * Mark a route as baseline and unset any previous baseline.
   */
  async setBaseline(routeId: string): Promise<Route> {
    const existing = await prisma.route.findFirst({ where: { routeId } });
    if (!existing) throw new Error(`Route ${routeId} not found.`);

    // Unset any existing baselines
    await prisma.route.updateMany({
      where: { isBaseline: true },
      data: { isBaseline: false },
    });

    // Set the new baseline
    const updated = await prisma.route.update({
      where: { id: existing.id },
      data: { isBaseline: true },
    });

    return this.mapDecimalFields(updated);
  }

  /**
   * Fetch all baseline routes (usually only one exists).
   */
  async findBaselines(): Promise<Route[]> {
    const routes = await prisma.route.findMany({
      where: { isBaseline: true },
    });
    return routes.map(this.mapDecimalFields);
  }

  /**
   * Create a new route record.
   */
  async create(data: Omit<Route, "id" | "createdAt" | "updatedAt">): Promise<Route> {
    const created = await prisma.route.create({ data });
    return this.mapDecimalFields(created);
  }

  /**
   * Converts Prisma Decimal fields to JS numbers.
   */
  private mapDecimalFields(route: any): Route {
    return {
      ...route,
      ghgIntensity: Number(route.ghgIntensity),
    };
  }
}
