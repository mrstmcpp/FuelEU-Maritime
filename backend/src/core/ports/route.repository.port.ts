import { Route } from "../domain/route.entity";

export interface IRouteRepository {
  findAll(): Promise<Route[]>;
  findByYear(year: number): Promise<Route[]>;
  findById(id: number): Promise<Route | null>;
  findByRouteId(routeId: string): Promise<Route | null>;
  setBaseline(routeId: string): Promise<Route>;
  findBaselines(): Promise<Route[]>;
  create(data: Omit<Route, "id" | "createdAt" | "updatedAt">): Promise<Route>;
}
