import type { Route } from "../../../core/domain/route.entity";

export function mapRouteResponse(r: any): Route {
  return {
    id: r.id,
    routeId: r.route_id || r.routeId,
    vesselType: r.vesselType || r.vessel_type || "N/A",
    fuelType: r.fuelType || r.fuel_type || "N/A",
    year: r.year,
    ghgIntensity: Number(r.ghg_intensity ?? r.ghgIntensity),
    fuelConsumption: Number(r.fuelConsumption ?? r.fuel_consumption ?? 0),
    distance: Number(r.distance ?? 0),
    totalEmissions: Number(r.totalEmissions ?? r.total_emissions ?? 0),
    isBaseline: Boolean(r.is_baseline ?? r.isBaseline),
  };
}
