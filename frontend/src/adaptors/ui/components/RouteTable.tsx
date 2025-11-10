import type { Route } from "../../../core/domain/route.entity";

interface Props {
  routes: Route[];
  onSetBaseline: (routeId: string) => void;
}

export function RouteTable({ routes, onSetBaseline }: Props) {
  const headers = [
    "Route ID",
    "Vessel Type",
    "Fuel Type",
    "Year",
    "GHG Intensity (gCO₂e/MJ)",
    "Fuel (t)",
    "Distance (km)",
    "Emissions (t)",
    "Baseline",
    "Action",
  ];

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Inner scroll container */}
      <div className="min-w-[900px]">
        {/* Header */}
        <div className="grid grid-cols-10 bg-gray-100 text-gray-700 font-medium text-sm border-b border-gray-200">
          {headers.map((h) => (
            <div
              key={h}
              className="p-3 text-center whitespace-nowrap select-none"
            >
              {h}
            </div>
          ))}
        </div>

        {/* Data rows */}
        <div className="divide-y divide-gray-100 text-sm text-gray-800">
          {routes.length === 0 ? (
            <div className="p-6 text-center text-gray-400">No routes found.</div>
          ) : (
            routes.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-10 items-center hover:bg-blue-50 transition-colors"
              >
                <div className="p-3 text-center font-mono text-gray-900">
                  {r.routeId}
                </div>
                <div className="p-3 text-center">{r.vesselType}</div>
                <div className="p-3 text-center">{r.fuelType}</div>
                <div className="p-3 text-center">{r.year}</div>
                <div className="p-3 text-center">
                  {r.ghgIntensity.toFixed(2)}
                </div>
                <div className="p-3 text-center">{r.fuelConsumption}</div>
                <div className="p-3 text-center">{r.distance}</div>
                <div className="p-3 text-center">{r.totalEmissions}</div>
                <div className="p-3 text-center">
                  {r.isBaseline ? (
                    <span className="text-green-600 font-semibold">Yes</span>
                  ) : (
                    <span className="text-gray-400">No</span>
                  )}
                </div>
                <div className="p-3 text-center">
                  <button
                    className="rounded-md bg-blue-600 px-3 py-1 text-white text-xs font-medium shadow hover:bg-blue-700 transition"
                    onClick={() => onSetBaseline(r.routeId)}
                  >
                    Set Baseline
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
