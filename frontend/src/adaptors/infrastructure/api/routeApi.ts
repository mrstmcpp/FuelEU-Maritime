import type { Route } from "../../../core/domain/route.entity";
import { mapRouteResponse } from "../mappers/route.mapper";

const BASE_URL = "http://localhost:3000";

export async function getAllRoutes(): Promise<Route[]> {
  const res = await fetch(`${BASE_URL}/routes`);
  const json = await res.json();
  return json.data.map(mapRouteResponse);
}

export async function setBaseline(routeId: string): Promise<Route> {
  const res = await fetch(`${BASE_URL}/routes/${routeId}/baseline`, {
    method: "POST",
  });
  const json = await res.json();
  return mapRouteResponse(json.data);
}

export async function compareRoutes(): Promise<
  { routeId: string; ghgIntensity: number; percentDiff: number; compliant: boolean }[]
> {
  const res = await fetch(`${BASE_URL}/routes/comparison`);
  const json = await res.json();
  return json.data;
}
