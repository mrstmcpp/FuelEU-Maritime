import prisma from "../../../infrastructure/db/prisma";
import { IRouteRepository } from "../../../core/ports/route.repository.port";
import { Route } from "../../../core/domain/route.entity";

export class PrismaRouteRepository implements IRouteRepository {
  async findAll(): Promise<Route[]> {
    return prisma.route.findMany({ orderBy: { year: "asc" } });
  }

  async findByYear(year: number): Promise<Route[]> {
    return prisma.route.findMany({ where: { year } });
  }

  async findById(id: number): Promise<Route | null> {
    return prisma.route.findUnique({ where: { id } });
  }

  async findByRouteId(routeId: string): Promise<Route | null> {
    return prisma.route.findFirst({ where: { routeId } });
  }

  async setBaseline(routeId: string): Promise<Route> {
    return prisma.route.update({
      where: { routeId },
      data: { isBaseline: true },
    });
  }

  async findBaselines(): Promise<Route[]> {
    return prisma.route.findMany({ where: { isBaseline: true } });
  }

  async create(data: Omit<Route, "id" | "createdAt" | "updatedAt">): Promise<Route> {
    return prisma.route.create({ data });
  }
}
