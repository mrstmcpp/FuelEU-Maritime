import { IRouteRepository } from "../../ports/route.repository.port";
import { Route } from "../../domain/route.entity";

export class RouteService {
  private readonly routeRepo: IRouteRepository;
  private readonly targetIntensity = 89.3368; // gCO2e/MJ

  constructor(routeRepo: IRouteRepository) {
    this.routeRepo = routeRepo;
  }

  async getAllRoutes(): Promise<Route[]> {
    return this.routeRepo.findAll();
  }

  async setBaseline(routeId: string): Promise<Route> {
    return this.routeRepo.setBaseline(routeId);
  }

  async compareRoutes() : Promise<Array<{ routeId: string , ghgIntensity: number, percentDiff : number, compliant: boolean}>> {
    const routes = await this.routeRepo.findAll();
    const baseline = routes.find(route => route.isBaseline);
    if (!baseline) {
      throw new Error("No baseline route set.");
    }
    
    const baselineValue = baseline.ghgIntensity;
    return routes.map(route => {
      const percentDiff = ((route.ghgIntensity / baselineValue) - 1) * 100;
      const compliant = route.ghgIntensity <= this.targetIntensity;
      return {
        routeId: route.routeId,
        ghgIntensity: route.ghgIntensity,
        percentDiff,
        compliant
      };
    });
  }

}