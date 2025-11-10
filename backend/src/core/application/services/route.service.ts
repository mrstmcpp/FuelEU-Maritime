import { IRouteRepository } from "../../ports/route.repository.port";
import { Route } from "../../domain/route.entity";
import { CONSTANTS } from "../../../shared/config/constants";

/**
 * RouteService
 * Handles route data operations, baseline management, and
 * comparison of GHG intensities against FuelEU Maritime target.
 */
export class RouteService {
  private readonly routeRepo: IRouteRepository;

  constructor(routeRepo: IRouteRepository) {
    this.routeRepo = routeRepo;
  }

  /**
   * Fetch all registered routes.
   */
  async getAllRoutes(): Promise<Route[]> {
    return this.routeRepo.findAll();
  }

  /**
   * Set a specific route as the baseline route.
   * Only one route should be baseline per dataset.
   */
  async setBaseline(routeId: string): Promise<Route> {
    return this.routeRepo.setBaseline(routeId);
  }

  /**
   * Compare all routes' GHG intensities against the baseline and target.
   *
   * For each route:
   *   percentDiff = ((routeIntensity / baselineIntensity) - 1) * 100
   *   compliant   = routeIntensity <= TARGET_INTENSITY
   *
   * Returns an array with compliance status and relative difference.
   */
  async compareRoutes(): Promise<
    Array<{
      routeId: string;
      ghgIntensity: number;
      percentDiff: number;
      compliant: boolean;
    }>
  > {
    const routes = await this.routeRepo.findAll();
    const baseline = routes.find((r) => r.isBaseline);

    if (!baseline) {
      throw new Error(
        "No baseline route set. Please mark one route as baseline first."
      );
    }

    const baselineValue = baseline.ghgIntensity;

    return routes.map((route) => {
      const percentDiff = (route.ghgIntensity / baselineValue - 1) * 100;
      const compliant =
        route.ghgIntensity <= CONSTANTS.TARGET_INTENSITY_GCO2E_PER_MJ;

      return {
        routeId: route.routeId,
        ghgIntensity: route.ghgIntensity,
        percentDiff: parseFloat(percentDiff.toFixed(3)),
        compliant,
      };
    });
  }
}
