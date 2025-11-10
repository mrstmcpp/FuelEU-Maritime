import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getAllRoutes, setBaseline } from "../../../infrastructure/api/route.api";
import { RouteTable } from "../RouteTable";
import type { Route } from "../../../../core/domain/route.entity";

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    vesselType: "",
    fuelType: "",
    year: "",
  });

  const loadRoutes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.vesselType) params.append("vesselType", filters.vesselType);
      if (filters.fuelType) params.append("fuelType", filters.fuelType);
      if (filters.year) params.append("year", filters.year);

      const data = await getAllRoutes(params.toString());
      setRoutes(data);
    } catch {
      toast.error("Failed to load routes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, [filters]);

  const handleSetBaseline = async (routeId: string) => {
    try {
      await setBaseline(routeId);
      toast.success("Baseline updated successfully");
      await loadRoutes();
    } catch {
      toast.error("Failed to update baseline");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Routes Overview</h2>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <select
            className="border border-gray-300 rounded-md text-sm px-2 py-1"
            value={filters.vesselType}
            onChange={(e) =>
              setFilters({ ...filters, vesselType: e.target.value })
            }
          >
            <option value="">All Vessel Types</option>
            <option value="Container">Container</option>
            <option value="BulkCarrier">BulkCarrier</option>
            <option value="Tanker">Tanker</option>
            <option value="RoRo">RoRo</option>
          </select>

          <select
            className="border border-gray-300 rounded-md text-sm px-2 py-1"
            value={filters.fuelType}
            onChange={(e) =>
              setFilters({ ...filters, fuelType: e.target.value })
            }
          >
            <option value="">All Fuel Types</option>
            <option value="HFO">HFO</option>
            <option value="LNG">LNG</option>
            <option value="MGO">MGO</option>
          </select>

          <input
            type="number"
            placeholder="Year"
            className="border border-gray-300 rounded-md text-sm px-2 py-1 w-24"
            value={filters.year}
            onChange={(e) =>
              setFilters({ ...filters, year: e.target.value })
            }
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-10 animate-pulse">
          Loading routes...
        </div>
      ) : (
        <RouteTable routes={routes} onSetBaseline={handleSetBaseline} />
      )}
    </div>
  );
}
